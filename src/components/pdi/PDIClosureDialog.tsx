import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PDIClosureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pdiId: string;
  onSuccess: () => void;
}

export default function PDIClosureDialog({ 
  open, 
  onOpenChange, 
  pdiId,
  onSuccess 
}: PDIClosureDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    closure_date: new Date().toISOString().split('T')[0],
    final_status: '',
    main_learnings: '',
    what_accomplished: '',
    what_not_accomplished: '',
    satisfaction_score: 50,
    what_was_missing: '',
    next_steps: '',
    gains_obtained: '',
    still_needs_development: '',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error: closureError } = await supabase
        .from('pdi_closures')
        .insert({
          pdi_id: pdiId,
          closure_date: formData.closure_date,
          final_status: formData.final_status || null,
          main_learnings: formData.main_learnings || null,
          what_accomplished: formData.what_accomplished || null,
          what_not_accomplished: formData.what_not_accomplished || null,
          satisfaction_score: formData.satisfaction_score,
          what_was_missing: formData.what_was_missing || null,
          next_steps: formData.next_steps || null,
          gains_obtained: formData.gains_obtained || null,
          still_needs_development: formData.still_needs_development || null,
          notes: formData.notes || null,
        });

      if (closureError) throw closureError;

      // Update PDI to stage 5 and status completed
      const { error: pdiError } = await supabase
        .from('pdis')
        .update({ 
          current_stage: 5,
          status: 'completed'
        })
        .eq('id', pdiId);

      if (pdiError) throw pdiError;

      toast.success('PDI concluído com sucesso!');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao fechar PDI:', error);
      toast.error('Erro ao fechar PDI');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Fechamento do PDI - Avaliação Final</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="closure_date">Data de Fechamento</Label>
            <Input
              id="closure_date"
              type="date"
              value={formData.closure_date}
              onChange={(e) => setFormData({ ...formData, closure_date: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="final_status">Como está finalizando seu PDI?</Label>
            <Textarea
              id="final_status"
              value={formData.final_status}
              onChange={(e) => setFormData({ ...formData, final_status: e.target.value })}
              rows={3}
              placeholder="Descreva como você se sente ao concluir este ciclo..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="what_accomplished">O que você realizou?</Label>
              <Textarea
                id="what_accomplished"
                value={formData.what_accomplished}
                onChange={(e) => setFormData({ ...formData, what_accomplished: e.target.value })}
                rows={3}
                placeholder="Liste suas conquistas..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="what_not_accomplished">O que você não conseguiu realizar?</Label>
              <Textarea
                id="what_not_accomplished"
                value={formData.what_not_accomplished}
                onChange={(e) => setFormData({ ...formData, what_not_accomplished: e.target.value })}
                rows={3}
                placeholder="O que ficou pendente..."
              />
            </div>
          </div>

          <div className="space-y-4 p-4 bg-muted rounded-lg">
            <div className="space-y-2">
              <Label>Nota de Satisfação (0-100)</Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[formData.satisfaction_score]}
                  onValueChange={(value) => setFormData({ ...formData, satisfaction_score: value[0] })}
                  max={100}
                  step={1}
                  className="flex-1"
                />
                <span className="font-bold text-2xl text-primary w-16 text-center">
                  {formData.satisfaction_score}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="what_was_missing">O que faltou para chegar aos 100%?</Label>
              <Textarea
                id="what_was_missing"
                value={formData.what_was_missing}
                onChange={(e) => setFormData({ ...formData, what_was_missing: e.target.value })}
                rows={2}
                placeholder="Identifique o que poderia ter sido diferente..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="main_learnings">Quais foram seus maiores aprendizados?</Label>
            <Textarea
              id="main_learnings"
              value={formData.main_learnings}
              onChange={(e) => setFormData({ ...formData, main_learnings: e.target.value })}
              rows={4}
              placeholder="Compartilhe seus principais aprendizados..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gains_obtained">Quais ganhos você obteve?</Label>
            <Textarea
              id="gains_obtained"
              value={formData.gains_obtained}
              onChange={(e) => setFormData({ ...formData, gains_obtained: e.target.value })}
              rows={3}
              placeholder="Descreva os benefícios alcançados..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="still_needs_development">O que você ainda precisa desenvolver?</Label>
              <Textarea
                id="still_needs_development"
                value={formData.still_needs_development}
                onChange={(e) => setFormData({ ...formData, still_needs_development: e.target.value })}
                rows={3}
                placeholder="Identifique áreas para continuar..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="next_steps">O que você fará a partir de agora?</Label>
              <Textarea
                id="next_steps"
                value={formData.next_steps}
                onChange={(e) => setFormData({ ...formData, next_steps: e.target.value })}
                rows={3}
                placeholder="Defina seus próximos passos..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações gerais</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              placeholder="Notas adicionais..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Concluir PDI'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
