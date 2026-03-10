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
  Layers, Video, ChevronRight, ChevronDown, FolderOpen, ClipboardList
} from 'lucide-react';
import { ExerciseRenderer } from '@/components/academy/ExerciseRenderer';
import { FeatureLinkCards } from '@/components/academy/FeatureLinkCards';
import { PdaReportUpload } from '@/components/PdaReportUpload';
import { JourneyTimeline } from '@/components/academy/JourneyTimeline';
import { ProgramMaterials } from '@/components/academy/ProgramMaterials';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

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

  const getModules = () => {
    const programModules = allModules;
    if (classId) {
      const cmIds = classModules.map((cm: any) => cm.module_id);
      if (cmIds.length > 0) return programModules.filter((m: any) => cmIds.includes(m.id));
    }
    return programModules;
  };

  const getMaterialsForModule = (moduleId: string) => materials.filter((m: any) => m.module_id === moduleId);
  const getUnassignedMaterials = () => materials.filter((m: any) => !m.module_id);

  const programModules = getModules();
  const unassignedMaterials = getUnassignedMaterials();
  const today = new Date().toISOString().split('T')[0];
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
      {programId && <PdaReportUpload programId={programId} programName={program?.name} />}

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
                      const modSchedule = schedules.find((s: any) => s.module_id === mod.id);
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
