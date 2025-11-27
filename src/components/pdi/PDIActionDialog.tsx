import { useState } from 'react';
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

const LEARNING_TYPES = [
  { value: 'experience', label: '🟢 Experiência (70%)', description: 'Aprendizado através da prática' },
  { value: 'mentoring', label: '🟡 Mentoria (20%)', description: 'Aprendizado com orientação' },
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
    title: action?.title || '',
    description: action?.description || '',
    learning_type: action?.learning_type || '',
    what_to_do: action?.what_to_do || '',
    how_to_do: action?.how_to_do || '',
    why_to_do: action?.why_to_do || '',
    where_to_do: action?.where_to_do || '',
    when_to_do: action?.when_to_do || '',
    due_date: action?.due_date || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (action) {
        const { error } = await supabase
          .from('pdi_actions')
          .update(formData)
          .eq('id', action.id);
        
        if (error) throw error;
        toast.success('Ação atualizada com sucesso!');
      } else {
        const { error } = await supabase
          .from('pdi_actions')
          .insert({ ...formData, pdi_id: pdiId });
        
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
            <Label htmlFor="title">Título da Ação</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="learning_type">Tipo de Aprendizado (70/20/10)</Label>
            <Select
              value={formData.learning_type}
              onValueChange={(value) => setFormData({ ...formData, learning_type: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {LEARNING_TYPES.map((type) => (
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="what_to_do">O quê fazer?</Label>
              <Textarea
                id="what_to_do"
                value={formData.what_to_do}
                onChange={(e) => setFormData({ ...formData, what_to_do: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="how_to_do">Como fazer?</Label>
              <Textarea
                id="how_to_do"
                value={formData.how_to_do}
                onChange={(e) => setFormData({ ...formData, how_to_do: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="why_to_do">Por quê fazer?</Label>
              <Textarea
                id="why_to_do"
                value={formData.why_to_do}
                onChange={(e) => setFormData({ ...formData, why_to_do: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="where_to_do">Onde fazer?</Label>
              <Textarea
                id="where_to_do"
                value={formData.where_to_do}
                onChange={(e) => setFormData({ ...formData, where_to_do: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="when_to_do">Quando fazer?</Label>
            <Textarea
              id="when_to_do"
              value={formData.when_to_do}
              onChange={(e) => setFormData({ ...formData, when_to_do: e.target.value })}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="due_date">Data Limite</Label>
            <Input
              id="due_date"
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição Detalhada</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
            />
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
