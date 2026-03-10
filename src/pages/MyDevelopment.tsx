import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  BookOpen, CalendarDays, GraduationCap, CheckCircle, FileText,
  ExternalLink, Layers, Video, ChevronRight, ChevronDown, FolderOpen, ClipboardList
} from 'lucide-react';
import { ExerciseRenderer } from '@/components/academy/ExerciseRenderer';
import { FeatureLinkCards } from '@/components/academy/FeatureLinkCards';
import { PdaReportUpload } from '@/components/PdaReportUpload';
import { JourneyTimeline } from '@/components/academy/JourneyTimeline';
import { ProgramMaterials } from '@/components/academy/ProgramMaterials';
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

function ModuleEmptyState({ moduleId, hasMaterials }: { moduleId: string; hasMaterials: boolean }) {
  const { data: exercises = [] } = useQuery({
    queryKey: ['module-exercises-check', moduleId],
    queryFn: async () => {
      const { data } = await supabase.from('module_exercises').select('id').eq('module_id', moduleId).limit(1);
      return data || [];
    },
  });
  const { data: featureLinks = [] } = useQuery({
    queryKey: ['module-feature-links-check', moduleId],
    queryFn: async () => {
      const { data } = await supabase.from('module_feature_links').select('id').eq('module_id', moduleId).limit(1);
      return data || [];
    },
  });
  if (hasMaterials || exercises.length > 0 || featureLinks.length > 0) return null;
  return <p className="text-xs text-muted-foreground text-center py-3">Nenhum material neste módulo.</p>;
}

const PDA_AXES = ['Risco', 'Extroversão', 'Paciência', 'Norma', 'Autocontrole'];

export default function MyDevelopment() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [pdaAxes, setPdaAxes] = useState<Record<string, string>>({});
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [exerciseModuleId, setExerciseModuleId] = useState<string | null>(null);
  const [contentTab, setContentTab] = useState<string>('modulos');

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

  const moduleIds = allModules.map((m: any) => m.id);

  // Fetch class_modules to know which modules are assigned to each class
  const { data: allClassModules = [] } = useQuery({
    queryKey: ['my-class-modules', classIds],
    enabled: classIds.length > 0,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('class_modules')
        .select('class_id, module_id')
        .in('class_id', classIds);
      return data || [];
    },
  });

  const { data: allExercises = [] } = useQuery({
    queryKey: ['my-module-exercises', moduleIds],
    enabled: moduleIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from('module_exercises')
        .select('id, module_id')
        .in('module_id', moduleIds);
      return data || [];
    },
  });

  const getExercisesForModule = (moduleId: string) =>
    allExercises.filter((ex: any) => ex.module_id === moduleId);

  const { data: specialists = [] } = useQuery({
    queryKey: ['specialists'],
    queryFn: async () => {
      const { data } = await (supabase as any).from('specialists').select('*');
      return data || [];
    },
  });

  const getSpecialist = (name: string | null) =>
    name ? specialists.find((s: any) => s.name.toLowerCase().trim() === name.toLowerCase().trim()) : null;

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
    setPdaAxes(prev => prev[axis] === level ? (() => { const n = { ...prev }; delete n[axis]; return n; })() : { ...prev, [axis]: level });
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

  const getModulesForProgram = (programId: string, classId?: string) => {
    const programModules = allModules.filter((m: any) => m.program_id === programId);
    // If class has specific modules assigned, filter by them
    if (classId) {
      const classModuleIds = allClassModules
        .filter((cm: any) => cm.class_id === classId)
        .map((cm: any) => cm.module_id);
      // If class_modules records exist for this class, filter; otherwise show all
      if (classModuleIds.length > 0) {
        return programModules.filter((m: any) => classModuleIds.includes(m.id));
      }
    }
    return programModules;
  };
  const getMaterialsForModule = (moduleId: string) => allMaterials.filter((m: any) => m.module_id === moduleId);
  const getMaterialsWithoutModule = (programId: string) => allMaterials.filter((m: any) => m.program_id === programId && !m.module_id);

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
            <Textarea value={answers[q.id] || ''} onChange={ev => setAnswers(prev => ({ ...prev, [q.id]: ev.target.value }))} placeholder="Escreva sua resposta..." className="min-h-[90px]" />
          </div>
        ))}
        <div className="pt-4 border-t space-y-4">
          <p className="text-sm text-muted-foreground font-medium">Com base no seu relatório PDA, responda:</p>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Ponto forte para liderança:</Label>
            <Textarea value={answers['q7_strength'] || ''} onChange={ev => setAnswers(prev => ({ ...prev, q7_strength: ev.target.value }))} placeholder="Escreva sua resposta..." className="min-h-[70px]" />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Oportunidade de desenvolvimento:</Label>
            <Textarea value={answers['q8_development'] || ''} onChange={ev => setAnswers(prev => ({ ...prev, q8_development: ev.target.value }))} placeholder="Escreva sua resposta..." className="min-h-[70px]" />
          </div>
          <div className="space-y-3">
            <Label className="text-sm font-medium">Eixo do PDA relacionado:</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-lg bg-muted/30 border">
              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Baixo</p>
                {PDA_AXES.map(axis => (
                  <div key={`${axis}-baixo`} className="flex items-center gap-2">
                    <Checkbox id={`dev-${axis}-baixo`} checked={pdaAxes[axis] === 'baixo'} onCheckedChange={() => handlePdaChange(axis, 'baixo')} />
                    <label htmlFor={`dev-${axis}-baixo`} className="text-sm cursor-pointer">{axis} baixo</label>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Alto</p>
                {PDA_AXES.map(axis => (
                  <div key={`${axis}-alto`} className="flex items-center gap-2">
                    <Checkbox id={`dev-${axis}-alto`} checked={pdaAxes[axis] === 'alto'} onCheckedChange={() => handlePdaChange(axis, 'alto')} />
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

  const renderEnrollmentCard = (e: any) => {
    const program = e.programs;
    const cls = e.program_classes;
    const isLider360 = program?.slug === 'lider-360';
    const programModules = program ? getModulesForProgram(program.id, cls?.id) : [];
    const unassignedMaterials = program ? getMaterialsWithoutModule(program.id) : [];
    const classSchedules = cls ? allSchedules.filter((s: any) => s.class_id === cls.id) : [];
    const today = new Date().toISOString().split('T')[0];
    const specialist = getSpecialist(cls?.specialist);

    // Find the current/next module based on schedule
    const currentSchedule = classSchedules.find((s: any) => s.schedule_date >= today);

    return (
      <div key={e.id} className="space-y-6">
        {/* Program Header Card */}
        <Card className="overflow-hidden border-primary/20">
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-bold">{program?.name || 'Programa'}</h2>
                  <Badge variant="outline" className="text-xs border-primary/40 text-primary">Matriculado</Badge>
                  {isLider360 && existingResponse && (
                    <Badge variant="secondary" className="text-xs gap-1">
                      <CheckCircle className="w-3 h-3" /> Respondido
                    </Badge>
                  )}
                </div>
                {program?.description && (
                  <p className="text-sm text-muted-foreground max-w-xl">{program.description}</p>
                )}
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground pt-1">
                   {cls && (
                     <span className="flex items-center gap-1">
                       <GraduationCap className="w-3.5 h-3.5" />
                       Turma: <span className="font-medium text-foreground">{cls.name}</span>
                     </span>
                   )}
                   {cls?.start_date && (
                     <span className="flex items-center gap-1">
                       <CalendarDays className="w-3.5 h-3.5" />
                       {format(new Date(cls.start_date + 'T12:00:00'), "dd/MM/yyyy")}
                       {cls.end_date && ` — ${format(new Date(cls.end_date + 'T12:00:00'), "dd/MM/yyyy")}`}
                     </span>
                   )}
                 </div>
                 {cls?.video_conference_url && (
                   <a href={cls.video_conference_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline mt-1">
                     <Video className="w-3.5 h-3.5" />
                     {cls.video_conference_url}
                   </a>
                 )}

                {/* Specialist card */}
                {specialist && (
                  <div className="flex items-center gap-3 mt-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                    {specialist.avatar_url ? (
                      <img src={specialist.avatar_url} alt={specialist.name} className="w-12 h-12 rounded-full object-cover shrink-0 ring-2 ring-primary/20" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <BookOpen className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Especialista</p>
                      <p className="text-sm font-semibold">{specialist.name}</p>
                      {specialist.bio && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{specialist.bio}</p>}
                    </div>
                  </div>
                )}
                {cls?.specialist && !specialist && (
                  <p className="text-xs text-muted-foreground mt-2">
                    <BookOpen className="w-3.5 h-3.5 inline mr-1" />
                    Especialista: <span className="font-medium text-foreground">{cls.specialist}</span>
                  </p>
                )}
              </div>
              {cls?.video_conference_url && (
                <Button size="sm" asChild className="shrink-0 gap-2">
                  <a href={cls.video_conference_url} target="_blank" rel="noopener noreferrer">
                    <Video className="w-4 h-4" />
                    Entrar na aula
                  </a>
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* PDA Report Upload */}
        {program?.id && (
          <PdaReportUpload programId={program.id} programName={program.name} />
        )}

        {/* Two-column layout: Journey + Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Journey Timeline */}
          {classSchedules.length > 0 && (
            <div className="lg:col-span-1">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-primary" />
                    Cronograma
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <JourneyTimeline
                    schedules={classSchedules}
                    videoConferenceUrl={cls?.video_conference_url}
                    specialist={cls?.specialist}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Right: Modules & Materials */}
          <div className={cn(
            classSchedules.length > 0 ? "lg:col-span-2" : "lg:col-span-3",
            "space-y-6"
          )}>
            {/* Module navigation */}
            {programModules.length > 0 && (
              <Tabs value={contentTab} onValueChange={setContentTab}>
                <TabsList className="w-full sm:w-auto mb-4">
                  <TabsTrigger value="modulos" className="gap-1.5">
                    <Layers className="w-4 h-4" /> Módulos
                  </TabsTrigger>
                  <TabsTrigger value="exercicios" className="gap-1.5">
                    <ClipboardList className="w-4 h-4" /> Exercícios
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="modulos">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Layers className="w-4 h-4 text-primary" />
                        Módulos do Programa
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {programModules.map((mod: any, idx: number) => {
                        const isActive = activeModule === mod.id;
                        const modSchedule = classSchedules.find((s: any) => s.module_id === mod.id);
                        const isCompleted = modSchedule && modSchedule.schedule_date < today;
                        const isCurrent = modSchedule && modSchedule.schedule_date === today;
                        const moduleMaterials = getMaterialsForModule(mod.id);
                        const moduleExercises = getExercisesForModule(mod.id);

                        return (
                          <div key={mod.id}>
                            <button
                              onClick={() => {
                                setActiveModule(isActive ? null : mod.id);
                                if (!isActive) {
                                  supabase.rpc('log_user_action', {
                                    _action: 'MODULE_ACCESS',
                                    _table_name: 'program_modules',
                                    _record_id: mod.id,
                                    _new_data: { module_title: mod.title, program_name: program?.name },
                                  });
                                }
                              }}
                              className={cn(
                                "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all",
                                isActive ? "bg-primary/10 ring-1 ring-primary/30" : "hover:bg-muted/50",
                                isCompleted && !isActive && "opacity-70"
                              )}
                            >
                              <div className={cn(
                                "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                                isCompleted ? "bg-primary/20 text-primary" : isCurrent ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                              )}>
                                {isCompleted ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold leading-tight">{mod.title}</p>
                                {mod.description && (
                                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{mod.description}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {moduleMaterials.length > 0 && (
                                  <Badge variant="secondary" className="text-[10px]">{moduleMaterials.length}</Badge>
                                )}
                                {moduleExercises.length > 0 && (
                                  <Badge variant="outline" className="text-[10px] border-primary/40 text-primary gap-1">
                                    <ClipboardList className="w-3 h-3" /> {moduleExercises.length}
                                  </Badge>
                                )}
                                <ChevronRight className={cn("w-4 h-4 text-muted-foreground transition-transform", isActive && "rotate-90")} />
                              </div>
                            </button>

                            {/* Expanded module content */}
                            {isActive && (
                              <div className="mt-2 ml-11 space-y-4 pb-2">
                                {mod.description && (
                                  <p className="text-sm text-muted-foreground">{mod.description}</p>
                                )}

                                {/* Module videos */}
                                {(() => {
                                  const moduleVideos = moduleMaterials.filter((m: any) => m.file_type === 'video' && m.file_url);
                                  if (moduleVideos.length === 0) return null;
                                  return (
                                    <div className="space-y-4">
                                      {moduleVideos.map((v: any) => {
                                        const videoUrls: { url: string; title: string | null }[] =
                                          (v.video_urls && Array.isArray(v.video_urls) && v.video_urls.length > 0)
                                            ? v.video_urls : v.file_url ? [{ url: v.file_url, title: null }] : [];
                                        if (videoUrls.length === 0) return null;
                                        return (
                                          <div key={v.id} className="space-y-2">
                                            <p className="text-xs font-semibold flex items-center gap-1.5">
                                              <Video className="w-3.5 h-3.5 text-primary" />
                                              {v.title}
                                            </p>
                                            {videoUrls.map((vid: any, vidIdx: number) => {
                                              const ytId = vid.url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|live\/|shorts\/)|youtu\.be\/)([\w-]{11})/)?.[1];
                                              if (!ytId) return null;
                                              return (
                                                <div key={vidIdx} className="space-y-1">
                                                  {vid.title && <p className="text-[11px] text-muted-foreground">{vid.title}</p>}
                                                  <div className="rounded-lg overflow-hidden border aspect-video">
                                                    <iframe src={`https://www.youtube.com/embed/${ytId}`} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title={vid.title || v.title} />
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  );
                                })()}

                                <ProgramMaterials materials={moduleMaterials.filter((m: any) => m.file_type !== 'video')} />
                                <FeatureLinkCards moduleId={mod.id} />

                                {/* Link to exercises tab if module has exercises */}
                                {moduleExercises.length > 0 && (
                                  <button
                                    onClick={() => {
                                      setExerciseModuleId(mod.id);
                                      setContentTab('exercicios');
                                    }}
                                    className="flex items-center gap-2 text-xs text-primary hover:underline p-2 rounded-lg bg-primary/5 border border-primary/20 w-full"
                                  >
                                    <ClipboardList className="w-4 h-4" />
                                    <span>Este módulo possui <strong>{moduleExercises.length} exercício(s)</strong> — clique para acessar</span>
                                    <ChevronRight className="w-3.5 h-3.5 ml-auto" />
                                  </button>
                                )}

                                <ModuleEmptyState moduleId={mod.id} hasMaterials={moduleMaterials.length > 0} />

                                <div className="flex justify-end pt-1">
                                  <Button variant="outline" size="sm" className="gap-2 text-xs" onClick={() => {
                                    supabase.rpc('log_user_action', {
                                      _action: 'MODULE_COMPLETED',
                                      _table_name: 'program_modules',
                                      _record_id: mod.id,
                                      _new_data: { module_title: mod.title, program_name: program?.name },
                                    }).then(() => toast.success(`Módulo "${mod.title}" marcado como concluído!`));
                                  }}>
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    Marcar como concluído
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="exercicios">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <ClipboardList className="w-4 h-4 text-primary" />
                        Exercícios por Módulo
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {(() => {
                        const modulesWithExercises = programModules.filter((mod: any) => getExercisesForModule(mod.id).length > 0);
                        if (modulesWithExercises.length === 0) {
                          return (
                            <p className="text-sm text-muted-foreground text-center py-6">
                              Nenhum exercício disponível nos módulos deste programa.
                            </p>
                          );
                        }
                        return modulesWithExercises.map((mod: any) => (
                          <div key={mod.id} className="space-y-3">
                            <h4 className="text-sm font-semibold flex items-center gap-2 pb-1 border-b">
                              <Layers className="w-3.5 h-3.5 text-primary" />
                              {mod.title}
                            </h4>
                            <ExerciseRenderer moduleId={mod.id} />
                          </div>
                        ));
                      })()}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}

            {/* General materials - collapsible */}
            {unassignedMaterials.length > 0 && (
              <Collapsible>
                <Card>
                  <CollapsibleTrigger className="w-full">
                    <CardHeader className="pb-3 flex flex-row items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <FolderOpen className="w-4 h-4 text-primary" />
                        Materiais Gerais
                        <Badge variant="secondary" className="text-[10px]">{unassignedMaterials.length}</Badge>
                      </CardTitle>
                      <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent>
                      <ProgramMaterials materials={unassignedMaterials} />
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            )}

            {/* Líder 360 Questionnaire */}
            {isLider360 && renderLider360Questionnaire()}

            {!isLider360 && programModules.length === 0 && unassignedMaterials.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground text-sm">
                  Nenhum material disponível para este programa ainda.
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {enrollments.length > 1 && <Separator />}
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="space-y-8 max-w-6xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Meu Desenvolvimento</h1>
          <p className="text-muted-foreground text-sm">Acompanhe sua jornada de aprendizagem e acesse os materiais dos seus programas</p>
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
          <div className="space-y-8">
            {enrollments.map((e: any) => renderEnrollmentCard(e))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
