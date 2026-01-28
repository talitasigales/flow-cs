import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Plus } from 'lucide-react';
import { ProfileFormData, getDefaultFormData } from './types';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ProfileFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingYears: number[];
  onSuccess: () => void;
  userId?: string;
}

export function ProfileFormDialog({
  open,
  onOpenChange,
  existingYears,
  onSuccess,
  userId,
}: ProfileFormDialogProps) {
  const [formData, setFormData] = useState<ProfileFormData>(getDefaultFormData());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReset = () => {
    setFormData(getDefaultFormData());
  };

  const handleClose = () => {
    onOpenChange(false);
    handleReset();
  };

  const handleSubmit = async () => {
    console.log('ProfileFormDialog: handleSubmit called', { formData, userId });

    if (!formData.employee_name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    if (!formData.year) {
      toast.error('Ano é obrigatório');
      return;
    }

    if (existingYears.includes(formData.year)) {
      toast.error('Já existe um perfil para este ano');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('profile_evolution').insert({
        user_id: userId,
        employee_name: formData.employee_name,
        assessment_date: `${formData.year}-01-01`,
        r_value: formData.r,
        e_value: formData.e,
        p_value: formData.p,
        n_value: formData.n,
        a_value: formData.a,
        decision_making: formData.tomada_decisoes,
        profile_intensity: formData.intensidade_perfil,
        energy: formData.energia,
        energy_balance: formData.equilibrio_energia,
        notes: formData.notes,
      });

      if (error) throw error;

      toast.success('Perfil adicionado com sucesso');
      handleClose();
      onSuccess();
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Erro ao salvar perfil');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) handleReset();
    }}>
      <DialogTrigger asChild>
        <Button className="gradient-primary">
          <Plus className="mr-2 h-4 w-4" />
          Adicionar novo relatório PDA
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Adicionar Perfil Anual</DialogTitle>
          <DialogDescription>
            Registre os scores do seu perfil PDA para comparação ao longo dos anos
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="employee_name">Nome do Colaborador</Label>
            <Input
              id="employee_name"
              type="text"
              value={formData.employee_name}
              onChange={(e) => setFormData({ ...formData, employee_name: e.target.value })}
              placeholder="Ex: João Silva"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="year">Ano</Label>
            <Input
              id="year"
              type="number"
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
              min="2000"
              max="2100"
            />
          </div>

          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {/* REPNA Values */}
            {(['r', 'e', 'p', 'n', 'a'] as const).map((key) => {
              const labels: Record<string, string> = {
                r: 'R (Risco)',
                e: 'E (Extroversão)',
                p: 'P (Paciência)',
                n: 'N (Normas)',
                a: 'A (Autocontrole)',
              };
              return (
                <div key={key} className="space-y-2">
                  <Label htmlFor={key}>{labels[key]} (0-100)</Label>
                  <Input
                    id={key}
                    type="number"
                    min="0"
                    max="100"
                    value={formData[key]}
                    onChange={(e) => setFormData({ ...formData, [key]: parseInt(e.target.value) || 0 })}
                  />
                </div>
              );
            })}

            {/* Complementary Analysis */}
            <div className="border-t border-border pt-4 mt-4">
              <h4 className="font-semibold mb-3 text-sm">Análise Complementar</h4>

              <div className="space-y-6">
                {[
                  { key: 'tomada_decisoes' as const, label: 'Tomada de Decisões' },
                  { key: 'intensidade_perfil' as const, label: 'Intensidade do Perfil' },
                  { key: 'energia' as const, label: 'Energia' },
                  { key: 'equilibrio_energia' as const, label: 'Equilíbrio de Energia' },
                  { key: 'modificacao_perfil' as const, label: 'Modificação do Perfil' },
                ].map(({ key, label }) => (
                  <div key={key} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={key}>{label}</Label>
                      <span className="text-sm font-medium">{formData[key]}%</span>
                    </div>
                    <Slider
                      id={key}
                      min={0}
                      max={100}
                      step={1}
                      value={[formData[key]]}
                      onValueChange={(value) => setFormData({ ...formData, [key]: value[0] })}
                      className="w-full"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Adicione notas sobre este período..."
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : 'Adicionar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
