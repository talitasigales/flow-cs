import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BookOpen, CalendarDays, GraduationCap, CheckCircle, FileText, ExternalLink, FileIcon, Layers, ClipboardList, FolderOpen, Clock, Video, Download } from 'lucide-react';
import { ExerciseRenderer } from '@/components/academy/ExerciseRenderer';
import { FeatureLinkCards } from '@/components/academy/FeatureLinkCards';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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

export default function MyDevelopment() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [pdaAxes, setPdaAxes] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [loading, user, navigate]);

  const { data: enrollments = [], isLoading } = useQuery({
    queryKey: ['my-enrollments-detail', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from('program_enrollments')
        .select('id, enrolled_at, class_id, programs(id, name, slug, description), program_classes(id, name, start_date, end_date, video_conference_url, specialist)')
        .eq('user_id', user!.id)
        .order('enrolled_at', { ascending: false });
      return data || [];
    },
  });

  const classIds = enrollments.map((e: any) => e.program_classes?.id).filter(Boolean);

  const { data: allSchedules = [] } = useQuery({
    queryKey: ['my-class-schedules', classIds],
    enabled: classIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from('class_schedules')
        .select('*')
        .in('class_id', classIds)
        .order('schedule_date')
        .order('order_number');
      return data || [];
    },
  });

  const programIds = enrollments.map((e: any) => e.programs?.id).filter(Boolean);

  const { data: allMaterials = [] } = useQuery({
    queryKey: ['my-program-materials', programIds],
    enabled: programIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from('program_materials')
        .select('*')
        .in('program_id', programIds)
        .order('order_number');
      return data || [];
    },
  });

  const { data: allModules = [] } = useQuery({
    queryKey: ['my-program-modules', programIds],
    enabled: programIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from('program_modules')
        .select('*')
        .in('program_id', programIds)
        .order('order_number');
      return data || [];
    },
  });

  const lider360Enrollment = enrollments.find((e: any) => e.programs?.slug === 'lider-360');
  const lider360ProgramId = lider360Enrollment?.programs?.id;

  const { data: existingResponse } = useQuery({
    queryKey: ['workshop-response', lider360ProgramId, user?.id],
    enabled: !!lider360ProgramId && !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from('workshop_responses')
        .select('*')
        .eq('program_id', lider360ProgramId!)
        .eq('user_id', user!.id)
        .maybeSingle();
      return data;
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
      if (!lider360ProgramId || !user?.id) throw new Error('Dados insuficientes');
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
          .insert({ program_id: lider360ProgramId, user_id: user.id, answers: payload });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('Respostas salvas com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['workshop-response'] });
    },
    onError: () => toast.error('Erro ao salvar respostas'),
  });

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

  if (loading || isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AppLayout>
    );
  }

  const getModulesForProgram = (programId: string) =>
    allModules.filter((m: any) => m.program_id === programId);

  const getMaterialsForModule = (moduleId: string) =>
    allMaterials.filter((m: any) => m.module_id === moduleId);

  const getMaterialsWithoutModule = (programId: string) =>
    allMaterials.filter((m: any) => m.program_id === programId && !m.module_id);

  const getFileIcon = (fileType: string | null) => {
    if (fileType === 'link') return <ExternalLink className="w-4 h-4" />;
    if (fileType === 'pdf') return <FileText className="w-4 h-4" />;
    if (fileType === 'video') return <Video className="w-4 h-4" />;
    return <FileIcon className="w-4 h-4" />;
  };

  const getYouTubeId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|live\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
    return match ? match[1] : null;
  };

  const renderMaterialItem = (m: any) => {
    const isVideo = m.file_type === 'video' && m.file_url;
    const ytId = isVideo ? getYouTubeId(m.file_url) : null;

    return (
      <div key={m.id} className="space-y-2">
        <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors">
          <div className="mt-0.5 text-muted-foreground">
            {getFileIcon(m.file_type)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{m.title}</p>
            {m.description && <p className="text-xs text-muted-foreground mt-0.5">{m.description}</p>}
          </div>
          {m.file_url && (
            <Button variant="ghost" size="sm" asChild className="shrink-0">
              <a href={m.file_url} target="_blank" rel="noopener noreferrer">
                {m.file_type === 'pdf' || m.file_type === 'doc' || m.file_type === 'other' ? (
                  <Download className="w-3.5 h-3.5" />
                ) : (
                  <ExternalLink className="w-3.5 h-3.5" />
                )}
              </a>
            </Button>
          )}
        </div>
        {ytId && (
          <div className="rounded-lg overflow-hidden border aspect-video">
            <iframe
              src={`https://www.youtube.com/embed/${ytId}`}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={m.title}
            />
          </div>
        )}
      </div>
    );
  };

  const renderMaterialsByCategory = (materials: any[]) => {
    const categories = ['prework', 'material', 'exercise'];
    const grouped = categories.map(cat => ({
      cat,
      items: materials.filter(m => (m.category || 'material') === cat),
    })).filter(g => g.items.length > 0);

    if (grouped.length === 0) return null;

    return (
      <div className="space-y-5">
        {grouped.map(({ cat, items }) => {
          const config = CATEGORY_LABELS[cat] || CATEGORY_LABELS.material;
          const Icon = config.icon;
          const isPrework = cat === 'prework';
          return (
            <div key={cat} className={cn(
              "space-y-2",
              isPrework && "bg-accent/30 border border-accent rounded-lg p-4"
            )}>
              <h5 className="text-sm font-semibold flex items-center gap-2">
                <Icon className="w-4 h-4 text-primary" />
                {config.label}
                {isPrework && (
                  <Badge variant="secondary" className="text-xs">Antes do início</Badge>
                )}
              </h5>
              <div className="space-y-2">
                {items.map(renderMaterialItem)}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderLider360Questionnaire = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Questionário de Autoconhecimento</CardTitle>
        <CardDescription>Responda com honestidade e profundidade. O objetivo é ampliar sua consciência sobre como você lidera.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {QUESTIONS.map(q => (
          <div key={q.id} className="space-y-2">
            <Label className="text-sm font-medium">{q.label}</Label>
            <Textarea
              value={answers[q.id] || ''}
              onChange={ev => setAnswers(prev => ({ ...prev, [q.id]: ev.target.value }))}
              placeholder="Escreva sua resposta..."
              className="min-h-[90px]"
            />
          </div>
        ))}

        <div className="pt-4 border-t space-y-4">
          <p className="text-sm text-muted-foreground font-medium">Com base no seu relatório PDA, responda:</p>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Ponto forte para liderança:</Label>
            <Textarea
              value={answers['q7_strength'] || ''}
              onChange={ev => setAnswers(prev => ({ ...prev, q7_strength: ev.target.value }))}
              placeholder="Escreva sua resposta..."
              className="min-h-[70px]"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Oportunidade de desenvolvimento:</Label>
            <Textarea
              value={answers['q8_development'] || ''}
              onChange={ev => setAnswers(prev => ({ ...prev, q8_development: ev.target.value }))}
              placeholder="Escreva sua resposta..."
              className="min-h-[70px]"
            />
          </div>
          <div className="space-y-3">
            <Label className="text-sm font-medium">Eixo do PDA relacionado:</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-lg bg-muted/30 border">
              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Baixo</p>
                {PDA_AXES.map(axis => (
                  <div key={`${axis}-baixo`} className="flex items-center gap-2">
                    <Checkbox
                      id={`dev-${axis}-baixo`}
                      checked={pdaAxes[axis] === 'baixo'}
                      onCheckedChange={() => handlePdaChange(axis, 'baixo')}
                    />
                    <label htmlFor={`dev-${axis}-baixo`} className="text-sm cursor-pointer">{axis} baixo</label>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Alto</p>
                {PDA_AXES.map(axis => (
                  <div key={`${axis}-alto`} className="flex items-center gap-2">
                    <Checkbox
                      id={`dev-${axis}-alto`}
                      checked={pdaAxes[axis] === 'alto'}
                      onCheckedChange={() => handlePdaChange(axis, 'alto')}
                    />
                    <label htmlFor={`dev-${axis}-alto`} className="text-sm cursor-pointer">{axis} alto</label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? 'Salvando...' : existingResponse ? 'Atualizar Respostas' : 'Enviar Respostas'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Meu Desenvolvimento</h1>
          <p className="text-muted-foreground text-sm">Acompanhe sua evolução nos programas e turmas em que está matriculado</p>
        </div>

        {enrollments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <GraduationCap className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>Você ainda não está matriculado em nenhum programa.</p>
              <p className="text-xs mt-1">Consulte o Calendário de Turmas para conhecer os próximos programas.</p>
            </CardContent>
          </Card>
        ) : (
          <Accordion type="multiple" defaultValue={enrollments.map((e: any) => e.id)} className="space-y-4">
            {enrollments.map((e: any) => {
              const program = e.programs;
              const cls = e.program_classes;
              const isLider360 = program?.slug === 'lider-360';
              const programModules = program ? getModulesForProgram(program.id) : [];
              const unassignedMaterials = program ? getMaterialsWithoutModule(program.id) : [];

              return (
                <AccordionItem key={e.id} value={e.id} className="border rounded-lg bg-card shadow-sm">
                  <AccordionTrigger className="px-5 py-4 hover:no-underline">
                    <div className="flex items-center gap-3 text-left flex-1">
                      <div className="bg-primary/10 rounded-lg p-3 flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-base">{program?.name || 'Programa'}</h3>
                          <Badge variant="outline" className="text-xs">Matriculado</Badge>
                          {isLider360 && existingResponse && (
                            <Badge variant="secondary" className="text-xs gap-1">
                              <CheckCircle className="w-3 h-3" /> Respondido
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-1">
                          {cls && (
                            <span className="flex items-center gap-1">
                              <GraduationCap className="w-3.5 h-3.5" />
                              {cls.name}
                            </span>
                          )}
                          {cls?.start_date && (
                            <span className="flex items-center gap-1">
                              <CalendarDays className="w-3.5 h-3.5" />
                              {format(new Date(cls.start_date + 'T12:00:00'), "dd/MM/yyyy")}
                              {cls.end_date && ` — ${format(new Date(cls.end_date + 'T12:00:00'), "dd/MM/yyyy")}`}
                            </span>
                          )}
                          {cls?.specialist && (
                            <Badge variant="secondary" className="text-xs">Especialista: {cls.specialist}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent className="px-5 pb-5">
                    {program?.description && (
                      <p className="text-sm text-muted-foreground mb-4">{program.description}</p>
                    )}

                    {cls?.video_conference_url && (
                      <div className="mb-4">
                        <Button variant="outline" size="sm" asChild>
                          <a href={cls.video_conference_url} target="_blank" rel="noopener noreferrer" className="gap-2">
                            <ExternalLink className="w-4 h-4" />
                            Link da Videoconferência
                          </a>
                        </Button>
                      </div>
                    )}

                    {/* Journey Cards */}
                    {(() => {
                      const classSchedules = cls ? allSchedules.filter((s: any) => s.class_id === cls.id) : [];
                      if (classSchedules.length === 0) return null;
                      const today = new Date().toISOString().split('T')[0];
                      return (
                        <div className="mb-6">
                          <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
                            <CalendarDays className="w-4 h-4 text-primary" />
                            Sua Jornada
                            {cls?.specialist && (
                              <Badge variant="secondary" className="text-xs ml-1">Especialista: {cls.specialist}</Badge>
                            )}
                          </h4>
                          <div className="flex gap-3 overflow-x-auto pb-2">
                            {classSchedules.map((s: any, idx: number) => {
                              const isPast = s.schedule_date < today;
                              const isToday = s.schedule_date === today;
                              return (
                                <div
                                  key={s.id}
                                  className={cn(
                                    "flex-shrink-0 w-44 rounded-xl border p-4 space-y-2 transition-all",
                                    isToday && "ring-2 ring-primary border-primary bg-primary/5",
                                    isPast && "opacity-60 bg-muted/30",
                                    !isPast && !isToday && "bg-card hover:shadow-md"
                                  )}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-mono text-muted-foreground">
                                      {format(new Date(s.schedule_date + 'T12:00:00'), 'dd/MM')}
                                    </span>
                                    {isPast && <CheckCircle className="w-4 h-4 text-primary" />}
                                    {isToday && <Badge variant="default" className="text-[10px] px-1.5 py-0">Hoje</Badge>}
                                  </div>
                                  <p className="text-sm font-semibold leading-tight">{s.title}</p>
                                  {s.start_time && s.end_time && (
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {s.start_time.slice(0, 5)} às {s.end_time.slice(0, 5)}
                                    </p>
                                  )}
                                  {isToday && cls?.video_conference_url && (
                                    <Button variant="outline" size="sm" asChild className="w-full mt-1 text-xs">
                                      <a href={cls.video_conference_url} target="_blank" rel="noopener noreferrer" className="gap-1">
                                        <ExternalLink className="w-3 h-3" /> Entrar na aula
                                      </a>
                                    </Button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}

                    {/* General materials (not linked to a specific module) */}
                    {unassignedMaterials.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
                          <FolderOpen className="w-4 h-4 text-primary" />
                          Materiais Gerais do Programa
                        </h4>
                        {renderMaterialsByCategory(unassignedMaterials)}
                      </div>
                    )}

                    {/* Module-based navigation */}
                    {programModules.length > 0 ? (
                      <Tabs
                        defaultValue={programModules[0]?.id}
                        className="space-y-4"
                        onValueChange={(moduleId) => {
                          const mod = programModules.find((m: any) => m.id === moduleId);
                          if (mod) {
                            supabase.rpc('log_user_action', {
                              _action: 'MODULE_ACCESS',
                              _table_name: 'program_modules',
                              _record_id: mod.id,
                              _new_data: { module_title: mod.title, program_name: program?.name },
                            });
                          }
                        }}
                      >
                        <TabsList className="flex-wrap h-auto gap-1">
                          {programModules.map((mod: any) => (
                            <TabsTrigger key={mod.id} value={mod.id} className="gap-1.5 text-xs">
                              <Layers className="w-3.5 h-3.5" />
                              {mod.title}
                            </TabsTrigger>
                          ))}
                        </TabsList>

                        {programModules.map((mod: any) => {
                          const moduleMaterials = getMaterialsForModule(mod.id);
                          const moduleVideos = moduleMaterials.filter((m: any) => m.file_type === 'video' && m.file_url);
                          const moduleSchedule = cls ? allSchedules.find((s: any) => s.class_id === cls.id && s.module_id === mod.id) : null;
                          return (
                            <TabsContent key={mod.id} value={mod.id} className="space-y-4">
                              {mod.description && (
                                <p className="text-sm text-muted-foreground">{mod.description}</p>
                              )}

                              {/* Video embeds for this module */}
                              {moduleVideos.length > 0 && (
                                <div className="space-y-4">
                                  {moduleVideos.map((v: any) => {
                                    // Support multiple videos via video_urls array
                                    const videoUrls: { url: string; title: string | null }[] = 
                                      (v.video_urls && Array.isArray(v.video_urls) && v.video_urls.length > 0)
                                        ? v.video_urls
                                        : v.file_url ? [{ url: v.file_url, title: null }] : [];
                                    
                                    if (videoUrls.length === 0) return null;

                                    return (
                                      <div key={v.id} className="space-y-3">
                                        <h5 className="text-sm font-medium flex items-center gap-2">
                                          <Video className="w-4 h-4 text-primary" />
                                          {v.title}
                                          {videoUrls.length > 1 && (
                                            <Badge variant="secondary" className="text-xs">{videoUrls.length} vídeos</Badge>
                                          )}
                                        </h5>
                                        {v.description && <p className="text-xs text-muted-foreground">{v.description}</p>}
                                        <div className="space-y-3">
                                          {videoUrls.map((vid: any, idx: number) => {
                                            const ytId = getYouTubeId(vid.url);
                                            if (!ytId) return null;
                                            return (
                                              <div key={idx} className="space-y-1">
                                                {vid.title && (
                                                  <p className="text-xs font-medium text-muted-foreground">{vid.title}</p>
                                                )}
                                                <div className="rounded-lg overflow-hidden border aspect-video">
                                                  <iframe
                                                    src={`https://www.youtube.com/embed/${ytId}`}
                                                    className="w-full h-full"
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                    allowFullScreen
                                                    title={vid.title || v.title}
                                                  />
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {renderMaterialsByCategory(moduleMaterials.filter((m: any) => m.file_type !== 'video'))}

                              {/* Dynamic exercises */}
                              <ExerciseRenderer moduleId={mod.id} />

                              {/* Platform feature links */}
                              <FeatureLinkCards moduleId={mod.id} />

                              {moduleMaterials.length === 0 && (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                  Nenhum material disponível neste módulo ainda.
                                </p>
                              )}

                              <div className="flex justify-end pt-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-2"
                                  onClick={() => {
                                    supabase.rpc('log_user_action', {
                                      _action: 'MODULE_COMPLETED',
                                      _table_name: 'program_modules',
                                      _record_id: mod.id,
                                      _new_data: { module_title: mod.title, program_name: program?.name },
                                    }).then(() => {
                                      toast.success(`Módulo "${mod.title}" marcado como concluído!`);
                                    });
                                  }}
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  Marcar como concluído
                                </Button>
                              </div>
                            </TabsContent>
                          );
                        })}
                      </Tabs>
                    ) : (
                      <>
                        {/* Líder 360 Questionnaire (no modules) */}
                        {isLider360 && renderLider360Questionnaire()}

                        {!isLider360 && unassignedMaterials.length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            Nenhum material disponível para este programa ainda.
                          </p>
                        )}
                      </>
                    )}

                    {/* Show Líder 360 questionnaire after module tabs if modules exist */}
                    {isLider360 && programModules.length > 0 && (
                      <div className="mt-4">
                        {renderLider360Questionnaire()}
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </div>
    </AppLayout>
  );
}
