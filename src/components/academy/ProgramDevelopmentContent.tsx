import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  BookOpen, CalendarDays, GraduationCap, CheckCircle,
  Layers, Video, ChevronRight, ChevronDown, FolderOpen, ClipboardList, Lock, Unlock, Award
} from 'lucide-react';
import { ExerciseRenderer } from '@/components/academy/ExerciseRenderer';
import { FeatureLinkCards } from '@/components/academy/FeatureLinkCards';
import { PdaReportUpload } from '@/components/PdaReportUpload';
import { JourneyTimeline } from '@/components/academy/JourneyTimeline';
import { ProgramMaterials } from '@/components/academy/ProgramMaterials';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { generateCertificatePdf } from '@/utils/certificateUtils';

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

function CertificateCard({ programId, programName, studentName }: { programId?: string; programName?: string; studentName?: string }) {
  const { user } = useAuth();
  const [generating, setGenerating] = useState(false);

  const { data: certificate } = useQuery({
    queryKey: ['my-certificate', programId, user?.id],
    enabled: !!programId && !!user,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('certificates')
        .select('*')
        .eq('program_id', programId)
        .eq('user_id', user!.id)
        .maybeSingle();
      if (!data) return null;

      // Check if class end_date + 1 day has passed
      if (data.class_id) {
        const { data: cls } = await supabase
          .from('program_classes')
          .select('end_date')
          .eq('id', data.class_id)
          .single();
        if (cls?.end_date) {
          const endDate = new Date(cls.end_date + 'T23:59:59');
          const availableDate = new Date(endDate.getTime() + 24 * 60 * 60 * 1000);
          if (new Date() < availableDate) return null;
        }
      }

      return data;
    },
  });

  if (!certificate) return null;

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      // Get student name from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user!.id)
        .single();

      // Get specialist name and class dates from the class linked to the certificate
      let specialistName = certificate.director_name;
      let classDates = '';
      if (certificate.class_id) {
        const { data: cls } = await supabase
          .from('program_classes')
          .select('specialist, start_date, end_date')
          .eq('id', certificate.class_id)
          .single();
        if (cls?.specialist) {
          specialistName = cls.specialist;
        }
        if (cls?.start_date && cls?.end_date) {
          const fmt = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR');
          classDates = `${fmt(cls.start_date)} a ${fmt(cls.end_date)}`;
        }
      }

      await generateCertificatePdf({
        studentName: profile?.full_name || 'Aluno',
        programName: programName || 'Programa',
        courseHours: certificate.course_hours,
        courseDates: certificate.course_dates,
        certificateCode: certificate.certificate_code,
        directorName: specialistName,
        directorSignatureUrl: certificate.director_signature_url,
        emissionDate: new Date().toLocaleDateString('pt-BR'),
        classDates,
      });

      // Mark as generated
      await (supabase as any)
        .from('certificates')
        .update({ generated_at: new Date().toISOString() })
        .eq('id', certificate.id);

      toast.success('Certificado gerado com sucesso!');
    } catch (err) {
      toast.error('Erro ao gerar certificado');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-transparent">
      <CardContent className="flex items-center justify-between py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Award className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold">Certificado de Conclusão</p>
            <p className="text-xs text-muted-foreground">
              {certificate.course_hours}h • {certificate.course_dates}
              {certificate.generated_at && ' • Já gerado'}
            </p>
          </div>
        </div>
        <Button size="sm" onClick={handleGenerate} disabled={generating} className="gap-2">
          <Award className="w-4 h-4" />
          {generating ? 'Gerando...' : 'Gerar Certificado'}
        </Button>
      </CardContent>
    </Card>
  );
}

interface Props {
  programSlug: string;
}

export function ProgramDevelopmentContent({ programSlug }: Props) {
  const { user } = useAuth();

  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [contentTab, setContentTab] = useState<string>('modulos');

  // Fetch enrollment for this program
  const { data: enrollment, isLoading } = useQuery({
    queryKey: ['program-enrollment', programSlug, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from('program_enrollments')
        .select('id, enrolled_at, class_id, programs!inner(id, name, slug, description), program_classes(id, name, start_date, end_date, video_conference_url, specialist)')
        .eq('user_id', user!.id)
        .eq('programs.slug', programSlug)
        .maybeSingle();
      return data;
    },
  });

  const program = (enrollment as any)?.programs;
  const cls = (enrollment as any)?.program_classes;
  const classId = cls?.id;
  const programId = program?.id;

  const { data: schedules = [] } = useQuery({
    queryKey: ['dev-class-schedules', classId],
    enabled: !!classId,
    queryFn: async () => {
      const { data } = await supabase
        .from('class_schedules')
        .select('*')
        .eq('class_id', classId)
        .order('schedule_date')
        .order('order_number');
      return data || [];
    },
  });

  const scheduleIds = schedules.map((s: any) => s.id);
  const scheduleIdsKey = scheduleIds.sort().join(',');

  const { data: scheduleModulesData = [] } = useQuery({
    queryKey: ['dev-schedule-modules', scheduleIdsKey],
    enabled: scheduleIds.length > 0,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('schedule_modules')
        .select('*')
        .in('schedule_id', scheduleIds);
      return data || [];
    },
  });

  const getScheduleForModule = (moduleId: string) => {
    const smEntry = scheduleModulesData.find((sm: any) => sm.module_id === moduleId);
    if (!smEntry) return null;
    return schedules.find((s: any) => s.id === smEntry.schedule_id) || null;
  };

  const { data: materials = [] } = useQuery({
    queryKey: ['dev-program-materials', programId],
    enabled: !!programId,
    queryFn: async () => {
      const { data } = await supabase
        .from('program_materials')
        .select('*')
        .eq('program_id', programId)
        .order('order_number');
      return data || [];
    },
  });

  const { data: allModules = [] } = useQuery({
    queryKey: ['dev-program-modules', programId],
    enabled: !!programId,
    queryFn: async () => {
      const { data } = await supabase
        .from('program_modules')
        .select('*')
        .eq('program_id', programId)
        .order('order_number');
      return data || [];
    },
  });

  const moduleIds = allModules.map((m: any) => m.id);
  const moduleIdsKey = moduleIds.sort().join(',');

  const { data: classModules = [] } = useQuery({
    queryKey: ['dev-class-modules', classId],
    enabled: !!classId,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('class_modules')
        .select('class_id, module_id')
        .eq('class_id', classId);
      return data || [];
    },
  });

  const { data: allExercises = [] } = useQuery({
    queryKey: ['dev-module-exercises', moduleIdsKey],
    enabled: moduleIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from('module_exercises')
        .select('id, module_id')
        .in('module_id', moduleIds);
      return data || [];
    },
  });

  const { data: specialists = [] } = useQuery({
    queryKey: ['specialists'],
    queryFn: async () => {
      const { data } = await (supabase as any).from('specialists').select('*');
      return data || [];
    },
  });

  const { data: classModuleSpecialists = [] } = useQuery({
    queryKey: ['class-module-specialists', classId],
    enabled: !!classId,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('class_module_specialists')
        .select('module_id, specialist_id, order_number')
        .eq('class_id', classId)
        .order('order_number');
      return data || [];
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!enrollment) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <GraduationCap className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>Você não está matriculado neste programa.</p>
          <p className="text-xs mt-1">Consulte o Calendário de Turmas para conhecer os próximos programas.</p>
        </CardContent>
      </Card>
    );
  }

  const getExercisesForModule = (moduleId: string) =>
    allExercises.filter((ex: any) => ex.module_id === moduleId);

  const getSpecialist = (name: string | null) =>
    name ? specialists.find((s: any) => s.name.toLowerCase().trim() === name.toLowerCase().trim()) : null;

  const getModuleSpecialists = (moduleId: string) => {
    const ids = classModuleSpecialists
      .filter((r: any) => r.module_id === moduleId)
      .map((r: any) => r.specialist_id);
    return ids
      .map(id => specialists.find((s: any) => s.id === id))
      .filter(Boolean);
  };

  const getModules = () => {
    const programModules = allModules;
    if (classId) {
      const cmIds = classModules.map((cm: any) => cm.module_id);
      return programModules.filter((m: any) => cmIds.includes(m.id));
    }
    return programModules;
  };

  const getMaterialsForModule = (moduleId: string) => materials.filter((m: any) => m.module_id === moduleId);
  const getUnassignedMaterials = () => materials.filter((m: any) => !m.module_id);

  const programModules = getModules();
  const unassignedMaterials = getUnassignedMaterials();
  const today = new Date().toISOString().split('T')[0];
  const classEnded = !!(cls?.end_date && cls.end_date < today);
  const specialist = getSpecialist(cls?.specialist);

  return (
    <div className="space-y-6">
      {/* Program Header Card */}
      <Card className="overflow-hidden border-primary/20">
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold">{program?.name || 'Programa'}</h2>
                <Badge variant="outline" className="text-xs border-primary/40 text-primary">Matriculado</Badge>
                {classEnded && (
                  <Badge variant="secondary" className="text-xs bg-muted text-muted-foreground">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Turma encerrada
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
              {cls?.video_conference_url && !classEnded && (
                <a href={cls.video_conference_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline mt-1">
                  <Video className="w-3.5 h-3.5" />
                  {cls.video_conference_url}
                </a>
              )}

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
            {cls?.video_conference_url && !classEnded && (
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
      {programId && <PdaReportUpload programId={programId} programName={program?.name} />}

      {/* Certificate Card */}
      <CertificateCard programId={programId} programName={program?.name} studentName={undefined} />

      {/* Two-column layout: Journey + Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {schedules.length > 0 && (
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
                  schedules={schedules}
                  videoConferenceUrl={cls?.video_conference_url}
                  specialist={cls?.specialist}
                  classEnded={classEnded}
                />
              </CardContent>
            </Card>
          </div>
        )}

        <div className={cn(
          schedules.length > 0 ? "lg:col-span-2" : "lg:col-span-3",
          "space-y-6"
        )}>
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
                      const modSchedule = getScheduleForModule(mod.id);
                      const isCompleted = modSchedule && modSchedule.schedule_date < today;
                      const isCurrent = modSchedule && modSchedule.schedule_date === today;
                      // Module is unlocked if: no schedule exists (always open), or date is today or past
                      const isUnlocked = !modSchedule || modSchedule.schedule_date <= today;
                      const isLocked = !isUnlocked;
                      const moduleMaterials = getMaterialsForModule(mod.id);
                      const moduleExercises = getExercisesForModule(mod.id);

                      return (
                        <div key={mod.id}>
                          <button
                            onClick={() => {
                              if (isLocked) {
                                toast.info(`Este módulo será desbloqueado em ${modSchedule ? format(new Date(modSchedule.schedule_date + 'T12:00:00'), "dd 'de' MMMM", { locale: ptBR }) : ''}`);
                                return;
                              }
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
                              isCompleted && !isActive && "opacity-80",
                              isLocked && "opacity-50 cursor-not-allowed"
                            )}
                          >
                            <div className={cn(
                              "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500",
                              isCompleted ? "bg-primary text-primary-foreground shadow-sm" : isCurrent ? "bg-primary text-primary-foreground ring-4 ring-primary/20" : isLocked ? "bg-muted/50 text-muted-foreground/50 border border-dashed border-border" : "bg-muted text-muted-foreground"
                            )}>
                              {isCompleted ? <CheckCircle className="w-4 h-4" /> : isLocked ? <Lock className="w-3.5 h-3.5" /> : idx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className={cn(
                                  "text-sm font-semibold leading-tight",
                                  isCompleted && "text-primary",
                                  isLocked && "text-muted-foreground"
                                )}>
                                  {mod.title}
                                </p>
                                {isCompleted && (
                                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-primary/10 text-primary border-0">
                                    Concluído
                                  </Badge>
                                )}
                                {isCurrent && (
                                  <Badge className="text-[10px] px-1.5 py-0 h-4 animate-pulse">
                                    Disponível
                                  </Badge>
                                )}
                                {isLocked && modSchedule && (
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 text-muted-foreground border-muted-foreground/30">
                                    <Lock className="w-2.5 h-2.5 mr-0.5" />
                                    {format(new Date(modSchedule.schedule_date + 'T12:00:00'), "dd/MM", { locale: ptBR })}
                                  </Badge>
                                )}
                              </div>
                              {mod.description && !isLocked && (
                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{mod.description}</p>
                              )}
                              {isLocked && (
                                <p className="text-xs text-muted-foreground/60 mt-0.5">
                                  Disponível a partir de {format(new Date(modSchedule!.schedule_date + 'T12:00:00'), "dd 'de' MMMM", { locale: ptBR })}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {!isLocked && moduleMaterials.length > 0 && (
                                <Badge variant="secondary" className="text-[10px]">{moduleMaterials.length}</Badge>
                              )}
                              {!isLocked && moduleExercises.length > 0 && (
                                <Badge variant="outline" className="text-[10px] border-primary/40 text-primary gap-1">
                                  <ClipboardList className="w-3 h-3" /> {moduleExercises.length}
                                </Badge>
                              )}
                              {!isLocked && (
                                <ChevronRight className={cn("w-4 h-4 text-muted-foreground transition-transform", isActive && "rotate-90")} />
                              )}
                            </div>
                          </button>

                          {isActive && !isLocked && (
                            <div className="mt-2 ml-11 space-y-4 pb-2 animate-in slide-in-from-top-2 duration-300">
                              {mod.description && (
                                <p className="text-sm text-muted-foreground">{mod.description}</p>
                              )}

                              {/* Module specialists */}
                              {(() => {
                                const modSpecs = getModuleSpecialists(mod.id);
                                if (modSpecs.length === 0) return null;
                                return (
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-xs text-muted-foreground">
                                      {modSpecs.length === 1 ? 'Especialista:' : 'Especialistas:'}
                                    </span>
                                    {modSpecs.map((s: any) => (
                                      <div key={s.id} className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted/50 border border-border/50">
                                        {s.avatar_url ? (
                                          <img src={s.avatar_url} alt={s.name} className="w-5 h-5 rounded-full object-cover" />
                                        ) : (
                                          <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center">
                                            <BookOpen className="w-3 h-3 text-muted-foreground" />
                                          </div>
                                        )}
                                        <span className="text-xs font-medium">{s.name}</span>
                                      </div>
                                    ))}
                                  </div>
                                );
                              })()}

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

                              {moduleExercises.length > 0 && (
                                <button
                                  onClick={() => setContentTab('exercicios')}
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

          {programModules.length === 0 && unassignedMaterials.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground text-sm">
                Nenhum material disponível para este programa ainda.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
