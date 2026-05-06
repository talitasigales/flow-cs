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
      const { error } = await (supabase as any).from('profile_evolution').insert({
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
        profile_modification: formData.modificacao_perfil,
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Editar Valores REPNA e Indicadores</DialogTitle>
          <DialogDescription>
            Ajuste os valores entre 0 e 100 para cada dimensão do perfil
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 overflow-y-auto pr-2 flex-1">
          <div className="grid grid-cols-2 gap-4">
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
          </div>

          <div className="space-y-1 pt-2">
            <h4 className="font-semibold text-sm">Valores REPNA</h4>
          </div>

          {(['r', 'e', 'p', 'n', 'a'] as const).map((key) => {
            const labels: Record<string, string> = {
              r: 'R', e: 'E', p: 'P', n: 'N', a: 'A',
            };
            return (
              <div key={key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>{labels[key]}</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={formData[key]}
                    onChange={(e) => setFormData({ ...formData, [key]: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) })}
                    className="w-20 h-8 text-center"
                  />
                </div>
                <Slider
                  min={0}
                  max={100}
                  step={1}
                  value={[formData[key]]}
                  onValueChange={(value) => setFormData({ ...formData, [key]: value[0] })}
                />
              </div>
            );
          })}

          <div className="border-t border-border pt-4 mt-4 space-y-1">
            <h4 className="font-semibold text-sm">Indicadores Complementares</h4>
          </div>

          {[
            { key: 'tomada_decisoes' as const, label: 'Tomada de Decisões' },
            { key: 'intensidade_perfil' as const, label: 'Intensidade do Perfil' },
            { key: 'energia' as const, label: 'Energia (NE)' },
            { key: 'equilibrio_energia' as const, label: 'Equilíbrio de Energia' },
            { key: 'modificacao_perfil' as const, label: 'Modificação do Perfil' },
          ].map(({ key, label }) => (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{label}</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={formData[key]}
                  onChange={(e) => setFormData({ ...formData, [key]: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) })}
                  className="w-20 h-8 text-center"
                />
              </div>
              <Slider
                min={0}
                max={100}
                step={1}
                value={[formData[key]]}
                onValueChange={(value) => setFormData({ ...formData, [key]: value[0] })}
              />
            </div>
          ))}

          <div className="space-y-2 pt-2">
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
