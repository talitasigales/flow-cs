import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Pencil } from 'lucide-react';
import { z } from 'zod';

const profileSchema = z.object({
  r: z.number().min(0, 'Valor mínimo é 0').max(100, 'Valor máximo é 100'),
  e: z.number().min(0, 'Valor mínimo é 0').max(100, 'Valor máximo é 100'),
  p: z.number().min(0, 'Valor mínimo é 0').max(100, 'Valor máximo é 100'),
  n: z.number().min(0, 'Valor mínimo é 0').max(100, 'Valor máximo é 100'),
  a: z.number().min(0, 'Valor mínimo é 0').max(100, 'Valor máximo é 100'),
  tomada_decisoes: z.number().min(0, 'Valor mínimo é 0').max(100, 'Valor máximo é 100'),
  intensidade_perfil: z.number().min(0, 'Valor mínimo é 0').max(100, 'Valor máximo é 100'),
  energia: z.number().min(0, 'Valor mínimo é 0').max(100, 'Valor máximo é 100'),
  equilibrio_energia: z.number().min(0, 'Valor mínimo é 0').max(100, 'Valor máximo é 100'),
  modificacao_perfil: z.number().min(0, 'Valor mínimo é 0').max(100, 'Valor máximo é 100'),
});

interface EditProfileDialogProps {
  profileId: string;
  currentData: {
    r: number;
    e: number;
    p: number;
    n: number;
    a: number;
    tomada_decisoes: number;
    intensidade_perfil: number;
    energia: number;
    equilibrio_energia: number;
    modificacao_perfil: number;
  };
  onSuccess: () => void;
}

export function EditProfileDialog({ profileId, currentData, onSuccess }: EditProfileDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(currentData);

  const handleSliderChange = (field: string, value: number[]) => {
    setFormData(prev => ({ ...prev, [field]: value[0] }));
  };

  const handleInputChange = (field: string, value: string) => {
    const numValue = parseInt(value);
    if (!isNaN(numValue)) {
      setFormData(prev => ({ ...prev, [field]: Math.min(100, Math.max(0, numValue)) }));
    }
  };

  const handleSubmit = async () => {
    try {
      // Validate data
      const validatedData = profileSchema.parse(formData);
      
      setLoading(true);

      const { error } = await supabase
        .from('profile_evolution')
        .update({
          analysis_result: validatedData
        })
        .eq('id', profileId);

      if (error) throw error;

      toast.success('Perfil atualizado com sucesso!');
      setOpen(false);
      onSuccess();
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        console.error('Error updating profile:', error);
        toast.error('Erro ao atualizar perfil');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2"
      >
        <Pencil className="h-4 w-4" />
        Editar Valores
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Valores REPNA e Indicadores</DialogTitle>
            <DialogDescription>
              Ajuste os valores entre 0 e 100 para cada dimensão do perfil
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* REPNA Values */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm">Valores REPNA</h4>
              
              {(['r', 'e', 'p', 'n', 'a'] as const).map((key) => (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium uppercase">{key}</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={formData[key]}
                      onChange={(e) => handleInputChange(key, e.target.value)}
                      className="w-20 text-center"
                    />
                  </div>
                  <Slider
                    value={[formData[key]]}
                    onValueChange={(value) => handleSliderChange(key, value)}
                    min={0}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>
              ))}
            </div>

            {/* Complementary Indicators */}
            <div className="space-y-4 border-t pt-4">
              <h4 className="font-semibold text-sm">Indicadores Complementares</h4>
              
              {[
                { key: 'tomada_decisoes' as const, label: 'Tomada de Decisões' },
                { key: 'intensidade_perfil' as const, label: 'Intensidade do Perfil' },
                { key: 'energia' as const, label: 'Energia (NE)' },
                { key: 'equilibrio_energia' as const, label: 'Equilíbrio de Energia' },
                { key: 'modificacao_perfil' as const, label: 'Modificação do Perfil' },
              ].map(({ key, label }) => (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">{label}</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={formData[key]}
                      onChange={(e) => handleInputChange(key, e.target.value)}
                      className="w-20 text-center"
                    />
                  </div>
                  <Slider
                    value={[formData[key]]}
                    onValueChange={(value) => handleSliderChange(key, value)}
                    min={0}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
