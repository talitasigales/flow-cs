import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Upload, Users, FileText, Trash2, Eye, Plus, CalendarIcon, GraduationCap, PackagePlus, Layers, Pencil, ExternalLink, Clock, Video, FileUp } from 'lucide-react';
import { ModuleExerciseManager } from '@/components/admin/ModuleExerciseManager';
import { ModuleFeatureLinkManager } from '@/components/admin/ModuleFeatureLinkManager';
import { ModuleMaterialManager } from '@/components/admin/ModuleMaterialManager';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const QUESTION_LABELS: Record<string, string> = {
  q1: '1. Estilo de gestão',
  q2: '2. O que faz bem como líder',
  q3: '3. Liderança mais forte',
  q4: '4. Perde desempenho/clareza',
  q5: '5. O que o time diria',
  q6: '6. Evolução intencional',
  q7_strength: 'Ponto forte PDA',
  q8_development: 'Oportunidade de desenvolvimento',
  q9_pda_axes: 'Eixos PDA selecionados',
};

const MATERIAL_CATEGORIES = [
  { value: 'prework', label: 'Pre-work' },
  { value: 'material', label: 'Material' },
  { value: 'exercise', label: 'Exercício' },
];

export default function AdminPrograms() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedProgram, setSelectedProgram] = useState('');
  const [csvText, setCsvText] = useState('');
  const [importing, setImporting] = useState(false);
  const [selectedClassFilter, setSelectedClassFilter] = useState('all');
  const [viewingResponse, setViewingResponse] = useState<any>(null);

  // New class dialog state
  const [classDialogOpen, setClassDialogOpen] = useState(false);
  const [className, setClassName] = useState('');
  const [classStartDate, setClassStartDate] = useState<Date>();
  const [classEndDate, setClassEndDate] = useState<Date>();
  const [classVideoUrl, setClassVideoUrl] = useState('');
  const [classSpecialist, setClassSpecialist] = useState('');
  const [savingClass, setSavingClass] = useState(false);

  // Import class selector
  const [importClassId, setImportClassId] = useState('');

  // Materials state
  const [materialTitle, setMaterialTitle] = useState('');
  const [materialDescription, setMaterialDescription] = useState('');
  const [materialFileUrl, setMaterialFileUrl] = useState('');
  const [materialFileType, setMaterialFileType] = useState('link');
  const [materialModuleId, setMaterialModuleId] = useState('');
  const [materialCategory, setMaterialCategory] = useState('material');
  const [materialFile, setMaterialFile] = useState<File | null>(null);
  const [savingMaterial, setSavingMaterial] = useState(false);

  // Modules state
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<any>(null);
  const [moduleTitle, setModuleTitle] = useState('');
  const [moduleDescription, setModuleDescription] = useState('');
  const [moduleOrder, setModuleOrder] = useState(0);
  const [savingModule, setSavingModule] = useState(false);

  // Schedule state
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [scheduleClassId, setScheduleClassId] = useState('');
  const [scheduleTitle, setScheduleTitle] = useState('');
  const [scheduleDate, setScheduleDate] = useState<Date>();
  const [scheduleStartTime, setScheduleStartTime] = useState('');
  const [scheduleEndTime, setScheduleEndTime] = useState('');
  const [scheduleModuleId, setScheduleModuleId] = useState('');
  const [savingSchedule, setSavingSchedule] = useState(false);

  useEffect(() => {
    if (!authLoading && !adminLoading && (!user || !isAdmin)) navigate('/dashboard');
  }, [authLoading, adminLoading, user, isAdmin, navigate]);

  const { data: programs = [] } = useQuery({
    queryKey: ['all-programs'],
    queryFn: async () => {
      const { data } = await supabase.from('programs').select('*').order('name');
      return data || [];
    },
  });

  const { data: classes = [], refetch: refetchClasses } = useQuery({
    queryKey: ['program-classes', selectedProgram],
    enabled: !!selectedProgram,
    queryFn: async () => {
      const { data } = await supabase
        .from('program_classes')
        .select('*')
        .eq('program_id', selectedProgram)
        .order('start_date', { ascending: false });
      return data || [];
    },
  });

  const { data: modules = [], refetch: refetchModules } = useQuery({
    queryKey: ['program-modules-admin', selectedProgram],
    enabled: !!selectedProgram,
    queryFn: async () => {
      const { data } = await supabase
        .from('program_modules')
        .select('*')
        .eq('program_id', selectedProgram)
        .order('order_number');
      return data || [];
    },
  });

  const { data: enrollments = [], refetch: refetchEnrollments } = useQuery({
    queryKey: ['all-enrollments', selectedProgram, selectedClassFilter],
    enabled: !!selectedProgram,
    queryFn: async () => {
      let query = supabase
        .from('program_enrollments')
        .select('id, user_id, enrolled_at, class_id, profiles(full_name, email)')
        .eq('program_id', selectedProgram)
        .order('enrolled_at', { ascending: false });
      if (selectedClassFilter && selectedClassFilter !== 'all') {
        query = query.eq('class_id', selectedClassFilter);
      }
      const { data } = await query;
      return data || [];
    },
  });

  const { data: responses = [] } = useQuery({
    queryKey: ['all-responses', selectedProgram],
    enabled: !!selectedProgram,
    queryFn: async () => {
      const { data } = await supabase
        .from('workshop_responses')
        .select('id, user_id, answers, submitted_at, profiles(full_name, email)')
        .eq('program_id', selectedProgram)
        .order('submitted_at', { ascending: false });
      return data || [];
    },
  });

  const { data: materials = [], refetch: refetchMaterials } = useQuery({
    queryKey: ['program-materials-admin', selectedProgram],
    enabled: !!selectedProgram,
    queryFn: async () => {
      const { data } = await supabase
        .from('program_materials')
        .select('*')
        .eq('program_id', selectedProgram)
        .order('order_number');
      return data || [];
    },
  });

  const { data: schedules = [], refetch: refetchSchedules } = useQuery({
    queryKey: ['class-schedules-admin', selectedProgram],
    enabled: !!selectedProgram,
    queryFn: async () => {
      const classIds = classes.map((c: any) => c.id);
      if (classIds.length === 0) return [];
      const { data } = await supabase
        .from('class_schedules')
        .select('*')
        .in('class_id', classIds)
        .order('schedule_date')
        .order('order_number');
      return data || [];
    },
  });

  // --- Handlers ---

  const handleSaveClass = async () => {
    if (!className.trim() || !selectedProgram) {
      toast.error('Nome da turma é obrigatório');
      return;
    }
    setSavingClass(true);
    try {
      const { error } = await supabase.from('program_classes').insert({
        program_id: selectedProgram,
        name: className.trim(),
        start_date: classStartDate ? format(classStartDate, 'yyyy-MM-dd') : null,
        end_date: classEndDate ? format(classEndDate, 'yyyy-MM-dd') : null,
        video_conference_url: classVideoUrl.trim() || null,
        specialist: classSpecialist || null,
      });
      if (error) throw error;
      toast.success('Turma criada com sucesso');
      setClassName('');
      setClassStartDate(undefined);
      setClassEndDate(undefined);
      setClassVideoUrl('');
      setClassSpecialist('');
      setClassDialogOpen(false);
      refetchClasses();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar turma');
    } finally {
      setSavingClass(false);
    }
  };

  const handleDeleteClass = async (id: string) => {
    const { error } = await supabase.from('program_classes').delete().eq('id', id);
    if (error) {
      toast.error('Erro ao remover turma');
    } else {
      toast.success('Turma removida');
      refetchClasses();
    }
  };

  const handleImport = async () => {
    if (!csvText.trim() || !selectedProgram) {
      toast.error('Selecione um programa e insira os e-mails');
      return;
    }
    setImporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('import-enrollments', {
        body: { emails: csvText, program_id: selectedProgram, class_id: importClassId || null },
      });
      if (error) throw error;
      toast.success(`Importação concluída: ${data.enrolled} matriculados, ${data.alreadyEnrolled} já existentes`);
      if (data.notFound?.length > 0) {
        toast.warning(`E-mails não encontrados: ${data.notFound.join(', ')}`);
      }
      setCsvText('');
      refetchEnrollments();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao importar');
    } finally {
      setImporting(false);
    }
  };

  const handleRemoveEnrollment = async (id: string) => {
    const { error } = await supabase.from('program_enrollments').delete().eq('id', id);
    if (error) {
      toast.error('Erro ao remover');
    } else {
      toast.success('Matrícula removida');
      refetchEnrollments();
    }
  };

  const getClassName = (classId: string | null) => {
    if (!classId) return '—';
    const cls = classes.find((c: any) => c.id === classId);
    return cls ? cls.name : '—';
  };

  const getModuleName = (moduleId: string | null) => {
    if (!moduleId) return '—';
    const mod = modules.find((m: any) => m.id === moduleId);
    return mod ? mod.title : '—';
  };

  // Module handlers
  const openModuleDialog = (mod?: any) => {
    if (mod) {
      setEditingModule(mod);
      setModuleTitle(mod.title);
      setModuleDescription(mod.description || '');
      setModuleOrder(mod.order_number || 0);
    } else {
      setEditingModule(null);
      setModuleTitle('');
      setModuleDescription('');
      setModuleOrder(modules.length);
    }
    setModuleDialogOpen(true);
  };

  const handleSaveModule = async () => {
    if (!moduleTitle.trim() || !selectedProgram) {
      toast.error('Título é obrigatório');
      return;
    }
    setSavingModule(true);
    try {
      if (editingModule) {
        const { error } = await supabase.from('program_modules').update({
          title: moduleTitle.trim(),
          description: moduleDescription.trim() || null,
          order_number: moduleOrder,
        }).eq('id', editingModule.id);
        if (error) throw error;
        toast.success('Módulo atualizado');
      } else {
        const { error } = await supabase.from('program_modules').insert({
          program_id: selectedProgram,
          title: moduleTitle.trim(),
          description: moduleDescription.trim() || null,
          order_number: moduleOrder,
        });
        if (error) throw error;
        toast.success('Módulo criado');
      }
      setModuleDialogOpen(false);
      refetchModules();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar módulo');
    } finally {
      setSavingModule(false);
    }
  };

  const handleDeleteModule = async (id: string) => {
    const { error } = await supabase.from('program_modules').delete().eq('id', id);
    if (error) {
      toast.error('Erro ao remover módulo. Verifique se não há materiais vinculados.');
    } else {
      toast.success('Módulo removido');
      refetchModules();
    }
  };

  const handleSaveMaterial = async () => {
    if (!materialTitle.trim() || !selectedProgram) {
      toast.error('Título é obrigatório');
      return;
    }
    if (materialFileType === 'link' && !materialFileUrl.trim()) {
      toast.error('URL é obrigatória para links');
      return;
    }
    if (['pdf', 'doc', 'other'].includes(materialFileType) && !materialFile && !materialFileUrl.trim()) {
      toast.error('Selecione um arquivo ou informe uma URL');
      return;
    }
    setSavingMaterial(true);
    try {
      let fileUrl = materialFileUrl.trim();

      // Upload file if provided
      if (materialFile) {
        const fileExt = materialFile.name.split('.').pop();
        const fileName = `${selectedProgram}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('program-materials')
          .upload(fileName, materialFile);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage
          .from('program-materials')
          .getPublicUrl(fileName);
        fileUrl = publicUrl;
      }

      const { error } = await supabase.from('program_materials').insert({
        program_id: selectedProgram,
        title: materialTitle.trim(),
        description: materialDescription.trim() || null,
        file_url: fileUrl || null,
        file_type: materialFileType,
        order_number: materials.length,
        module_id: materialModuleId && materialModuleId !== 'none' ? materialModuleId : null,
        category: materialCategory,
      });
      if (error) throw error;
      toast.success('Material adicionado');
      setMaterialTitle('');
      setMaterialDescription('');
      setMaterialFileUrl('');
      setMaterialFileType('link');
      setMaterialModuleId('');
      setMaterialCategory('material');
      setMaterialFile(null);
      refetchMaterials();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar material');
    } finally {
      setSavingMaterial(false);
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    const { error } = await supabase.from('program_materials').delete().eq('id', id);
    if (error) {
      toast.error('Erro ao remover material');
    } else {
      toast.success('Material removido');
      refetchMaterials();
    }
  };

  const handleSaveSchedule = async () => {
    if (!scheduleTitle.trim() || !scheduleClassId || !scheduleDate) {
      toast.error('Título, turma e data são obrigatórios');
      return;
    }
    setSavingSchedule(true);
    try {
      const { error } = await supabase.from('class_schedules').insert({
        class_id: scheduleClassId,
        module_id: scheduleModuleId && scheduleModuleId !== 'none' ? scheduleModuleId : null,
        title: scheduleTitle.trim(),
        schedule_date: format(scheduleDate, 'yyyy-MM-dd'),
        start_time: scheduleStartTime || null,
        end_time: scheduleEndTime || null,
        order_number: schedules.filter((s: any) => s.class_id === scheduleClassId).length,
      });
      if (error) throw error;
      toast.success('Etapa adicionada ao cronograma');
      setScheduleTitle('');
      setScheduleDate(undefined);
      setScheduleStartTime('');
      setScheduleEndTime('');
      setScheduleModuleId('');
      setScheduleDialogOpen(false);
      refetchSchedules();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar');
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    const { error } = await supabase.from('class_schedules').delete().eq('id', id);
    if (error) {
      toast.error('Erro ao remover etapa');
    } else {
      toast.success('Etapa removida');
      refetchSchedules();
    }
  };

  if (authLoading || adminLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Gerenciar Programas</h1>
          <p className="text-muted-foreground text-sm">Turmas, módulos, matrículas, materiais e respostas dos alunos</p>
        </div>

        <div className="flex items-center gap-3">
          <Label>Programa:</Label>
          <Select value={selectedProgram} onValueChange={(v) => { setSelectedProgram(v); setSelectedClassFilter('all'); }}>
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="Selecione um programa" />
            </SelectTrigger>
            <SelectContent>
              {programs.map((p: any) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedProgram && (
          <Tabs defaultValue="classes">
            <TabsList className="flex-wrap">
              <TabsTrigger value="classes" className="gap-1.5"><GraduationCap className="w-4 h-4" /> Turmas ({classes.length})</TabsTrigger>
              <TabsTrigger value="schedule" className="gap-1.5"><Clock className="w-4 h-4" /> Cronograma</TabsTrigger>
              <TabsTrigger value="modules" className="gap-1.5"><Layers className="w-4 h-4" /> Módulos ({modules.length})</TabsTrigger>
              <TabsTrigger value="enrollments" className="gap-1.5"><Users className="w-4 h-4" /> Matrículas ({enrollments.length})</TabsTrigger>
              <TabsTrigger value="import" className="gap-1.5"><Upload className="w-4 h-4" /> Importar</TabsTrigger>
              <TabsTrigger value="responses" className="gap-1.5"><FileText className="w-4 h-4" /> Respostas ({responses.length})</TabsTrigger>
              <TabsTrigger value="materials" className="gap-1.5"><PackagePlus className="w-4 h-4" /> Materiais ({materials.length})</TabsTrigger>
            </TabsList>

            {/* TURMAS TAB */}
            <TabsContent value="classes" className="mt-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Turmas</CardTitle>
                    <CardDescription>Gerencie as turmas deste programa</CardDescription>
                  </div>
                  <Dialog open={classDialogOpen} onOpenChange={setClassDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="gap-1.5"><Plus className="w-4 h-4" /> Nova Turma</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Criar Turma</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Nome da Turma</Label>
                          <Input value={className} onChange={e => setClassName(e.target.value)} placeholder="Ex: Turma 10-12 Mar/2026" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Data Início</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !classStartDate && "text-muted-foreground")}>
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {classStartDate ? format(classStartDate, "dd/MM/yyyy") : "Selecionar"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={classStartDate} onSelect={setClassStartDate} className={cn("p-3 pointer-events-auto")} />
                              </PopoverContent>
                            </Popover>
                          </div>
                          <div className="space-y-2">
                            <Label>Data Fim</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !classEndDate && "text-muted-foreground")}>
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {classEndDate ? format(classEndDate, "dd/MM/yyyy") : "Selecionar"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={classEndDate} onSelect={setClassEndDate} className={cn("p-3 pointer-events-auto")} />
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Especialista Responsável</Label>
                          <Select value={classSpecialist} onValueChange={setClassSpecialist}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a especialista" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Júlia">Júlia</SelectItem>
                              <SelectItem value="Luciana">Luciana</SelectItem>
                              <SelectItem value="Silvia">Silvia</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Link da Videoconferência (Zoom/Meet)</Label>
                          <Input value={classVideoUrl} onChange={e => setClassVideoUrl(e.target.value)} placeholder="https://zoom.us/j/... ou https://meet.google.com/..." />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={handleSaveClass} disabled={savingClass}>
                          {savingClass ? 'Salvando...' : 'Criar Turma'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Especialista</TableHead>
                        <TableHead>Data Início</TableHead>
                        <TableHead>Data Fim</TableHead>
                        <TableHead>Videoconferência</TableHead>
                        <TableHead className="w-[80px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {classes.length === 0 ? (
                        <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhuma turma cadastrada</TableCell></TableRow>
                      ) : classes.map((c: any) => (
                        <TableRow key={c.id}>
                          <TableCell className="font-medium">{c.name}</TableCell>
                          <TableCell>{c.specialist ? <Badge variant="secondary">{c.specialist}</Badge> : '—'}</TableCell>
                          <TableCell>{c.start_date ? format(new Date(c.start_date + 'T12:00:00'), 'dd/MM/yyyy') : '—'}</TableCell>
                          <TableCell>{c.end_date ? format(new Date(c.end_date + 'T12:00:00'), 'dd/MM/yyyy') : '—'}</TableCell>
                          <TableCell>
                            {c.video_conference_url ? (
                              <a href={c.video_conference_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs flex items-center gap-1">
                                <ExternalLink className="w-3 h-3" /> Link
                              </a>
                            ) : '—'}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteClass(c.id)} className="text-destructive hover:text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* CRONOGRAMA TAB */}
            <TabsContent value="schedule" className="mt-4 space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Cronograma da Turma</CardTitle>
                    <CardDescription>Defina as datas e horários de cada etapa/módulo por turma</CardDescription>
                  </div>
                  <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="gap-1.5"><Plus className="w-4 h-4" /> Nova Etapa</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Adicionar Etapa ao Cronograma</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Turma</Label>
                          <Select value={scheduleClassId} onValueChange={setScheduleClassId}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a turma" />
                            </SelectTrigger>
                            <SelectContent>
                              {classes.map((c: any) => (
                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Título da Etapa</Label>
                          <Input value={scheduleTitle} onChange={e => setScheduleTitle(e.target.value)} placeholder="Ex: Módulo 1 — Autoconhecimento" />
                        </div>
                        <div className="space-y-2">
                          <Label>Módulo vinculado (opcional)</Label>
                          <Select value={scheduleModuleId} onValueChange={setScheduleModuleId}>
                            <SelectTrigger>
                              <SelectValue placeholder="Sem módulo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Sem módulo</SelectItem>
                              {modules.map((m: any) => (
                                <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Data</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !scheduleDate && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {scheduleDate ? format(scheduleDate, "dd/MM/yyyy") : "Selecionar"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar mode="single" selected={scheduleDate} onSelect={setScheduleDate} className={cn("p-3 pointer-events-auto")} />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Hora Início</Label>
                            <Input type="time" value={scheduleStartTime} onChange={e => setScheduleStartTime(e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label>Hora Fim</Label>
                            <Input type="time" value={scheduleEndTime} onChange={e => setScheduleEndTime(e.target.value)} />
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={handleSaveSchedule} disabled={savingSchedule}>
                          {savingSchedule ? 'Salvando...' : 'Adicionar Etapa'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  {classes.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Crie uma turma primeiro para definir o cronograma.</p>
                  ) : (
                    <div className="space-y-6">
                      {classes.map((c: any) => {
                        const classSchedules = schedules.filter((s: any) => s.class_id === c.id);
                        if (classSchedules.length === 0) return null;
                        return (
                          <div key={c.id} className="space-y-3">
                            <h3 className="font-semibold text-sm flex items-center gap-2">
                              <GraduationCap className="w-4 h-4 text-primary" />
                              {c.name}
                              {c.specialist && <Badge variant="secondary" className="text-xs">{c.specialist}</Badge>}
                            </h3>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Data</TableHead>
                                  <TableHead>Horário</TableHead>
                                  <TableHead>Etapa</TableHead>
                                  <TableHead className="w-[80px]"></TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {classSchedules.map((s: any) => (
                                  <TableRow key={s.id}>
                                    <TableCell>{format(new Date(s.schedule_date + 'T12:00:00'), 'dd/MM/yyyy')}</TableCell>
                                    <TableCell>
                                      {s.start_time && s.end_time
                                        ? `${s.start_time.slice(0, 5)} às ${s.end_time.slice(0, 5)}`
                                        : s.start_time ? s.start_time.slice(0, 5) : '—'}
                                    </TableCell>
                                    <TableCell className="font-medium">{s.title}</TableCell>
                                    <TableCell>
                                      <Button variant="ghost" size="icon" onClick={() => handleDeleteSchedule(s.id)} className="text-destructive hover:text-destructive">
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        );
                      })}
                      {schedules.length === 0 && (
                        <p className="text-center text-muted-foreground py-8">Nenhuma etapa cadastrada. Clique em "Nova Etapa" para começar.</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* MÓDULOS TAB */}
            <TabsContent value="modules" className="mt-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Módulos</CardTitle>
                    <CardDescription>Organize o conteúdo do programa em módulos sequenciais</CardDescription>
                  </div>
                  <Button size="sm" className="gap-1.5" onClick={() => openModuleDialog()}>
                    <Plus className="w-4 h-4" /> Novo Módulo
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[60px]">Ordem</TableHead>
                        <TableHead>Título</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead className="w-[120px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {modules.length === 0 ? (
                        <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Nenhum módulo cadastrado</TableCell></TableRow>
                      ) : modules.map((m: any) => (
                        <TableRow key={m.id}>
                          <TableCell className="text-center font-mono">{m.order_number}</TableCell>
                          <TableCell className="font-medium">{m.title}</TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[300px] truncate">{m.description || '—'}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" onClick={() => openModuleDialog(m)}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteModule(m.id)} className="text-destructive hover:text-destructive">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Exercises & Feature Links per module */}
              {modules.length > 0 && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-lg">Exercícios & Funcionalidades por Módulo</CardTitle>
                    <CardDescription>Gerencie exercícios dinâmicos e links de funcionalidades da plataforma para cada módulo</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="multiple" className="space-y-2">
                      {modules.map((mod: any) => (
                        <AccordionItem key={mod.id} value={mod.id} className="border rounded-lg px-4">
                          <AccordionTrigger className="hover:no-underline py-3">
                            <span className="text-sm font-medium">{mod.title}</span>
                          </AccordionTrigger>
                          <AccordionContent className="space-y-6 pb-4">
                            <ModuleMaterialManager moduleId={mod.id} programId={selectedProgram} moduleTitle={mod.title} />
                            <div className="border-t pt-4">
                              <ModuleExerciseManager moduleId={mod.id} moduleTitle={mod.title} />
                            </div>
                            <div className="border-t pt-4">
                              <ModuleFeatureLinkManager moduleId={mod.id} moduleTitle={mod.title} />
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              )}

              <Dialog open={moduleDialogOpen} onOpenChange={setModuleDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingModule ? 'Editar Módulo' : 'Criar Módulo'}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Título</Label>
                      <Input value={moduleTitle} onChange={e => setModuleTitle(e.target.value)} placeholder="Ex: Módulo 1 — Autoconhecimento" />
                    </div>
                    <div className="space-y-2">
                      <Label>Descrição (opcional)</Label>
                      <Textarea value={moduleDescription} onChange={e => setModuleDescription(e.target.value)} placeholder="Breve descrição do módulo..." className="min-h-[80px]" />
                    </div>
                    <div className="space-y-2">
                      <Label>Ordem</Label>
                      <Input type="number" value={moduleOrder} onChange={e => setModuleOrder(Number(e.target.value))} min={0} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleSaveModule} disabled={savingModule}>
                      {savingModule ? 'Salvando...' : editingModule ? 'Atualizar' : 'Criar Módulo'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </TabsContent>

            {/* MATRÍCULAS TAB */}
            <TabsContent value="enrollments" className="mt-4 space-y-4">
              <div className="flex items-center gap-3">
                <Label className="text-sm">Filtrar por turma:</Label>
                <Select value={selectedClassFilter} onValueChange={setSelectedClassFilter}>
                  <SelectTrigger className="w-[250px]">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as turmas</SelectItem>
                    {classes.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>E-mail</TableHead>
                        <TableHead>Turma</TableHead>
                        <TableHead>Data de Matrícula</TableHead>
                        <TableHead className="w-[80px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {enrollments.length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhuma matrícula encontrada</TableCell></TableRow>
                      ) : enrollments.map((e: any) => (
                        <TableRow key={e.id}>
                          <TableCell className="font-medium">{e.profiles?.full_name || '—'}</TableCell>
                          <TableCell>{e.profiles?.email || '—'}</TableCell>
                          <TableCell><Badge variant="secondary">{getClassName(e.class_id)}</Badge></TableCell>
                          <TableCell>{format(new Date(e.enrolled_at), 'dd/MM/yyyy')}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" onClick={() => handleRemoveEnrollment(e.id)} className="text-destructive hover:text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* IMPORTAR TAB */}
            <TabsContent value="import" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Importar Matrículas em Massa</CardTitle>
                  <CardDescription>Cole os e-mails dos alunos (um por linha, separados por vírgula ou ponto e vírgula)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Turma (opcional)</Label>
                    <Select value={importClassId} onValueChange={setImportClassId}>
                      <SelectTrigger className="w-[300px]">
                        <SelectValue placeholder="Sem turma específica" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sem turma específica</SelectItem>
                        {classes.map((c: any) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Textarea
                    value={csvText}
                    onChange={e => setCsvText(e.target.value)}
                    placeholder="aluno1@empresa.com&#10;aluno2@empresa.com&#10;aluno3@empresa.com"
                    className="min-h-[200px] font-mono text-sm"
                  />
                  <Button onClick={handleImport} disabled={importing}>
                    {importing ? 'Importando...' : 'Importar Matrículas'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* RESPOSTAS TAB */}
            <TabsContent value="responses" className="mt-4">
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>E-mail</TableHead>
                        <TableHead>Data de Envio</TableHead>
                        <TableHead className="w-[80px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {responses.length === 0 ? (
                        <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Nenhuma resposta encontrada</TableCell></TableRow>
                      ) : responses.map((r: any) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium">{r.profiles?.full_name || '—'}</TableCell>
                          <TableCell>{r.profiles?.email || '—'}</TableCell>
                          <TableCell>{format(new Date(r.submitted_at), 'dd/MM/yyyy HH:mm')}</TableCell>
                          <TableCell>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => setViewingResponse(r)}>
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Respostas — {r.profiles?.full_name}</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 mt-4">
                                  {Object.entries(QUESTION_LABELS).map(([key, label]) => {
                                    const val = (r.answers as Record<string, any>)?.[key];
                                    if (key === 'q9_pda_axes' && val && typeof val === 'object') {
                                      return (
                                        <div key={key}>
                                          <p className="text-sm font-medium text-muted-foreground">{label}</p>
                                          <div className="flex flex-wrap gap-2 mt-1">
                                            {Object.entries(val).map(([axis, level]) => (
                                              <Badge key={axis} variant="secondary">{axis} {level as string}</Badge>
                                            ))}
                                          </div>
                                        </div>
                                      );
                                    }
                                    return (
                                      <div key={key}>
                                        <p className="text-sm font-medium text-muted-foreground">{label}</p>
                                        <p className="text-sm mt-0.5 whitespace-pre-wrap">{val || '—'}</p>
                                      </div>
                                    );
                                  })}
                                </div>
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* MATERIAIS TAB */}
            <TabsContent value="materials" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Adicionar Material</CardTitle>
                  <CardDescription>Adicione links, PDFs ou documentos para os alunos. Vincule a um módulo e categorize como Pre-work, Material ou Exercício.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Título</Label>
                      <Input value={materialTitle} onChange={e => setMaterialTitle(e.target.value)} placeholder="Ex: Apostila do Módulo 1" />
                    </div>
                    <div className="space-y-2">
                      <Label>Tipo de Arquivo</Label>
                      <Select value={materialFileType} onValueChange={setMaterialFileType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="link">Link</SelectItem>
                          <SelectItem value="pdf">PDF</SelectItem>
                          <SelectItem value="doc">Documento</SelectItem>
                          <SelectItem value="video">Vídeo</SelectItem>
                          <SelectItem value="other">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Módulo {modules.length > 0 ? '' : '(nenhum cadastrado)'}</Label>
                      <Select value={materialModuleId} onValueChange={setMaterialModuleId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sem módulo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sem módulo</SelectItem>
                          {modules.map((m: any) => (
                            <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Categoria</Label>
                      <Select value={materialCategory} onValueChange={setMaterialCategory}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MATERIAL_CATEGORIES.map(c => (
                            <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {materialFileType === 'link' || materialFileType === 'video' ? (
                    <div className="space-y-2">
                      <Label>{materialFileType === 'video' ? 'URL do Vídeo (YouTube, Vimeo, etc.)' : 'URL do arquivo / link'}</Label>
                      <Input value={materialFileUrl} onChange={e => setMaterialFileUrl(e.target.value)} placeholder={materialFileType === 'video' ? 'https://youtube.com/watch?v=...' : 'https://...'} />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label>Fazer upload de arquivo</Label>
                        <Input
                          type="file"
                          accept={materialFileType === 'pdf' ? '.pdf' : '*'}
                          onChange={e => setMaterialFile(e.target.files?.[0] || null)}
                        />
                        {materialFile && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <FileUp className="w-3 h-3" /> {materialFile.name}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-muted-foreground text-xs">Ou informe uma URL externa</Label>
                        <Input value={materialFileUrl} onChange={e => setMaterialFileUrl(e.target.value)} placeholder="https://..." />
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>Descrição (opcional)</Label>
                    <Textarea value={materialDescription} onChange={e => setMaterialDescription(e.target.value)} placeholder="Breve descrição do material..." className="min-h-[80px]" />
                  </div>
                  <Button onClick={handleSaveMaterial} disabled={savingMaterial}>
                    {savingMaterial ? 'Salvando...' : 'Adicionar Material'}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Título</TableHead>
                        <TableHead>Módulo</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="w-[80px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {materials.length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhum material cadastrado</TableCell></TableRow>
                      ) : materials.map((m: any) => (
                        <TableRow key={m.id}>
                          <TableCell className="font-medium">{m.title}</TableCell>
                          <TableCell>{getModuleName(m.module_id)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {MATERIAL_CATEGORIES.find(c => c.value === m.category)?.label || m.category || 'Material'}
                            </Badge>
                          </TableCell>
                          <TableCell><Badge variant="secondary">{m.file_type || '—'}</Badge></TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteMaterial(m.id)} className="text-destructive hover:text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AppLayout>
  );
}
