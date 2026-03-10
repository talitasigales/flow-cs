import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle, CalendarDays, ExternalLink, MapPin, Clock, BookOpen, Layers, FileText, FileIcon, ClipboardList, FolderOpen } from 'lucide-react';
import { ExerciseRenderer } from '@/components/academy/ExerciseRenderer';
import { FeatureLinkCards } from '@/components/academy/FeatureLinkCards';

const QUESTIONS = [
  { id: 'q1', label: '1. Como você descreveria seu estilo de gestão?' },
  { id: 'q2', label: '2. O que você acredita que faz muito bem como líder?' },
  { id: 'q3', label: '3. Em que situações você sente que sua liderança é mais forte?' },
  { id: 'q4', label: '4. Em que contextos você percebe que perde desempenho ou clareza?' },
  { id: 'q5', label: '5. Se seu time pudesse descrevê-lo com sinceridade absoluta, o que diria?' },
  { id: 'q6', label: '6. O que você tem feito intencionalmente para evoluir como líder?' },
];

const PDA_AXES = ['Risco', 'Extroversão', 'Paciência', 'Norma', 'Autocontrole'];

const CATEGORY_LABELS: Record<string, { label: string; icon: any }> = {
  prework: { label: 'Pre-work', icon: ClipboardList },
  material: { label: 'Materiais', icon: FolderOpen },
  exercise: { label: 'Exercícios', icon: FileText },
};

export default function ProgramLider360() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [pdaAxes, setPdaAxes] = useState<Record<string, string>>({});

  const { data: program } = useQuery({
    queryKey: ['program-lider-360'],
    queryFn: async () => {
      const { data } = await supabase.from('programs').select('id').eq('slug', 'lider-360').single();
      return data;
    },
  });

  const { data: existingResponse, isLoading: loadingResponse } = useQuery({
    queryKey: ['workshop-response', program?.id, user?.id],
    enabled: !!program?.id && !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from('workshop_responses')
        .select('*')
        .eq('program_id', program!.id)
        .eq('user_id', user!.id)
        .maybeSingle();
      return data;
    },
  });

  const { data: events = [] } = useQuery({
    queryKey: ['program-events'],
    queryFn: async () => {
      const { data } = await supabase
        .from('program_events')
        .select('*')
        .gte('event_date', new Date().toISOString().split('T')[0])
        .order('event_date', { ascending: true });
      return data || [];
    },
  });

  const { data: modules = [] } = useQuery({
    queryKey: ['program-modules-lider360', program?.id],
    enabled: !!program?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from('program_modules')
        .select('*')
        .eq('program_id', program!.id)
        .order('order_number');
      return data || [];
    },
  });

  const { data: materials = [] } = useQuery({
    queryKey: ['program-materials-lider360', program?.id],
    enabled: !!program?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from('program_materials')
        .select('*')
        .eq('program_id', program!.id)
        .order('order_number');
      return data || [];
    },
  });

  useEffect(() => {
    if (existingResponse?.answers) {
      const saved = existingResponse.answers as Record<string, any>;
      const textAnswers: Record<string, string> = {};
      QUESTIONS.forEach(q => { textAnswers[q.id] = saved[q.id] || ''; });
      textAnswers['q7_strength'] = saved['q7_strength'] || '';
      textAnswers['q8_development'] = saved['q8_development'] || '';
      setAnswers(textAnswers);
      setPdaAxes(saved['q9_pda_axes'] || {});
    }
  }, [existingResponse]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!program?.id || !user?.id) throw new Error('Dados insuficientes');
      const payload = { ...answers, q9_pda_axes: pdaAxes };
      if (existingResponse) {
        const { error } = await supabase
          .from('workshop_responses')
          .update({ answers: payload, updated_at: new Date().toISOString() })
          .eq('id', existingResponse.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('workshop_responses')
          .insert({ program_id: program.id, user_id: user.id, answers: payload });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('Respostas salvas com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['workshop-response'] });
    },
    onError: () => toast.error('Erro ao salvar respostas'),
  });

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [authLoading, user, navigate]);

  if (authLoading || loadingResponse) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AppLayout>
    );
  }

  const handlePdaChange = (axis: string, level: string) => {
    setPdaAxes(prev => {
      if (prev[axis] === level) {
        const next = { ...prev };
        delete next[axis];
        return next;
      }
      return { ...prev, [axis]: level };
    });
  };

  const getFileIcon = (fileType: string | null) => {
    if (fileType === 'link') return <ExternalLink className="w-4 h-4" />;
    if (fileType === 'pdf') return <FileText className="w-4 h-4" />;
    return <FileIcon className="w-4 h-4" />;
  };

  const renderMaterialItem = (m: any) => (
    <div key={m.id} className="flex items-start gap-3 p-3 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors">
      <div className="mt-0.5 text-muted-foreground">{getFileIcon(m.file_type)}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{m.title}</p>
        {m.description && <p className="text-xs text-muted-foreground mt-0.5">{m.description}</p>}
      </div>
      {m.file_url && (
        <Button variant="ghost" size="sm" asChild className="shrink-0">
          <a href={m.file_url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </Button>
      )}
    </div>
  );

  const renderMaterialsByCategory = (mats: any[]) => {
    const categories = ['prework', 'material', 'exercise'];
    const grouped = categories.map(cat => ({
      cat,
      items: mats.filter(m => (m.category || 'material') === cat),
    })).filter(g => g.items.length > 0);

    if (grouped.length === 0) return null;
    return (
      <div className="space-y-4">
        {grouped.map(({ cat, items }) => {
          const config = CATEGORY_LABELS[cat] || CATEGORY_LABELS.material;
          const Icon = config.icon;
          return (
            <div key={cat} className="space-y-2">
              <h5 className="text-sm font-semibold flex items-center gap-2">
                <Icon className="w-4 h-4 text-primary" />
                {config.label}
              </h5>
              <div className="space-y-2">{items.map(renderMaterialItem)}</div>
            </div>
          );
        })}
      </div>
    );
  };

  const getMaterialsForModule = (moduleId: string) =>
    materials.filter((m: any) => m.module_id === moduleId);

  const hasModules = modules.length > 0;

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold gradient-text">Líder 360</h1>
            <p className="text-muted-foreground text-sm">Workshop de Autogestão — Questionário de Autoconhecimento</p>
          </div>
          {existingResponse && (
            <Badge variant="outline" className="gap-1 text-primary border-primary/30">
              <CheckCircle className="w-3 h-3" /> Respondido
            </Badge>
          )}
        </div>

        <Tabs defaultValue={hasModules ? 'modulos' : 'exercicios'}>
          <TabsList className="w-full sm:w-auto">
            {hasModules && (
              <TabsTrigger value="modulos" className="gap-1.5"><Layers className="w-4 h-4" /> Módulos</TabsTrigger>
            )}
            <TabsTrigger value="exercicios" className="gap-1.5"><BookOpen className="w-4 h-4" /> Exercícios</TabsTrigger>
            <TabsTrigger value="calendario" className="gap-1.5"><CalendarDays className="w-4 h-4" /> Calendário</TabsTrigger>
          </TabsList>

          {/* MÓDULOS TAB */}
          {hasModules && (
            <TabsContent value="modulos" className="mt-4">
              <Tabs defaultValue={modules[0]?.id}>
                <TabsList className="flex-wrap h-auto gap-1">
                  {modules.map((mod: any) => (
                    <TabsTrigger key={mod.id} value={mod.id} className="gap-1.5 text-xs">
                      {mod.title}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {modules.map((mod: any) => {
                  const moduleMaterials = getMaterialsForModule(mod.id);
                  return (
                    <TabsContent key={mod.id} value={mod.id} className="space-y-4 mt-4">
                      {mod.description && <p className="text-sm text-muted-foreground">{mod.description}</p>}
                      {renderMaterialsByCategory(moduleMaterials)}
                      {moduleMaterials.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Nenhum material disponível neste módulo ainda.
                        </p>
                      )}
                    </TabsContent>
                  );
                })}
              </Tabs>
            </TabsContent>
          )}

          <TabsContent value="exercicios" className="space-y-6 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Questionário de Autoconhecimento</CardTitle>
                <CardDescription>Responda com honestidade e profundidade. Evite respostas superficiais. O objetivo é ampliar sua consciência sobre como você lidera — e qual impacto gera.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {QUESTIONS.map(q => (
                  <div key={q.id} className="space-y-2">
                    <Label className="text-sm font-medium">{q.label}</Label>
                    <Textarea
                      value={answers[q.id] || ''}
                      onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                      placeholder="Escreva sua resposta..."
                      className="min-h-[100px]"
                    />
                  </div>
                ))}

                <div className="pt-4 border-t space-y-4">
                  <p className="text-sm text-muted-foreground font-medium">Com base no que você identificou no seu relatório de análise de perfil comportamental PDA, responda:</p>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Qual característica do meu perfil natural considero como um ponto forte para minha posição de liderança?</Label>
                    <Textarea
                      value={answers['q7_strength'] || ''}
                      onChange={e => setAnswers(prev => ({ ...prev, q7_strength: e.target.value }))}
                      placeholder="Escreva sua resposta..."
                      className="min-h-[80px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Qual característica do meu perfil natural percebo como uma oportunidade de desenvolvimento na minha posição de liderança?</Label>
                    <Textarea
                      value={answers['q8_development'] || ''}
                      onChange={e => setAnswers(prev => ({ ...prev, q8_development: e.target.value }))}
                      placeholder="Escreva sua resposta..."
                      className="min-h-[80px]"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Qual eixo do PDA está relacionado a essa característica?</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-lg bg-muted/30 border">
                      <div className="space-y-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Baixo</p>
                        {PDA_AXES.map(axis => (
                          <div key={`${axis}-baixo`} className="flex items-center gap-2">
                            <Checkbox
                              id={`${axis}-baixo`}
                              checked={pdaAxes[axis] === 'baixo'}
                              onCheckedChange={() => handlePdaChange(axis, 'baixo')}
                            />
                            <label htmlFor={`${axis}-baixo`} className="text-sm cursor-pointer">{axis} baixo</label>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Alto</p>
                        {PDA_AXES.map(axis => (
                          <div key={`${axis}-alto`} className="flex items-center gap-2">
                            <Checkbox
                              id={`${axis}-alto`}
                              checked={pdaAxes[axis] === 'alto'}
                              onCheckedChange={() => handlePdaChange(axis, 'alto')}
                            />
                            <label htmlFor={`${axis}-alto`} className="text-sm cursor-pointer">{axis} alto</label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} size="lg">
                    {saveMutation.isPending ? 'Salvando...' : existingResponse ? 'Atualizar Respostas' : 'Enviar Respostas'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calendario" className="mt-4">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Próximos Programas e Workshops da Grou</h2>
              {events.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p>Nenhum evento agendado no momento.</p>
                  </CardContent>
                </Card>
              ) : (
                events.map((event: any) => (
                  <Card key={event.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-5 flex flex-col sm:flex-row gap-4">
                      <div className="flex-shrink-0 text-center sm:text-left">
                        <div className="bg-primary/10 rounded-lg p-3 inline-block">
                          <p className="text-2xl font-bold text-primary">{format(new Date(event.event_date), 'dd')}</p>
                          <p className="text-xs font-medium text-primary uppercase">{format(new Date(event.event_date), 'MMM yyyy', { locale: ptBR })}</p>
                        </div>
                      </div>
                      <div className="flex-1 space-y-1">
                        <h3 className="font-semibold text-base">{event.title}</h3>
                        {event.description && <p className="text-sm text-muted-foreground">{event.description}</p>}
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground pt-1">
                          {event.event_time && (
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{event.event_time.slice(0, 5)}</span>
                          )}
                          {event.location && (
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{event.location}</span>
                          )}
                        </div>
                      </div>
                      {event.external_url && (
                        <div className="flex items-center">
                          <Button variant="outline" size="sm" asChild>
                            <a href={event.external_url} target="_blank" rel="noopener noreferrer" className="gap-1.5">
                              <ExternalLink className="w-3.5 h-3.5" /> Inscreva-se
                            </a>
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
