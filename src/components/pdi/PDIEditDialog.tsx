import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PDA_AXES } from '@/data/pdiTemplates';

interface PDIEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pdi: any;
  onSuccess: () => void;
}

const getQuestionIndex = (key: string, fallback: number) => {
  const match = key.match(/(\d+)/);
  if (!match) return fallback;
  const parsed = parseInt(match[1], 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

export default function PDIEditDialog({ open, onOpenChange, pdi, onSuccess }: PDIEditDialogProps) {
  const axisInfo = PDA_AXES[pdi?.pda_axis];
  const [saving, setSaving] = useState(false);
  const [employeeName, setEmployeeName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [notes, setNotes] = useState('');
  const [ratings, setRatings] = useState<number[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);

  useEffect(() => {
    if (!open || !pdi) return;

    setEmployeeName(pdi.employee_name ?? '');
    setStartDate(pdi.start_date ?? '');
    setTargetDate(pdi.target_date ?? '');
    setNotes(pdi.notes ?? '');

    const behaviors: string[] = axisInfo?.behaviors ?? [];
    const stored: any[] = Array.isArray(pdi.behavior_assessments) ? pdi.behavior_assessments : [];
    setRatings(
      behaviors.map((behavior, index) => {
        const match = stored.find((item) => item?.behavior === behavior) ?? stored[index];
        const value = Number(match?.rating);
        return Number.isFinite(value) ? value : 5;
      }),
    );

    const questions: string[] = axisInfo?.reflectiveQuestions ?? [];
    const storedAnswers: Record<string, string> = pdi.reflective_answers ?? {};
    const byIndex: Record<number, string> = {};
    Object.entries(storedAnswers).forEach(([key, value], i) => {
      byIndex[getQuestionIndex(key, i)] = typeof value === 'string' ? value : '';
    });
    setAnswers(questions.map((_, index) => byIndex[index] ?? ''));
  }, [open, pdi, axisInfo]);

  const handleSave = async () => {
    if (!employeeName.trim()) {
      toast.error('Informe o nome da pessoa em desenvolvimento');
      return;
    }

    setSaving(true);
    try {
      const behaviors: string[] = axisInfo?.behaviors ?? [];
      const behaviorAssessments = behaviors.map((behavior, index) => ({
        behavior,
        rating: ratings[index] ?? 5,
      }));

      const reflectiveAnswers = (axisInfo?.reflectiveQuestions ?? []).reduce(
        (acc: Record<string, string>, _question, index) => {
          acc[`question_${index}`] = answers[index] ?? '';
          return acc;
        },
        {},
      );

      const { error } = await supabase
        .from('pdis')
        .update({
          employee_name: employeeName.trim(),
          start_date: startDate || null,
          target_date: targetDate || null,
          notes: notes.trim() || null,
          behavior_assessments: behaviorAssessments,
          reflective_answers: reflectiveAnswers,
        })
        .eq('id', pdi.id);

      if (error) throw error;

      toast.success('PDI atualizado com sucesso!');
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Erro ao atualizar PDI:', error);
      toast.error('Erro ao atualizar PDI');
    } finally {
      setSaving(false);
    }
  };

  if (!pdi) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Editar PDI</DialogTitle>
          <DialogDescription>
            Atualize os dados gerais e tudo que você escreveu na autoavaliação.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 pr-1">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pdi-employee-name">Nome</Label>
              <Input
                id="pdi-employee-name"
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pdi-start-date">Data de início</Label>
                <Input
                  id="pdi-start-date"
                  type="date"
                  value={startDate ?? ''}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pdi-target-date">Prazo</Label>
                <Input
                  id="pdi-target-date"
                  type="date"
                  value={targetDate ?? ''}
                  onChange={(e) => setTargetDate(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pdi-notes">Notas</Label>
              <Textarea
                id="pdi-notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold">Autoavaliação — comportamentos</h4>
            {(axisInfo?.behaviors ?? []).map((behavior: string, index: number) => (
              <div key={behavior} className="space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <p className="text-sm">{behavior}</p>
                  <span className="text-sm font-bold text-primary shrink-0">
                    {ratings[index] ?? 5}/10
                  </span>
                </div>
                <Slider
                  min={1}
                  max={10}
                  step={1}
                  value={[ratings[index] ?? 5]}
                  onValueChange={(value) =>
                    setRatings((prev) => {
                      const next = [...prev];
                      next[index] = value[0];
                      return next;
                    })
                  }
                />
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold">Respostas reflexivas</h4>
            {(axisInfo?.reflectiveQuestions ?? []).map((question: string, index: number) => (
              <div key={question} className="space-y-2">
                <Label className="text-sm text-muted-foreground">
                  {index + 1}. {question}
                </Label>
                <Textarea
                  rows={3}
                  value={answers[index] ?? ''}
                  onChange={(e) =>
                    setAnswers((prev) => {
                      const next = [...prev];
                      next[index] = e.target.value;
                      return next;
                    })
                  }
                />
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar alterações'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
