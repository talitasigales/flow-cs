import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus, Trash2, Pencil, GripVertical, X } from 'lucide-react';

const EXERCISE_TYPES = [
  { value: 'open_text', label: 'Dissertativo (texto livre)' },
  { value: 'multiple_choice', label: 'Múltipla escolha' },
  { value: 'scale', label: 'Escala/Avaliação' },
  { value: 'yes_no', label: 'Sim/Não' },
  { value: 'checklist', label: 'Checklist (múltiplas seleções)' },
];

interface Question {
  id: string;
  text: string;
  type: string;
  options?: string[];
  min?: number;
  max?: number;
}

interface Props {
  moduleId: string;
  moduleTitle: string;
}

export function ModuleExerciseManager({ moduleId, moduleTitle }: Props) {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [exerciseType, setExerciseType] = useState('open_text');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [saving, setSaving] = useState(false);

  const { data: exercises = [], refetch } = useQuery({
    queryKey: ['module-exercises', moduleId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('module_exercises')
        .select('*')
        .eq('module_id', moduleId)
        .order('order_number');
      return data || [];
    },
  });

  const resetForm = () => {
    setEditingExercise(null);
    setTitle('');
    setDescription('');
    setExerciseType('open_text');
    setQuestions([]);
  };

  const openDialog = (exercise?: any) => {
    if (exercise) {
      setEditingExercise(exercise);
      setTitle(exercise.title);
      setDescription(exercise.description || '');
      setExerciseType(exercise.exercise_type);
      setQuestions(exercise.questions || []);
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const addQuestion = () => {
    const newQ: Question = {
      id: `q${Date.now()}`,
      text: '',
      type: exerciseType,
      ...(exerciseType === 'multiple_choice' || exerciseType === 'checklist' ? { options: ['', ''] } : {}),
      ...(exerciseType === 'scale' ? { min: 1, max: 10 } : {}),
    };
    setQuestions([...questions, newQ]);
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const updated = [...questions];
    (updated[index] as any)[field] = value;
    setQuestions(updated);
  };

  const updateQuestionOption = (qIndex: number, optIndex: number, value: string) => {
    const updated = [...questions];
    if (updated[qIndex].options) {
      updated[qIndex].options![optIndex] = value;
      setQuestions(updated);
    }
  };

  const addOption = (qIndex: number) => {
    const updated = [...questions];
    updated[qIndex].options = [...(updated[qIndex].options || []), ''];
    setQuestions(updated);
  };

  const removeOption = (qIndex: number, optIndex: number) => {
    const updated = [...questions];
    updated[qIndex].options = updated[qIndex].options!.filter((_, i) => i !== optIndex);
    setQuestions(updated);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Título é obrigatório');
      return;
    }
    if (questions.length === 0) {
      toast.error('Adicione pelo menos uma pergunta');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        module_id: moduleId,
        title: title.trim(),
        description: description.trim() || null,
        exercise_type: exerciseType,
        questions,
        order_number: editingExercise ? editingExercise.order_number : exercises.length,
      };

      if (editingExercise) {
        const { error } = await (supabase as any)
          .from('module_exercises')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', editingExercise.id);
        if (error) throw error;
        toast.success('Exercício atualizado');
      } else {
        const { error } = await (supabase as any)
          .from('module_exercises')
          .insert(payload);
        if (error) throw error;
        toast.success('Exercício criado');
      }
      setDialogOpen(false);
      resetForm();
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar exercício');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await (supabase as any).from('module_exercises').delete().eq('id', id);
    if (error) {
      toast.error('Erro ao remover exercício');
    } else {
      toast.success('Exercício removido');
      refetch();
    }
  };

  const getTypeLabel = (type: string) =>
    EXERCISE_TYPES.find(t => t.value === type)?.label || type;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Exercícios — {moduleTitle}</h4>
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => openDialog()}>
          <Plus className="w-3.5 h-3.5" /> Novo Exercício
        </Button>
      </div>

      {exercises.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">Nenhum exercício neste módulo.</p>
      ) : (
        <div className="space-y-2">
          {exercises.map((ex: any) => (
            <div key={ex.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
              <div>
                <p className="text-sm font-medium">{ex.title}</p>
                <div className="flex gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">{getTypeLabel(ex.exercise_type)}</Badge>
                  <Badge variant="secondary" className="text-xs">{(ex.questions as any[])?.length || 0} perguntas</Badge>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => openDialog(ex)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(ex.id)} className="text-destructive hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingExercise ? 'Editar Exercício' : 'Criar Exercício'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Questionário de Autoconhecimento" />
              </div>
              <div className="space-y-2">
                <Label>Tipo de Exercício</Label>
                <Select value={exerciseType} onValueChange={setExerciseType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXERCISE_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descrição (opcional)</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Instruções para o aluno..." className="min-h-[60px]" />
            </div>

            <div className="border-t pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Perguntas ({questions.length})</Label>
                <Button size="sm" variant="outline" onClick={addQuestion} className="gap-1.5">
                  <Plus className="w-3.5 h-3.5" /> Pergunta
                </Button>
              </div>

              {questions.map((q, idx) => (
                <Card key={q.id} className="p-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold mt-1">
                      {idx + 1}
                    </span>
                    <div className="flex-1 space-y-2">
                      <Input
                        value={q.text}
                        onChange={e => updateQuestion(idx, 'text', e.target.value)}
                        placeholder="Texto da pergunta..."
                      />
                      {(q.type === 'multiple_choice' || q.type === 'checklist') && (
                        <div className="space-y-2 pl-2">
                          <Label className="text-xs text-muted-foreground">Opções:</Label>
                          {q.options?.map((opt, optIdx) => (
                            <div key={optIdx} className="flex gap-2 items-center">
                              <Input
                                value={opt}
                                onChange={e => updateQuestionOption(idx, optIdx, e.target.value)}
                                placeholder={`Opção ${optIdx + 1}`}
                                className="text-sm"
                              />
                              {(q.options?.length || 0) > 2 && (
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeOption(idx, optIdx)}>
                                  <X className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          ))}
                          <Button variant="ghost" size="sm" onClick={() => addOption(idx)} className="text-xs">
                            + Adicionar opção
                          </Button>
                        </div>
                      )}
                      {q.type === 'scale' && (
                        <div className="flex gap-4 pl-2">
                          <div className="space-y-1">
                            <Label className="text-xs">Mín</Label>
                            <Input type="number" value={q.min || 1} onChange={e => updateQuestion(idx, 'min', Number(e.target.value))} className="w-20" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Máx</Label>
                            <Input type="number" value={q.max || 10} onChange={e => updateQuestion(idx, 'max', Number(e.target.value))} className="w-20" />
                          </div>
                        </div>
                      )}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeQuestion(idx)} className="text-destructive hover:text-destructive h-8 w-8">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando...' : editingExercise ? 'Atualizar' : 'Criar Exercício'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
