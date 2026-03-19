import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PDIActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pdiId: string;
  action?: any;
  onSuccess: () => void;
}

const ACTION_TYPES = [
  { value: 'experience', label: '🟢 Experiência (70%)', description: 'Aprendizado através da prática' },
  { value: 'social', label: '🟡 Aprendizado Social (20%)', description: 'Aprendizado com mentoria e interação' },
  { value: 'formal', label: '🔵 Educação Formal (10%)', description: 'Cursos, treinamentos, leituras' }
];

export default function PDIActionDialog({ 
  open, 
  onOpenChange, 
  pdiId, 
  action,
  onSuccess 
}: PDIActionDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    action_type: '',
    specific: '',
    measurable: '',
    achievable: '',
    relevant: '',
    time_bound: '',
    start_date: '',
    end_date: ''
  });

  useEffect(() => {
    if (action) {
      setFormData({
        description: action.description || '',
        action_type: action.action_type || '',
        specific: action.specific || '',
        measurable: action.measurable || '',
        achievable: action.achievable || '',
        relevant: action.relevant || '',
        time_bound: action.time_bound || '',
        start_date: action.start_date || '',
        end_date: action.end_date || ''
      });
    } else {
      setFormData({
        description: '',
        action_type: '',
        specific: '',
        measurable: '',
        achievable: '',
        relevant: '',
        time_bound: '',
        start_date: '',
        end_date: ''
      });
    }
  }, [action, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description.trim() || !formData.action_type) {
      toast.error('Preencha a descrição e o tipo da ação');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        description: formData.description,
        action_type: formData.action_type,
        specific: formData.specific || null,
        measurable: formData.measurable || null,
        achievable: formData.achievable || null,
        relevant: formData.relevant || null,
        time_bound: formData.time_bound || null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
      };

      if (action) {
        const { error } = await supabase
          .from('pdi_actions')
          .update(payload)
          .eq('id', action.id);
        
        if (error) throw error;
        toast.success('Ação atualizada com sucesso!');
      } else {
        const { error } = await supabase
          .from('pdi_actions')
          .insert({ ...payload, pdi_id: pdiId });
        
        if (error) throw error;
        toast.success('Ação criada com sucesso!');
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar ação:', error);
      toast.error('Erro ao salvar ação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{action ? 'Editar Ação' : 'Nova Ação SMART'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Descrição da Ação *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              required
              placeholder="Descreva a ação de desenvolvimento..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="action_type">Tipo de Aprendizado (70/20/10) *</Label>
            <Select
              value={formData.action_type}
              onValueChange={(value) => setFormData({ ...formData, action_type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {ACTION_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div>
                      <div className="font-medium">{type.label}</div>
                      <div className="text-xs text-muted-foreground">{type.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3 p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium">Critérios SMART</p>
            
            <div className="space-y-2">
              <Label htmlFor="specific">S - Específico (O quê?)</Label>
              <Textarea
                id="specific"
                value={formData.specific}
                onChange={(e) => setFormData({ ...formData, specific: e.target.value })}
                rows={2}
                placeholder="O que exatamente será feito?"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="measurable">M - Mensurável (Como medir?)</Label>
              <Textarea
                id="measurable"
                value={formData.measurable}
                onChange={(e) => setFormData({ ...formData, measurable: e.target.value })}
                rows={2}
                placeholder="Como será medido o progresso?"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="achievable">A - Atingível (É possível?)</Label>
              <Textarea
                id="achievable"
                value={formData.achievable}
                onChange={(e) => setFormData({ ...formData, achievable: e.target.value })}
                rows={2}
                placeholder="É realista e alcançável?"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="relevant">R - Relevante (Por quê?)</Label>
              <Textarea
                id="relevant"
                value={formData.relevant}
                onChange={(e) => setFormData({ ...formData, relevant: e.target.value })}
                rows={2}
                placeholder="Por que é importante?"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time_bound">T - Temporal (Quando?)</Label>
              <Textarea
                id="time_bound"
                value={formData.time_bound}
                onChange={(e) => setFormData({ ...formData, time_bound: e.target.value })}
                rows={2}
                placeholder="Qual o prazo?"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Data de Início</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">Data Limite</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Ação'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
