import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { UserPlus, Loader2 } from 'lucide-react';

interface EnrollYoungDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  programId: string;
  psychologistId: string;
}

export function EnrollYoungDialog({ open, onOpenChange, programId, psychologistId }: EnrollYoungDialogProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [encounterCount, setEncounterCount] = useState<1 | 5>(5);

  const enrollMutation = useMutation({
    mutationFn: async () => {
      if (!email.trim()) throw new Error('Email obrigatório');

      // First try to find existing user by email
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('email', email.trim().toLowerCase())
        .maybeSingle();

      const youngUserId = existingProfile?.user_id;

      if (youngUserId) {
        // Check if assignment already exists
        const { data: existing } = await supabase
          .from('bussola_assignments' as any)
          .select('id')
          .eq('psychologist_id', psychologistId)
          .eq('young_user_id', youngUserId)
          .eq('program_id', programId)
          .maybeSingle();

        if (existing) throw new Error('Este jovem já está cadastrado para você');
      }

      // If user exists, use their ID; otherwise use invite-user to create account
      if (!youngUserId) {
        // Invite user with 'young' role
        const { error: inviteError } = await supabase.functions.invoke('invite-user', {
          body: { email: email.trim().toLowerCase(), role: 'young', full_name: name.trim() },
        });
        if (inviteError) throw inviteError;

        // Wait briefly then get the new user's profile
        await new Promise(r => setTimeout(r, 2000));
        const { data: newProfile } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('email', email.trim().toLowerCase())
          .maybeSingle();

        if (!newProfile?.user_id) throw new Error('Não foi possível encontrar o perfil do jovem após o convite');

        const { error } = await supabase
          .from('bussola_assignments' as any)
          .insert({
            psychologist_id: psychologistId,
            young_user_id: newProfile.user_id,
            program_id: programId,
            encounter_count: encounterCount,
            young_name: name.trim(),
            young_email: email.trim().toLowerCase(),
          });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('bussola_assignments' as any)
          .insert({
            psychologist_id: psychologistId,
            young_user_id: youngUserId,
            program_id: programId,
            encounter_count: encounterCount,
            young_name: name.trim(),
            young_email: email.trim().toLowerCase(),
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['psychologist-assignments'] });
      toast.success('Jovem cadastrado com sucesso!');
      setName('');
      setEmail('');
      setEncounterCount(5);
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Erro ao cadastrar jovem');
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Cadastrar Jovem
          </DialogTitle>
          <DialogDescription>
            Cadastre um jovem para iniciar a jornada Bússola.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="young-name">Nome completo</Label>
            <Input
              id="young-name"
              placeholder="Nome do jovem"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="young-email">Email</Label>
            <Input
              id="young-email"
              type="email"
              placeholder="email@exemplo.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Tipo de atendimento</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setEncounterCount(1)}
                className={`rounded-xl border-2 p-4 text-left transition-all ${
                  encounterCount === 1
                    ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                    : 'border-border hover:border-primary/40'
                }`}
              >
                <p className="font-bold text-foreground">Avulso</p>
                <p className="text-xs text-muted-foreground mt-1">1 encontro individual</p>
              </button>
              <button
                type="button"
                onClick={() => setEncounterCount(5)}
                className={`rounded-xl border-2 p-4 text-left transition-all ${
                  encounterCount === 5
                    ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                    : 'border-border hover:border-primary/40'
                }`}
              >
                <p className="font-bold text-foreground">Completo</p>
                <p className="text-xs text-muted-foreground mt-1">5 encontros + boas-vindas</p>
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => enrollMutation.mutate()}
            disabled={enrollMutation.isPending || !email.trim()}
            className="gap-2"
          >
            {enrollMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Cadastrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
