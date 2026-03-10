import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { CheckCircle, Check, X, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Question {
  id: string;
  text: string;
  type: string;
  options?: string[];
  min?: number;
  max?: number;
}

interface Exercise {
  id: string;
  title: string;
  description?: string;
  exercise_type: string;
  questions: Question[];
}

interface Props {
  moduleId: string;
}

export function ExerciseRenderer({ moduleId }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: exercises = [] } = useQuery({
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

  if (exercises.length === 0) return null;

  return (
    <div className="space-y-4">
      <h5 className="text-sm font-semibold flex items-center gap-2">
        <ClipboardList className="w-4 h-4 text-primary" />
        Exercícios
      </h5>
      {exercises.map((ex: Exercise) => (
        <ExerciseCard key={ex.id} exercise={ex} userId={user?.id} />
      ))}
    </div>
  );
}

function ExerciseCard({ exercise, userId }: { exercise: Exercise; userId?: string }) {
  const queryClient = useQueryClient();
  const [answers, setAnswers] = useState<Record<string, any>>({});

  const { data: existingResponse } = useQuery({
    queryKey: ['exercise-response', exercise.id, userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('exercise_responses')
        .select('*')
        .eq('exercise_id', exercise.id)
        .eq('user_id', userId)
        .maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (existingResponse?.answers) {
      setAnswers(existingResponse.answers as Record<string, any>);
    }
  }, [existingResponse]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('Não autenticado');
      if (existingResponse) {
        const { error } = await (supabase as any)
          .from('exercise_responses')
          .update({ answers, updated_at: new Date().toISOString() })
          .eq('id', existingResponse.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from('exercise_responses')
          .insert({ exercise_id: exercise.id, user_id: userId, answers });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('Respostas salvas!');
      queryClient.invalidateQueries({ queryKey: ['exercise-response', exercise.id] });
    },
    onError: () => toast.error('Erro ao salvar'),
  });

  const questions: Question[] = exercise.questions || [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{exercise.title}</CardTitle>
          {existingResponse && (
            <Badge variant="outline" className="gap-1 text-primary border-primary/30 text-xs">
              <CheckCircle className="w-3 h-3" /> Respondido
            </Badge>
          )}
        </div>
        {exercise.description && <CardDescription>{exercise.description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-5">
        {questions.map((q, idx) => (
          <div key={q.id} className="space-y-2">
            <Label className="text-sm font-medium flex items-start gap-2">
              <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                {idx + 1}
              </span>
              {q.text}
            </Label>

            {q.type === 'open_text' && (
              <Textarea
                value={answers[q.id] || ''}
                onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                placeholder="Escreva sua resposta..."
                className="min-h-[90px] ml-8"
              />
            )}

            {q.type === 'multiple_choice' && (
              <RadioGroup
                value={answers[q.id] || ''}
                onValueChange={val => setAnswers(prev => ({ ...prev, [q.id]: val }))}
                className="ml-8 space-y-2"
              >
                {q.options?.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <RadioGroupItem value={opt} id={`${q.id}-${i}`} />
                    <label htmlFor={`${q.id}-${i}`} className="text-sm cursor-pointer">{opt}</label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {q.type === 'scale' && (
              <div className="ml-8 space-y-2">
                <Slider
                  value={[answers[q.id] || q.min || 1]}
                  onValueChange={([val]) => setAnswers(prev => ({ ...prev, [q.id]: val }))}
                  min={q.min || 1}
                  max={q.max || 10}
                  step={1}
                  className="w-full max-w-sm"
                />
                <div className="flex justify-between text-xs text-muted-foreground max-w-sm">
                  <span>{q.min || 1}</span>
                  <span className="font-semibold text-foreground">{answers[q.id] || q.min || 1}</span>
                  <span>{q.max || 10}</span>
                </div>
              </div>
            )}

            {q.type === 'yes_no' && (
              <div className="flex gap-3 ml-8">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAnswers(prev => ({ ...prev, [q.id]: true }))}
                  className={cn(
                    "flex-1 max-w-[120px] gap-2 transition-all",
                    answers[q.id] === true && "bg-primary text-primary-foreground border-primary"
                  )}
                >
                  <Check className="w-4 h-4" /> Sim
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAnswers(prev => ({ ...prev, [q.id]: false }))}
                  className={cn(
                    "flex-1 max-w-[120px] gap-2 transition-all",
                    answers[q.id] === false && "bg-destructive text-destructive-foreground border-destructive"
                  )}
                >
                  <X className="w-4 h-4" /> Não
                </Button>
              </div>
            )}

            {q.type === 'checklist' && (
              <div className="ml-8 space-y-2">
                {q.options?.map((opt, i) => {
                  const selected: string[] = answers[q.id] || [];
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <Checkbox
                        id={`${q.id}-${i}`}
                        checked={selected.includes(opt)}
                        onCheckedChange={(checked) => {
                          setAnswers(prev => {
                            const current: string[] = prev[q.id] || [];
                            return {
                              ...prev,
                              [q.id]: checked
                                ? [...current, opt]
                                : current.filter(v => v !== opt),
                            };
                          });
                        }}
                      />
                      <label htmlFor={`${q.id}-${i}`} className="text-sm cursor-pointer">{opt}</label>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}

        <div className="pt-4 flex justify-end">
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? 'Salvando...' : existingResponse ? 'Atualizar Respostas' : 'Enviar Respostas'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
