import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface PDICheckinDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pdiId: string;
  checkinNumber: number;
  onSuccess: () => void;
}

export default function PDICheckinDialog({ 
  open, 
  onOpenChange, 
  pdiId, 
  checkinNumber,
  onSuccess 
}: PDICheckinDialogProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    checkin_date: new Date().toISOString().split('T')[0],
    what_worked: '',
    best_moment: '',
    what_didnt_work: '',
    obstacles: '',
    biggest_effort: '',
    who_can_help: '',
    new_ideas: '',
    overall_status: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error: checkinError } = await (supabase as any)
        .from('pdi_checkins')
        .insert({
          ...formData,
          pdi_id: pdiId,
          checkin_number: checkinNumber,
          created_by: user?.id
        });

      if (checkinError) throw checkinError;

      // Atualizar etapa do PDI para "Acompanhamento" (etapa 4)
      const { error: pdiError } = await (supabase as any)
        .from('pdis')
        .update({ 
          current_step: 4,
          status: 'acompanhamento'
        })
        .eq('id', pdiId);

      if (pdiError) throw pdiError;

      toast.success('Check-in registrado com sucesso!');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao registrar check-in:', error);
      toast.error('Erro ao registrar check-in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Check-in #{checkinNumber} - Acompanhamento do PDI</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="checkin_date">Data do Check-in</Label>
            <Input
              id="checkin_date"
              type="date"
              value={formData.checkin_date}
              onChange={(e) => setFormData({ ...formData, checkin_date: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="what_worked">O que deu certo?</Label>
              <Textarea
                id="what_worked"
                value={formData.what_worked}
                onChange={(e) => setFormData({ ...formData, what_worked: e.target.value })}
                rows={3}
                placeholder="Descreva o que funcionou bem..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="best_moment">Qual foi o melhor momento?</Label>
              <Textarea
                id="best_moment"
                value={formData.best_moment}
                onChange={(e) => setFormData({ ...formData, best_moment: e.target.value })}
                rows={3}
                placeholder="Relate o momento mais positivo..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="what_didnt_work">O que não deu certo?</Label>
              <Textarea
                id="what_didnt_work"
                value={formData.what_didnt_work}
                onChange={(e) => setFormData({ ...formData, what_didnt_work: e.target.value })}
                rows={3}
                placeholder="Descreva o que não funcionou..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="obstacles">Quais foram os obstáculos?</Label>
              <Textarea
                id="obstacles"
                value={formData.obstacles}
                onChange={(e) => setFormData({ ...formData, obstacles: e.target.value })}
                rows={3}
                placeholder="Liste os principais desafios..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="biggest_effort">Qual foi seu maior esforço?</Label>
              <Textarea
                id="biggest_effort"
                value={formData.biggest_effort}
                onChange={(e) => setFormData({ ...formData, biggest_effort: e.target.value })}
                rows={3}
                placeholder="Descreva onde você mais se dedicou..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="who_can_help">O que/quem pode ajudar?</Label>
              <Textarea
                id="who_can_help"
                value={formData.who_can_help}
                onChange={(e) => setFormData({ ...formData, who_can_help: e.target.value })}
                rows={3}
                placeholder="Identifique recursos e pessoas..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new_ideas">Novas ideias de ação?</Label>
            <Textarea
              id="new_ideas"
              value={formData.new_ideas}
              onChange={(e) => setFormData({ ...formData, new_ideas: e.target.value })}
              rows={3}
              placeholder="Compartilhe novas ideias que surgiram..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="overall_status">Status Geral</Label>
            <Select
              value={formData.overall_status}
              onValueChange={(value) => setFormData({ ...formData, overall_status: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Como está o andamento?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="on_track">🟢 No Caminho - Tudo conforme planejado</SelectItem>
                <SelectItem value="at_risk">🟡 Em Risco - Necessita atenção</SelectItem>
                <SelectItem value="delayed">🔴 Atrasado - Requer intervenção</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Registrar Check-in'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
