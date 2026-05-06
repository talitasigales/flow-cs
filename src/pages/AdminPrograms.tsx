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
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Upload, Users, FileText, Trash2, Eye, Plus, CalendarIcon, GraduationCap, PackagePlus, Layers, Pencil, ExternalLink, Clock, Video, FileUp, UserCircle, ChevronRight, MessageSquare, Award, FileDown } from 'lucide-react';
import { downloadEnrollmentTemplate } from '@/utils/exportUtils';
import { ModuleExerciseManager } from '@/components/admin/ModuleExerciseManager';
import { ModuleFeatureLinkManager } from '@/components/admin/ModuleFeatureLinkManager';
import { ModuleMaterialManager } from '@/components/admin/ModuleMaterialManager';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { JourneyTimeline } from '@/components/academy/JourneyTimeline';
import { ProgramMaterials } from '@/components/academy/ProgramMaterials';
import { ExerciseRenderer } from '@/components/academy/ExerciseRenderer';
import { FeatureLinkCards } from '@/components/academy/FeatureLinkCards';
import { ProgramWelcomeManager } from '@/components/admin/ProgramWelcomeManager';
import { CertificateManager } from '@/components/admin/CertificateManager';
import * as XLSX from 'xlsx';

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
  const [enrollmentSearch, setEnrollmentSearch] = useState('');
  const [pendingClassFilter, setPendingClassFilter] = useState('all');
  const [pendingSearch, setPendingSearch] = useState('');
  const [viewByClassId, setViewByClassId] = useState('');
  const [viewingResponse, setViewingResponse] = useState<any>(null);

  // New class dialog state
  const [classDialogOpen, setClassDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<any>(null);
  const [className, setClassName] = useState('');
  const [classStartDate, setClassStartDate] = useState<Date>();
  const [classEndDate, setClassEndDate] = useState<Date>();
  const [classVideoUrl, setClassVideoUrl] = useState('');
  const [classSpecialist, setClassSpecialist] = useState('');
  const [classModuleIds, setClassModuleIds] = useState<string[]>([]);
  // module_id -> array de specialist_ids
  const [classModuleSpecialists, setClassModuleSpecialists] = useState<Record<string, string[]>>({});
  const [classPdaReportEnabled, setClassPdaReportEnabled] = useState(false);
  const [classResilienceUrl, setClassResilienceUrl] = useState('');
  const [classDilemmasUrl, setClassDilemmasUrl] = useState('');
  const [savingClass, setSavingClass] = useState(false);

  // Import class selector
  const [importClassId, setImportClassId] = useState('');

  // Individual enrollment state
  const [individualName, setIndividualName] = useState('');
  const [individualEmail, setIndividualEmail] = useState('');
  const [individualSecondaryEmail, setIndividualSecondaryEmail] = useState('');
  const [individualClassId, setIndividualClassId] = useState('');
  const [individualResilienceUrl, setIndividualResilienceUrl] = useState('');
  const [individualDilemmasUrl, setIndividualDilemmasUrl] = useState('');
  const [enrollingIndividual, setEnrollingIndividual] = useState(false);

  // Materials state
  const [materialTitle, setMaterialTitle] = useState('');
  const [materialDescription, setMaterialDescription] = useState('');
  const [materialFileUrl, setMaterialFileUrl] = useState('');
  const [materialFileType, setMaterialFileType] = useState('link');
  const [materialModuleId, setMaterialModuleId] = useState('');
  const [materialCategory, setMaterialCategory] = useState('material');
  const [materialFile, setMaterialFile] = useState<File | null>(null);
  const [materialVideoEntries, setMaterialVideoEntries] = useState<{url: string; title: string}[]>([{ url: '', title: '' }]);
  const [savingMaterial, setSavingMaterial] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<any>(null);

  // Modules state
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<any>(null);
  const [moduleTitle, setModuleTitle] = useState('');
  const [moduleDescription, setModuleDescription] = useState('');
  const [moduleOrder, setModuleOrder] = useState(0);
  const [moduleSpecialistIds, setModuleSpecialistIds] = useState<string[]>([]);
  const [savingModule, setSavingModule] = useState(false);

  // Schedule state
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<any>(null);
  const [scheduleClassId, setScheduleClassId] = useState('');
  const [scheduleTitle, setScheduleTitle] = useState('');
  const [scheduleDate, setScheduleDate] = useState<Date>();
  const [scheduleStartTime, setScheduleStartTime] = useState('');
  const [scheduleEndTime, setScheduleEndTime] = useState('');
  const [scheduleModuleIds, setScheduleModuleIds] = useState<string[]>([]);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [scheduleClassFilter, setScheduleClassFilter] = useState('all');

  // Specialists management state
  const [specialistDialogOpen, setSpecialistDialogOpen] = useState(false);
  const [editingSpecialist, setEditingSpecialist] = useState<any>(null);
  const [specialistName, setSpecialistName] = useState('');
  const [specialistBio, setSpecialistBio] = useState('');
  const [specialistAvatarUrl, setSpecialistAvatarUrl] = useState('');
  const [savingSpecialist, setSavingSpecialist] = useState(false);

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

  const { data: specialists = [], refetch: refetchSpecialists } = useQuery({
    queryKey: ['all-specialists'],
    queryFn: async () => {
      const { data } = await (supabase as any).from('specialists').select('*').order('name');
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
      let query = (supabase as any)
        .from('program_enrollments')
        .select('id, user_id, enrolled_at, class_id, resilience_url, dilemmas_url')
        .eq('program_id', selectedProgram)
        .order('enrolled_at', { ascending: false });
      if (selectedClassFilter && selectedClassFilter !== 'all') {
        query = query.eq('class_id', selectedClassFilter);
      }
      const { data: enrs } = await query;
      if (!enrs || enrs.length === 0) return [];
      const userIds = [...new Set(enrs.map(e => e.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, last_access_at')
        .in('user_id', userIds);
      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
      return enrs.map(e => ({ ...e, profiles: profileMap.get(e.user_id) || null }));
    },
  });

  const { data: pendingEnrollments = [], refetch: refetchPending } = useQuery({
    queryKey: ['pending-enrollments', selectedProgram],
    enabled: !!selectedProgram,
    queryFn: async () => {
      const { data } = await supabase
        .from('pending_enrollments')
        .select('*')
        .eq('program_id', selectedProgram)
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  // Auto-select default class for "Por Turma" view
  useEffect(() => {
    if (!viewByClassId && classes.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      const future = classes.find((c: any) => c.start_date && c.start_date >= today);
      setViewByClassId((future || classes[0]).id);
    } else if (viewByClassId && classes.length > 0 && !classes.some((c: any) => c.id === viewByClassId)) {
      setViewByClassId(classes[0]?.id || '');
    }
  }, [classes, viewByClassId]);

  // Filtered lists (client-side)
  const filteredEnrollments = enrollments.filter((e: any) => {
    if (!enrollmentSearch.trim()) return true;
    const s = enrollmentSearch.trim().toLowerCase();
    return (e.profiles?.full_name || '').toLowerCase().includes(s)
      || (e.profiles?.email || '').toLowerCase().includes(s);
  });

  const filteredPending = pendingEnrollments.filter((p: any) => {
    if (pendingClassFilter !== 'all' && p.class_id !== pendingClassFilter) return false;
    if (!pendingSearch.trim()) return true;
    const s = pendingSearch.trim().toLowerCase();
    return (p.email || '').toLowerCase().includes(s)
      || (p.secondary_email || '').toLowerCase().includes(s)
      || (p.full_name || '').toLowerCase().includes(s);
  });

  const enrollmentsForViewClass = enrollments.filter((e: any) => e.class_id === viewByClassId);
  const pendingForViewClass = pendingEnrollments.filter((p: any) => p.class_id === viewByClassId);

  const { data: responses = [] } = useQuery({
    queryKey: ['all-responses', selectedProgram],
    enabled: !!selectedProgram,
    queryFn: async () => {
      const { data: resps } = await supabase
        .from('workshop_responses')
        .select('id, user_id, answers, submitted_at')
        .eq('program_id', selectedProgram)
        .order('submitted_at', { ascending: false });
      if (!resps || resps.length === 0) return [];
      const userIds = [...new Set(resps.map(r => r.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', userIds);
      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
      return resps.map(r => ({ ...r, profiles: profileMap.get(r.user_id) || null }));
    },
  });

  // Fetch exercise responses for all modules of this program
  const moduleIds = modules.map((m: any) => m.id);
  const { data: exerciseResponses = [] } = useQuery({
    queryKey: ['all-exercise-responses', selectedProgram, moduleIds],
    enabled: moduleIds.length > 0,
    queryFn: async () => {
      // First get exercises for these modules
      const { data: exercises } = await (supabase as any)
        .from('module_exercises')
        .select('id, title, module_id')
        .in('module_id', moduleIds);
      if (!exercises || exercises.length === 0) return [];
      const exerciseIds = exercises.map((e: any) => e.id);
      const { data: respData } = await (supabase as any)
        .from('exercise_responses')
        .select('id, exercise_id, user_id, answers, submitted_at, updated_at')
        .in('exercise_id', exerciseIds)
        .order('submitted_at', { ascending: false });
      // Attach exercise title and fetch profiles
      const userIds = [...new Set((respData || []).map((r: any) => r.user_id))] as string[];
      const { data: profiles } = userIds.length > 0
        ? await supabase.from('profiles').select('user_id, full_name, email').in('user_id', userIds)
        : { data: [] };
      const profileMap = Object.fromEntries((profiles || []).map((p: any) => [p.user_id, p]));
      const exerciseMap = Object.fromEntries(exercises.map((e: any) => [e.id, e]));
      return (respData || []).map((r: any) => ({
        ...r,
        exercise: exerciseMap[r.exercise_id],
        profile: profileMap[r.user_id],
      }));
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

  const classIdsAdmin = classes.map((c: any) => c.id);
  const classIdsAdminKey = classIdsAdmin.sort().join(',');

  const { data: schedules = [], refetch: refetchSchedules } = useQuery({
    queryKey: ['class-schedules-admin', classIdsAdminKey],
    enabled: classIdsAdmin.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from('class_schedules')
        .select('*')
        .in('class_id', classIdsAdmin)
        .order('schedule_date')
        .order('order_number');
      return data || [];
    },
  });

  const scheduleIds = schedules.map((s: any) => s.id);
  const scheduleIdsKey = scheduleIds.sort().join(',');

  const { data: scheduleModulesData = [], refetch: refetchScheduleModules } = useQuery({
    queryKey: ['schedule-modules-admin', scheduleIdsKey],
    enabled: scheduleIds.length > 0,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('schedule_modules')
        .select('*')
        .in('schedule_id', scheduleIds);
      return data || [];
    },
  });

  const getScheduleModuleIds = (scheduleId: string): string[] =>
    scheduleModulesData.filter((sm: any) => sm.schedule_id === scheduleId).map((sm: any) => sm.module_id);

  // --- Handlers ---

  const openClassDialog = async (cls?: any) => {
    if (cls) {
      setEditingClass(cls);
      setClassName(cls.name);
      setClassStartDate(cls.start_date ? new Date(cls.start_date + 'T12:00:00') : undefined);
      setClassEndDate(cls.end_date ? new Date(cls.end_date + 'T12:00:00') : undefined);
      setClassVideoUrl(cls.video_conference_url || '');
      setClassSpecialist(cls.specialist || '');
      setClassPdaReportEnabled(!!cls.pda_report_enabled);
      setClassResilienceUrl(cls.resilience_url || '');
      setClassDilemmasUrl(cls.dilemmas_url || '');
      // Load existing class modules
      const { data: cm } = await (supabase as any).from('class_modules').select('module_id').eq('class_id', cls.id);
      setClassModuleIds((cm || []).map((r: any) => r.module_id));
      // Load existing module specialists
      const { data: cms } = await (supabase as any)
        .from('class_module_specialists')
        .select('module_id, specialist_id')
        .eq('class_id', cls.id);
      const map: Record<string, string[]> = {};
      (cms || []).forEach((r: any) => {
        if (!map[r.module_id]) map[r.module_id] = [];
        map[r.module_id].push(r.specialist_id);
      });
      setClassModuleSpecialists(map);
    } else {
      setEditingClass(null);
      setClassName('');
      setClassStartDate(undefined);
      setClassEndDate(undefined);
      setClassVideoUrl('');
      setClassSpecialist('');
      setClassPdaReportEnabled(false);
      setClassResilienceUrl('');
      setClassDilemmasUrl('');
      // Default: select all modules
      setClassModuleIds(modules.map((m: any) => m.id));
      setClassModuleSpecialists({});
    }
    setClassDialogOpen(true);
  };

  const handleSaveClass = async () => {
    if (!className.trim() || !selectedProgram) {
      toast.error('Nome da turma é obrigatório');
      return;
    }
    setSavingClass(true);
    try {
      const payload: any = {
        name: className.trim(),
        start_date: classStartDate ? format(classStartDate, 'yyyy-MM-dd') : null,
        end_date: classEndDate ? format(classEndDate, 'yyyy-MM-dd') : null,
        video_conference_url: classVideoUrl.trim() || null,
        specialist: classSpecialist || null,
        pda_report_enabled: classPdaReportEnabled,
        resilience_url: classResilienceUrl.trim() || null,
        dilemmas_url: classDilemmasUrl.trim() || null,
      };
      let classId: string;
      if (editingClass) {
        const { error } = await supabase.from('program_classes').update(payload).eq('id', editingClass.id);
        if (error) throw error;
        classId = editingClass.id;
        toast.success('Turma atualizada com sucesso');
      } else {
        payload.program_id = selectedProgram;
        const { data: newClass, error } = await supabase.from('program_classes').insert(payload).select('id').single();
        if (error) throw error;
        classId = newClass.id;
        toast.success('Turma criada com sucesso');
      }

      // Sync class_modules
      await (supabase as any).from('class_modules').delete().eq('class_id', classId);
      if (classModuleIds.length > 0) {
        await (supabase as any).from('class_modules').insert(
          classModuleIds.map(mid => ({ class_id: classId, module_id: mid }))
        );
      }

      // Sync class_module_specialists (somente para módulos selecionados)
      await (supabase as any).from('class_module_specialists').delete().eq('class_id', classId);
      const cmsRows: any[] = [];
      classModuleIds.forEach(mid => {
        const specIds = classModuleSpecialists[mid] || [];
        specIds.forEach((sid, idx) => {
          cmsRows.push({ class_id: classId, module_id: mid, specialist_id: sid, order_number: idx });
        });
      });
      if (cmsRows.length > 0) {
        await (supabase as any).from('class_module_specialists').insert(cmsRows);
      }

      setClassName('');
      setClassStartDate(undefined);
      setClassEndDate(undefined);
      setClassVideoUrl('');
      setClassSpecialist('');
      setClassModuleIds([]);
      setClassModuleSpecialists({});
      setEditingClass(null);
      setClassDialogOpen(false);
      refetchClasses();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar turma');
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

  const handleIndividualEnrollment = async () => {
    if (!individualEmail.trim() || !individualName.trim() || !selectedProgram) {
      toast.error('Preencha nome, e-mail e selecione um programa');
      return;
    }
    setEnrollingIndividual(true);
    try {
      // 1. Ensure user exists (invite-user creates if not exists)
      const { data: inviteData, error: inviteError } = await supabase.functions.invoke('invite-user', {
        body: { email: individualEmail.trim().toLowerCase(), role: 'user' },
      });
      if (inviteError) throw inviteError;

      // 2. Update profile name
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('email', individualEmail.trim().toLowerCase())
        .maybeSingle();
      if (profile) {
        await supabase.from('profiles').update({ full_name: individualName.trim() }).eq('user_id', profile.user_id);
      }

      // 3. Enroll
      const primary = individualEmail.trim().toLowerCase();
      const secondary = individualSecondaryEmail.trim().toLowerCase();
      const { data, error } = await supabase.functions.invoke('import-enrollments', {
        body: {
          entries: [{
            name: individualName.trim(),
            email: primary,
            secondary_email: secondary && secondary !== primary ? secondary : null,
            resilience_url: individualResilienceUrl.trim() || null,
            dilemmas_url: individualDilemmasUrl.trim() || null,
          }],
          program_id: selectedProgram,
          class_id: individualClassId || null,
        },
      });
      if (error) throw error;

      if (data.enrolled > 0) {
        let msg = `${individualName} matriculado(a) com sucesso!`;
        if (inviteData?.tempPassword) {
          msg += ` Senha temporária: ${inviteData.tempPassword}`;
        }
        toast.success(msg, { duration: 15000 });
      } else if (data.pending > 0) {
        let msg = `${individualName} pré-matriculado(a). Será ativado no primeiro cadastro.`;
        if (inviteData?.tempPassword) {
          msg += ` Senha temporária: ${inviteData.tempPassword}`;
        }
        toast.success(msg, { duration: 15000 });
      } else if (data.alreadyEnrolled > 0) {
        toast.info('Aluno já está matriculado neste programa.');
      } else {
        toast.warning('Não foi possível matricular o aluno.');
      }

      setIndividualName('');
      setIndividualEmail('');
      setIndividualSecondaryEmail('');
      setIndividualClassId('');
      setIndividualResilienceUrl('');
      setIndividualDilemmasUrl('');
      refetchEnrollments();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao matricular aluno');
    } finally {
      setEnrollingIndividual(false);
    }
  };

  const parseEnrollmentCsv = (text: string): { entries: Array<{ name?: string; email: string; secondary_email?: string | null }>; errors: string[] } => {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const entries: Array<{ name?: string; email: string; secondary_email?: string | null }> = [];
    const errors: string[] = [];
    if (lines.length === 0) return { entries, errors };

    // Detect header
    const splitLine = (l: string) => l.split(/[,;\t]/).map((c) => c.trim());
    const first = splitLine(lines[0]).map((c) => c.toLowerCase());
    const looksLikeHeader = first.some((c) => c.includes('email') || c.includes('e-mail') || c === 'nome' || c === 'name');
    let nameIdx = -1, primaryIdx = -1, secondaryIdx = -1;
    let dataStart = 0;
    if (looksLikeHeader) {
      first.forEach((col, i) => {
        if (col === 'nome' || col === 'name') nameIdx = i;
        else if (col.includes('corporativo') || col.includes('corporate') || col.includes('work')) primaryIdx = i;
        else if (col.includes('pessoal') || col.includes('personal') || col.includes('alternativ')) secondaryIdx = i;
        else if ((col.includes('email') || col.includes('e-mail')) && primaryIdx === -1) primaryIdx = i;
        else if ((col.includes('email') || col.includes('e-mail')) && secondaryIdx === -1) secondaryIdx = i;
      });
      dataStart = 1;
    } else {
      // Fallback: assume single email per line OR "name,email" OR "name,email1,email2"
      // We'll handle per-line below.
    }

    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (let i = dataStart; i < lines.length; i++) {
      const cols = splitLine(lines[i]);
      let name: string | undefined;
      let email = '';
      let secondary = '';
      if (looksLikeHeader) {
        name = nameIdx >= 0 ? cols[nameIdx] : undefined;
        email = (primaryIdx >= 0 ? cols[primaryIdx] : '').toLowerCase();
        secondary = (secondaryIdx >= 0 ? (cols[secondaryIdx] || '') : '').toLowerCase();
      } else {
        // No header: try to be permissive
        const emails = cols.filter((c) => emailRe.test(c));
        const nonEmails = cols.filter((c) => !emailRe.test(c));
        email = (emails[0] || '').toLowerCase();
        secondary = (emails[1] || '').toLowerCase();
        name = nonEmails[0];
      }
      if (!email) { errors.push(`Linha ${i + 1}: e-mail principal vazio`); continue; }
      if (!emailRe.test(email)) { errors.push(`Linha ${i + 1}: e-mail principal inválido (${email})`); continue; }
      if (secondary && !emailRe.test(secondary)) { errors.push(`Linha ${i + 1}: e-mail secundário inválido (${secondary})`); continue; }
      entries.push({ name: name || undefined, email, secondary_email: secondary && secondary !== email ? secondary : null });
    }
    return { entries, errors };
  };

  const handleImport = async () => {
    if (!csvText.trim() || !selectedProgram) {
      toast.error('Selecione um programa e insira os e-mails');
      return;
    }
    const { entries, errors } = parseEnrollmentCsv(csvText);
    if (errors.length > 0) {
      toast.error(`Erros no CSV: ${errors.slice(0, 3).join('; ')}${errors.length > 3 ? '…' : ''}`);
    }
    if (entries.length === 0) {
      return;
    }
    setImporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('import-enrollments', {
        body: { entries, program_id: selectedProgram, class_id: importClassId || null },
      });
      if (error) throw error;
      let resultMsg = `Importação concluída: ${data.enrolled} matriculados`;
      if (data.pending > 0) {
        resultMsg += `, ${data.pending} pré-matriculados (serão ativados no primeiro cadastro)`;
      }
      resultMsg += `, ${data.alreadyEnrolled} já existentes`;
      toast.success(resultMsg);
      if (data.notFound?.length > 0) {
        toast.warning(`E-mails com erro: ${data.notFound.join(', ')}`);
      }
      setCsvText('');
      refetchEnrollments();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao importar');
    } finally {
      setImporting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows: any[][] = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

      // Convert sheet rows to CSV text preserving the tabular structure (name, email, secondary)
      const lines: string[] = [];
      for (const row of rows) {
        if (!row || row.length === 0) continue;
        const cleaned = row.map((c) => (c == null ? '' : String(c).trim()));
        if (cleaned.every((c) => c === '')) continue;
        lines.push(cleaned.join(','));
      }

      if (lines.length === 0) {
        toast.error('Planilha vazia');
        return;
      }

      setCsvText(lines.join('\n'));
      toast.success(`${lines.length} linhas carregadas. Confira e clique em Importar.`);
    } catch (err) {
      toast.error('Erro ao ler arquivo. Verifique se é um .xlsx, .xls ou .csv válido.');
    }
    e.target.value = '';
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
  const openModuleDialog = async (mod?: any) => {
    if (mod) {
      setEditingModule(mod);
      setModuleTitle(mod.title);
      setModuleDescription(mod.description || '');
      setModuleOrder(mod.order_number || 0);
      // Load default specialists for this module
      const { data: mds } = await (supabase as any)
        .from('module_default_specialists')
        .select('specialist_id, order_number')
        .eq('module_id', mod.id)
        .order('order_number');
      setModuleSpecialistIds((mds || []).map((r: any) => r.specialist_id));
    } else {
      setEditingModule(null);
      setModuleTitle('');
      setModuleDescription('');
      setModuleOrder(modules.length);
      setModuleSpecialistIds([]);
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
      let moduleId = editingModule?.id;
      if (editingModule) {
        const { error } = await supabase.from('program_modules').update({
          title: moduleTitle.trim(),
          description: moduleDescription.trim() || null,
          order_number: moduleOrder,
        }).eq('id', editingModule.id);
        if (error) throw error;
        toast.success('Módulo atualizado');
      } else {
        const { data: inserted, error } = await supabase.from('program_modules').insert({
          program_id: selectedProgram,
          title: moduleTitle.trim(),
          description: moduleDescription.trim() || null,
          order_number: moduleOrder,
        }).select('id').single();
        if (error) throw error;
        moduleId = inserted?.id;
        toast.success('Módulo criado');
      }

      // Sync default specialists for this module (replicates to all classes via DB trigger)
      if (moduleId) {
        await (supabase as any).from('module_default_specialists').delete().eq('module_id', moduleId);
        if (moduleSpecialistIds.length > 0) {
          const rows = moduleSpecialistIds.map((sid, idx) => ({
            module_id: moduleId,
            specialist_id: sid,
            order_number: idx,
          }));
          const { error: sErr } = await (supabase as any).from('module_default_specialists').insert(rows);
          if (sErr) throw sErr;
        }
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

      const validVideos = materialVideoEntries.filter(v => v.url.trim());
      const insertData: any = {
        program_id: selectedProgram,
        title: materialTitle.trim(),
        description: materialDescription.trim() || null,
        file_url: materialFileType === 'video' ? (validVideos[0]?.url || null) : (fileUrl || null),
        file_type: materialFileType,
        order_number: materials.length,
        module_id: materialModuleId && materialModuleId !== 'none' ? materialModuleId : null,
        category: materialCategory,
      };

      if (materialFileType === 'video' && validVideos.length > 0) {
        insertData.video_urls = validVideos.map(v => ({ url: v.url.trim(), title: v.title.trim() || null }));
      }

      if (editingMaterial) {
        const { error } = await supabase.from('program_materials').update(insertData).eq('id', editingMaterial.id);
        if (error) throw error;
        toast.success('Material atualizado');
        setEditingMaterial(null);
      } else {
        const { error } = await supabase.from('program_materials').insert(insertData);
        if (error) throw error;
        toast.success('Material adicionado');
      }
      setMaterialTitle('');
      setMaterialDescription('');
      setMaterialFileUrl('');
      setMaterialFileType('link');
      setMaterialModuleId('');
      setMaterialCategory('material');
      setMaterialFile(null);
      setMaterialVideoEntries([{ url: '', title: '' }]);
      refetchMaterials();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar material');
    } finally {
      setSavingMaterial(false);
    }
  };

  const handleEditMaterial = (m: any) => {
    setEditingMaterial(m);
    setMaterialTitle(m.title || '');
    setMaterialDescription(m.description || '');
    setMaterialFileUrl(m.file_url || '');
    setMaterialFileType(m.file_type || 'link');
    setMaterialModuleId(m.module_id || '');
    setMaterialCategory(m.category || 'material');
    setMaterialFile(null);
    setMaterialVideoEntries(
      Array.isArray(m.video_urls) && m.video_urls.length > 0
        ? m.video_urls.map((v: any) => ({ url: v.url || '', title: v.title || '' }))
        : [{ url: '', title: '' }]
    );
  };

  const handleCancelEditMaterial = () => {
    setEditingMaterial(null);
    setMaterialTitle('');
    setMaterialDescription('');
    setMaterialFileUrl('');
    setMaterialFileType('link');
    setMaterialModuleId('');
    setMaterialCategory('material');
    setMaterialFile(null);
    setMaterialVideoEntries([{ url: '', title: '' }]);
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

  const openScheduleDialog = (schedule?: any) => {
    if (schedule) {
      setEditingSchedule(schedule);
      setScheduleClassId(schedule.class_id);
      setScheduleTitle(schedule.title);
      setScheduleDate(schedule.schedule_date ? new Date(schedule.schedule_date + 'T12:00:00') : undefined);
      setScheduleStartTime(schedule.start_time?.slice(0, 5) || '');
      setScheduleEndTime(schedule.end_time?.slice(0, 5) || '');
      setScheduleModuleIds(getScheduleModuleIds(schedule.id));
    } else {
      setEditingSchedule(null);
      setScheduleClassId('');
      setScheduleTitle('');
      setScheduleDate(undefined);
      setScheduleStartTime('');
      setScheduleEndTime('');
      setScheduleModuleIds([]);
    }
    setScheduleDialogOpen(true);
  };

  const handleSaveSchedule = async () => {
    if (!scheduleTitle.trim() || !scheduleClassId || !scheduleDate) {
      toast.error('Título, turma e data são obrigatórios');
      return;
    }
    setSavingSchedule(true);
    try {
      const payload: any = {
        class_id: scheduleClassId,
        title: scheduleTitle.trim(),
        schedule_date: format(scheduleDate, 'yyyy-MM-dd'),
        start_time: scheduleStartTime || null,
        end_time: scheduleEndTime || null,
      };
      let scheduleId: string;
      if (editingSchedule) {
        const { error } = await supabase.from('class_schedules').update(payload).eq('id', editingSchedule.id);
        if (error) throw error;
        scheduleId = editingSchedule.id;
        // Remove old module links
        await (supabase as any).from('schedule_modules').delete().eq('schedule_id', scheduleId);
      } else {
        payload.order_number = schedules.filter((s: any) => s.class_id === scheduleClassId).length;
        const { data: inserted, error } = await supabase.from('class_schedules').insert(payload).select('id').single();
        if (error) throw error;
        scheduleId = inserted.id;
      }
      // Insert new module links
      if (scheduleModuleIds.length > 0) {
        const links = scheduleModuleIds.map(mid => ({ schedule_id: scheduleId, module_id: mid }));
        const { error: linkErr } = await (supabase as any).from('schedule_modules').insert(links);
        if (linkErr) throw linkErr;
      }
      toast.success(editingSchedule ? 'Etapa atualizada' : 'Etapa adicionada ao cronograma');
      setScheduleTitle('');
      setScheduleDate(undefined);
      setScheduleStartTime('');
      setScheduleEndTime('');
      setScheduleModuleIds([]);
      setEditingSchedule(null);
      setScheduleDialogOpen(false);
      refetchSchedules();
      refetchScheduleModules();
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

  const openSpecialistDialog = (spec?: any) => {
    if (spec) {
      setEditingSpecialist(spec);
      setSpecialistName(spec.name);
      setSpecialistBio(spec.bio || '');
      setSpecialistAvatarUrl(spec.avatar_url || '');
    } else {
      setEditingSpecialist(null);
      setSpecialistName('');
      setSpecialistBio('');
      setSpecialistAvatarUrl('');
    }
    setSpecialistDialogOpen(true);
  };

  const handleSaveSpecialist = async () => {
    if (!specialistName.trim()) { toast.error('Nome é obrigatório'); return; }
    setSavingSpecialist(true);
    try {
      const payload = { name: specialistName.trim(), bio: specialistBio.trim() || null, avatar_url: specialistAvatarUrl.trim() || null };
      if (editingSpecialist) {
        await (supabase as any).from('specialists').update(payload).eq('id', editingSpecialist.id);
      } else {
        await (supabase as any).from('specialists').insert(payload);
      }
      toast.success(editingSpecialist ? 'Especialista atualizada!' : 'Especialista cadastrada!');
      refetchSpecialists();
      setSpecialistDialogOpen(false);
      setEditingSpecialist(null);
    } catch { toast.error('Erro ao salvar'); }
    setSavingSpecialist(false);
  };

  const handleDeleteSpecialist = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta especialista?')) return;
    await (supabase as any).from('specialists').delete().eq('id', id);
    toast.success('Especialista removida');
    refetchSpecialists();
  };

  const renderClassDialog = () => (
    <Dialog open={classDialogOpen} onOpenChange={(v) => { setClassDialogOpen(v); if (!v) setEditingClass(null); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editingClass ? 'Editar Turma' : 'Criar Turma'}</DialogTitle>
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
            <Label>Especialista Responsável (padrão da turma)</Label>
            <Select value={classSpecialist} onValueChange={setClassSpecialist}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a especialista" />
              </SelectTrigger>
              <SelectContent>
                {specialists.map((s: any) => (
                  <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Usado quando um módulo não tem especialistas específicos definidos abaixo.</p>
          </div>
          <div className="space-y-2">
            <Label>Link da Videoconferência (Zoom/Meet)</Label>
            <Input value={classVideoUrl} onChange={e => setClassVideoUrl(e.target.value)} placeholder="https://zoom.us/j/... ou https://meet.google.com/..." />
          </div>
          <div className="space-y-3 border rounded-lg p-3">
            <Label className="text-sm font-semibold">Recursos iniciais para os alunos</Label>
            <p className="text-xs text-muted-foreground -mt-1">Escolha o que será exibido na tela inicial desta turma.</p>
            <div className="flex items-center gap-2">
              <Checkbox
                id="cls-pda-report"
                checked={classPdaReportEnabled}
                onCheckedChange={(c) => setClassPdaReportEnabled(!!c)}
              />
              <label htmlFor="cls-pda-report" className="text-sm cursor-pointer">
                Habilitar upload do Relatório PDA Individual
              </label>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Link do Questionário de Resiliência</Label>
              <Input
                value={classResilienceUrl}
                onChange={e => setClassResilienceUrl(e.target.value)}
                placeholder="https://... (deixe vazio para ocultar)"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Link do Questionário Dilemas de Gestão</Label>
              <Input
                value={classDilemmasUrl}
                onChange={e => setClassDilemmasUrl(e.target.value)}
                placeholder="https://... (deixe vazio para ocultar)"
              />
            </div>
          </div>
          {modules.length > 0 && (
            <div className="space-y-2">
              <Label>Módulos desta Turma</Label>
              <div className="border rounded-lg p-3 space-y-2 max-h-[200px] overflow-y-auto">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">{classModuleIds.length} de {modules.length} selecionados</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs h-6 px-2"
                    onClick={() => setClassModuleIds(
                      classModuleIds.length === modules.length ? [] : modules.map((m: any) => m.id)
                    )}
                  >
                    {classModuleIds.length === modules.length ? 'Desmarcar todos' : 'Selecionar todos'}
                  </Button>
                </div>
                {modules.map((m: any) => (
                  <div key={m.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`class-mod-${m.id}`}
                      checked={classModuleIds.includes(m.id)}
                      onCheckedChange={(checked) => {
                        setClassModuleIds(prev =>
                          checked ? [...prev, m.id] : prev.filter(id => id !== m.id)
                        );
                      }}
                    />
                    <label htmlFor={`class-mod-${m.id}`} className="text-sm cursor-pointer flex-1">
                      {m.order_number != null ? `${m.order_number}. ` : ''}{m.title}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
          {classModuleIds.length > 0 && specialists.length > 0 && (
            <div className="space-y-2">
              <Label>Especialistas por Módulo</Label>
              <p className="text-xs text-muted-foreground">Para cada módulo selecionado, escolha um ou mais especialistas. Se nenhum for selecionado, será usado o especialista padrão da turma.</p>
              <div className="border rounded-lg p-3 space-y-3 max-h-[260px] overflow-y-auto">
                {modules.filter((m: any) => classModuleIds.includes(m.id)).map((m: any) => {
                  const selected = classModuleSpecialists[m.id] || [];
                  return (
                    <div key={m.id} className="space-y-1.5">
                      <p className="text-sm font-medium">
                        {m.order_number != null ? `${m.order_number}. ` : ''}{m.title}
                      </p>
                      <div className="flex flex-wrap gap-2 pl-1">
                        {specialists.map((s: any) => {
                          const checked = selected.includes(s.id);
                          return (
                            <button
                              type="button"
                              key={s.id}
                              onClick={() => {
                                setClassModuleSpecialists(prev => {
                                  const cur = prev[m.id] || [];
                                  const next = checked ? cur.filter(id => id !== s.id) : [...cur, s.id];
                                  return { ...prev, [m.id]: next };
                                });
                              }}
                              className={cn(
                                "px-2.5 py-1 rounded-full text-xs border transition-colors",
                                checked
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-background hover:bg-muted border-border"
                              )}
                            >
                              {s.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={handleSaveClass} disabled={savingClass}>
            {savingClass ? 'Salvando...' : editingClass ? 'Atualizar Turma' : 'Criar Turma'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const renderScheduleDialog = () => (
    <Dialog open={scheduleDialogOpen} onOpenChange={(v) => { setScheduleDialogOpen(v); if (!v) setEditingSchedule(null); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editingSchedule ? 'Editar Etapa' : 'Adicionar Etapa ao Cronograma'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Turma</Label>
            <Select value={scheduleClassId} onValueChange={setScheduleClassId} disabled={!!editingSchedule}>
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
            <Label>Módulos vinculados (opcional)</Label>
            <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
              {modules.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum módulo cadastrado</p>
              ) : modules.map((m: any) => (
                <label key={m.id} className="flex items-center gap-2 cursor-pointer text-sm">
                  <Checkbox
                    checked={scheduleModuleIds.includes(m.id)}
                    onCheckedChange={(checked) => {
                      setScheduleModuleIds(prev =>
                        checked ? [...prev, m.id] : prev.filter(id => id !== m.id)
                      );
                    }}
                  />
                  {m.title}
                </label>
              ))}
            </div>
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
            {savingSchedule ? 'Salvando...' : editingSchedule ? 'Atualizar Etapa' : 'Adicionar Etapa'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Gerenciar Programas</h1>
          <p className="text-muted-foreground text-sm">Turmas, módulos, matrículas, materiais e respostas dos alunos</p>
        </div>

        {/* Specialists Management */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2"><UserCircle className="w-5 h-5" /> Especialistas</CardTitle>
              <CardDescription>Cadastre e edite as especialistas que ministram os cursos</CardDescription>
            </div>
            <Button size="sm" className="gap-1.5" onClick={() => openSpecialistDialog()}>
              <Plus className="w-4 h-4" /> Nova Especialista
            </Button>
          </CardHeader>
          <CardContent>
            {specialists.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">Nenhuma especialista cadastrada.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {specialists.map((s: any) => (
                  <div key={s.id} className="flex items-start gap-3 p-4 rounded-lg border bg-muted/20">
                    {s.avatar_url ? (
                      <img src={s.avatar_url} alt={s.name} className="w-14 h-14 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <UserCircle className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{s.name}</p>
                      {s.bio && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{s.bio}</p>}
                      <div className="flex gap-1 mt-2">
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => openSpecialistDialog(s)}>
                          <Pencil className="w-3 h-3 mr-1" /> Editar
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-destructive" onClick={() => handleDeleteSpecialist(s.id)}>
                          <Trash2 className="w-3 h-3 mr-1" /> Excluir
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Specialist Dialog */}
        <Dialog open={specialistDialogOpen} onOpenChange={(v) => { setSpecialistDialogOpen(v); if (!v) setEditingSpecialist(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingSpecialist ? 'Editar Especialista' : 'Nova Especialista'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome Completo</Label>
                <Input value={specialistName} onChange={e => setSpecialistName(e.target.value)} placeholder="Ex: Silvia Kirsten" />
              </div>
              <div className="space-y-2">
                <Label>Mini Currículo</Label>
                <Textarea value={specialistBio} onChange={e => setSpecialistBio(e.target.value)} placeholder="Breve descrição profissional..." className="min-h-[80px]" />
              </div>
              <div className="space-y-2">
                <Label>URL da Foto</Label>
                <Input value={specialistAvatarUrl} onChange={e => setSpecialistAvatarUrl(e.target.value)} placeholder="/images/specialists/nome.png ou URL externa" />
                {specialistAvatarUrl && (
                  <div className="flex items-center gap-3 mt-2">
                    <img src={specialistAvatarUrl} alt="Preview" className="w-16 h-16 rounded-full object-cover border" />
                    <span className="text-xs text-muted-foreground">Preview</span>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSaveSpecialist} disabled={savingSpecialist}>
                {savingSpecialist ? 'Salvando...' : editingSpecialist ? 'Atualizar' : 'Cadastrar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
          <Tabs defaultValue="by-class">
            <TabsList className="flex flex-wrap h-auto w-full justify-start gap-1 p-1">
              <TabsTrigger value="by-class" className="gap-1.5"><GraduationCap className="w-4 h-4" /> Visão por Turma</TabsTrigger>
              <TabsTrigger value="enrollments" className="gap-1.5"><Users className="w-4 h-4" /> Matriculados ({enrollments.length})</TabsTrigger>
              <TabsTrigger value="pending" className="gap-1.5 data-[state=inactive]:text-primary"><Clock className="w-4 h-4" /> Pendentes ({pendingEnrollments.length})</TabsTrigger>
              <TabsTrigger value="classes" className="gap-1.5"><GraduationCap className="w-4 h-4" /> Turmas ({classes.length})</TabsTrigger>
              <TabsTrigger value="schedule" className="gap-1.5"><Clock className="w-4 h-4" /> Cronograma</TabsTrigger>
              <TabsTrigger value="modules" className="gap-1.5"><Layers className="w-4 h-4" /> Módulos ({modules.length})</TabsTrigger>
              <TabsTrigger value="responses" className="gap-1.5"><FileText className="w-4 h-4" /> Respostas ({responses.length + exerciseResponses.length})</TabsTrigger>
              <TabsTrigger value="materials" className="gap-1.5"><PackagePlus className="w-4 h-4" /> Materiais ({materials.length})</TabsTrigger>
              <TabsTrigger value="welcome" className="gap-1.5"><MessageSquare className="w-4 h-4" /> Boas-vindas</TabsTrigger>
              <TabsTrigger value="certificates" className="gap-1.5"><Award className="w-4 h-4" /> Certificados</TabsTrigger>
              <TabsTrigger value="student-view" className="gap-1.5"><Eye className="w-4 h-4" /> Visão do Aluno</TabsTrigger>
            </TabsList>

            {/* TURMAS TAB */}
            <TabsContent value="classes" className="mt-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Turmas</CardTitle>
                    <CardDescription>Gerencie as turmas deste programa</CardDescription>
                  </div>
                  <Button size="sm" className="gap-1.5" onClick={() => openClassDialog()}>
                    <Plus className="w-4 h-4" /> Nova Turma
                  </Button>
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
                        <TableHead className="w-[100px]"></TableHead>
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
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" onClick={() => openClassDialog(c)}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteClass(c.id)} className="text-destructive hover:text-destructive">
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
              {renderClassDialog()}
            </TabsContent>

            {/* CRONOGRAMA TAB */}
            <TabsContent value="schedule" className="mt-4 space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
                  <div>
                    <CardTitle className="text-lg">Cronograma da Turma</CardTitle>
                    <CardDescription>Defina as datas e horários de cada etapa/módulo por turma</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {classes.length > 0 && (
                      <Select value={scheduleClassFilter} onValueChange={setScheduleClassFilter}>
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Filtrar por turma" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas as turmas</SelectItem>
                          {classes.map((c: any) => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <Button size="sm" className="gap-1.5" onClick={() => {
                      if (scheduleClassFilter !== 'all') {
                        setScheduleClassId(scheduleClassFilter);
                      }
                      openScheduleDialog();
                    }}>
                      <Plus className="w-4 h-4" /> Nova Etapa
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {classes.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Crie uma turma primeiro para definir o cronograma.</p>
                  ) : (() => {
                    const filteredClasses = scheduleClassFilter === 'all'
                      ? classes
                      : classes.filter((c: any) => c.id === scheduleClassFilter);

                    const hasAnySchedule = filteredClasses.some((c: any) =>
                      schedules.some((s: any) => s.class_id === c.id)
                    );

                    return (
                      <div className="space-y-6">
                        {filteredClasses.map((c: any) => {
                          const classSchedules = schedules.filter((s: any) => s.class_id === c.id);
                          if (classSchedules.length === 0 && scheduleClassFilter === 'all') return null;
                          return (
                            <div key={c.id} className="space-y-3">
                              <h3 className="font-semibold text-sm flex items-center gap-2">
                                <GraduationCap className="w-4 h-4 text-primary" />
                                {c.name}
                                {c.specialist && <Badge variant="secondary" className="text-xs">{c.specialist}</Badge>}
                              </h3>
                              {classSchedules.length === 0 ? (
                                <p className="text-center text-muted-foreground py-4 text-sm">Nenhuma etapa cadastrada para esta turma.</p>
                              ) : (
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Data</TableHead>
                                      <TableHead>Horário</TableHead>
                                      <TableHead>Etapa</TableHead>
                                      <TableHead className="w-[100px]"></TableHead>
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
                                          <div className="flex gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => openScheduleDialog(s)}>
                                              <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDeleteSchedule(s.id)} className="text-destructive hover:text-destructive">
                                              <Trash2 className="w-4 h-4" />
                                            </Button>
                                          </div>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              )}
                            </div>
                          );
                        })}
                        {!hasAnySchedule && scheduleClassFilter === 'all' && (
                          <p className="text-center text-muted-foreground py-8">Nenhuma etapa cadastrada. Clique em "Nova Etapa" para começar.</p>
                        )}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
              {renderScheduleDialog()}
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
                    <CardTitle className="text-lg">Materiais, Exercícios & Funcionalidades por Módulo</CardTitle>
                    <CardDescription>Gerencie vídeos, arquivos, exercícios e links de funcionalidades para cada módulo</CardDescription>
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
                    <div className="space-y-2">
                      <Label>Especialistas do Módulo</Label>
                      <p className="text-xs text-muted-foreground">
                        Selecione quem ministra este módulo. Será aplicado automaticamente a todas as turmas (atuais e futuras) que usarem este módulo.
                      </p>
                      {specialists.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">Nenhuma especialista cadastrada ainda.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {specialists.map((s: any) => {
                            const selected = moduleSpecialistIds.includes(s.id);
                            return (
                              <button
                                type="button"
                                key={s.id}
                                onClick={() =>
                                  setModuleSpecialistIds(prev =>
                                    selected ? prev.filter(x => x !== s.id) : [...prev, s.id]
                                  )
                                }
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs transition-colors ${
                                  selected
                                    ? 'bg-primary text-primary-foreground border-primary'
                                    : 'bg-muted/30 border-border hover:bg-muted/60'
                                }`}
                              >
                                {s.avatar_url && (
                                  <img src={s.avatar_url} alt={s.name} className="w-5 h-5 rounded-full object-cover" />
                                )}
                                <span>{s.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
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
              {/* Individual enrollment form */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Cadastrar Aluno Individual</CardTitle>
                  <CardDescription className="text-xs mt-1">
                    Informe um e-mail principal e, opcionalmente, um secundário (corporativo + pessoal). O aluno será matriculado se cadastrar com qualquer um dos dois.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Nome completo</Label>
                      <Input placeholder="Nome do aluno" value={individualName} onChange={e => setIndividualName(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">E-mail principal</Label>
                      <Input type="email" placeholder="aluno@empresa.com" value={individualEmail} onChange={e => setIndividualEmail(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">E-mail secundário (opcional)</Label>
                      <Input type="email" placeholder="aluno@gmail.com" value={individualSecondaryEmail} onChange={e => setIndividualSecondaryEmail(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Turma</Label>
                      <Select value={individualClassId} onValueChange={setIndividualClassId}>
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
                    <Button onClick={handleIndividualEnrollment} disabled={enrollingIndividual || !individualName.trim() || !individualEmail.trim()} className="gap-1.5">
                      <Plus className="w-4 h-4" />
                      {enrollingIndividual ? 'Matriculando...' : 'Matricular'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Import in bulk - collapsible */}
              <Collapsible>
                <Card>
                  <CardHeader className="pb-3">
                    <CollapsibleTrigger className="flex items-center justify-between w-full">
                      <div className="text-left">
                        <CardTitle className="text-base flex items-center gap-2"><Upload className="w-4 h-4" /> Importar Matrículas em Massa</CardTitle>
                        <CardDescription className="mt-1">Importe alunos via planilha ou cole e-mails</CardDescription>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground transition-transform [[data-state=open]>&]:rotate-90" />
                    </CollapsibleTrigger>
                  </CardHeader>
                  <CollapsibleContent>
                    <CardContent className="space-y-4 pt-0">
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
                      <div className="space-y-2">
                        <Label>Importar de planilha (.xlsx, .xls, .csv)</Label>
                        <div className="flex items-center gap-3">
                          <Input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} className="max-w-sm" />
                          <Button variant="ghost" size="sm" onClick={() => { downloadEnrollmentTemplate(); toast.success('Modelo baixado'); }}>
                            <FileDown className="w-4 h-4 mr-1" /> Modelo CSV
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          O CSV deve ter 3 colunas com cabeçalho: <code>nome,email_corporativo,email_pessoal</code> (o e-mail pessoal é opcional). Aceita também colar texto abaixo.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>Colar dados (CSV com cabeçalho ou um e-mail por linha)</Label>
                        <Textarea value={csvText} onChange={e => setCsvText(e.target.value)} placeholder={"nome,email_corporativo,email_pessoal\nJoão Silva,joao@empresa.com,joao@gmail.com\nMaria Souza,maria@empresa.com,"} className="min-h-[150px] font-mono text-sm" />
                      </div>
                      <Button onClick={handleImport} disabled={importing || !csvText.trim()}>
                        {importing ? 'Importando...' : 'Importar Matrículas'}
                      </Button>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>

              {/* Filter + list */}
              <div className="flex flex-wrap items-center gap-3">
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
                <Input
                  value={enrollmentSearch}
                  onChange={e => setEnrollmentSearch(e.target.value)}
                  placeholder="Buscar por nome ou e-mail..."
                  className="max-w-[260px]"
                />
                <Badge variant="secondary" className="ml-auto">
                  {filteredEnrollments.length} matriculado{filteredEnrollments.length === 1 ? '' : 's'}
                </Badge>
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
                        <TableHead>Último Acesso</TableHead>
                        <TableHead className="w-[100px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEnrollments.length === 0 ? (
                        <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhuma matrícula encontrada</TableCell></TableRow>
                      ) : filteredEnrollments.map((e: any) => (
                        <TableRow key={e.id}>
                          <TableCell className="font-medium">{e.profiles?.full_name || '—'}</TableCell>
                          <TableCell>{e.profiles?.email || '—'}</TableCell>
                          <TableCell>
                            <Select
                              value={e.class_id || 'none'}
                              onValueChange={async (val) => {
                                const newClassId = val === 'none' ? null : val;
                                const { error } = await supabase.from('program_enrollments').update({ class_id: newClassId }).eq('id', e.id);
                                if (error) { toast.error('Erro ao atualizar turma'); return; }
                                toast.success('Turma atualizada');
                                refetchEnrollments();
                              }}
                            >
                              <SelectTrigger className="w-[180px] h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Sem turma</SelectItem>
                                {classes.map((c: any) => (
                                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                           </TableCell>
                          <TableCell>{format(new Date(e.enrolled_at), 'dd/MM/yyyy')}</TableCell>
                          <TableCell>
                            {e.profiles?.last_access_at 
                              ? format(new Date(e.profiles.last_access_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                              : <span className="text-muted-foreground text-xs">Nunca</span>
                            }
                          </TableCell>
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

            {/* PENDENTES TAB */}
            <TabsContent value="pending" className="mt-4 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Pré-matrículas Pendentes
                  </CardTitle>
                  <CardDescription>
                    Alunos que ainda não criaram conta. Ao se cadastrarem com um destes emails, o acesso será liberado automaticamente.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <Label className="text-sm">Filtrar por turma:</Label>
                    <Select value={pendingClassFilter} onValueChange={setPendingClassFilter}>
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
                    <Input
                      value={pendingSearch}
                      onChange={e => setPendingSearch(e.target.value)}
                      placeholder="Buscar por e-mail ou nome..."
                      className="max-w-[260px]"
                    />
                    <Badge variant="secondary" className="ml-auto">
                      {filteredPending.length} pendente{filteredPending.length === 1 ? '' : 's'}
                    </Badge>
                  </div>
                  {filteredPending.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">Nenhuma pré-matrícula pendente.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>E-mails</TableHead>
                          <TableHead>Turma</TableHead>
                          <TableHead>Data de cadastro</TableHead>
                          <TableHead className="w-[80px]">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPending.map((pe: any) => {
                          const cls = classes.find((c: any) => c.id === pe.class_id);
                          return (
                            <TableRow key={pe.id}>
                              <TableCell className="font-medium">
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="text-[10px] uppercase">Principal</Badge>
                                    <span>{pe.email}</span>
                                  </div>
                                  {pe.secondary_email && (
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="text-[10px] uppercase">Secundário</Badge>
                                      <span className="text-muted-foreground">{pe.secondary_email}</span>
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>{cls?.name || '—'}</TableCell>
                              <TableCell>{format(new Date(pe.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={async () => {
                                    const { error } = await supabase.from('pending_enrollments').delete().eq('id', pe.id);
                                    if (error) {
                                      toast.error('Erro ao remover pré-matrícula');
                                    } else {
                                      toast.success('Pré-matrícula removida');
                                      refetchPending();
                                    }
                                  }}
                                >
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* VISÃO POR TURMA TAB */}
            <TabsContent value="by-class" className="mt-4 space-y-4">
              {classes.length === 0 ? (
                <Card>
                  <CardContent className="py-10 text-center text-sm text-muted-foreground">
                    Cadastre uma turma para usar a visão consolidada.
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-3">
                    <Label className="text-sm">Turma:</Label>
                    <Select value={viewByClassId} onValueChange={setViewByClassId}>
                      <SelectTrigger className="w-[320px]">
                        <SelectValue placeholder="Selecionar turma" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map((c: any) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}{c.start_date ? ` — ${format(new Date(c.start_date + 'T12:00:00'), 'dd/MM/yyyy')}` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Card><CardContent className="p-4">
                      <p className="text-xs uppercase text-muted-foreground">Matriculados</p>
                      <p className="text-2xl font-bold mt-1">{enrollmentsForViewClass.length}</p>
                    </CardContent></Card>
                    <Card><CardContent className="p-4">
                      <p className="text-xs uppercase text-muted-foreground">Pendentes</p>
                      <p className="text-2xl font-bold mt-1">{pendingForViewClass.length}</p>
                    </CardContent></Card>
                    <Card><CardContent className="p-4">
                      <p className="text-xs uppercase text-muted-foreground">Total</p>
                      <p className="text-2xl font-bold mt-1">{enrollmentsForViewClass.length + pendingForViewClass.length}</p>
                    </CardContent></Card>
                  </div>

                  <Card>
                    <CardHeader className="pb-3 flex flex-row items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Users className="w-4 h-4" /> Matriculados na turma ({enrollmentsForViewClass.length})
                      </CardTitle>
                      <Button variant="outline" size="sm" disabled={enrollmentsForViewClass.length === 0}
                        onClick={() => {
                          const rows = [['Nome', 'E-mail', 'Data de matrícula', 'Último acesso']];
                          enrollmentsForViewClass.forEach((e: any) => {
                            rows.push([
                              e.profiles?.full_name || '',
                              e.profiles?.email || '',
                              e.enrolled_at ? format(new Date(e.enrolled_at), 'dd/MM/yyyy') : '',
                              e.profiles?.last_access_at ? format(new Date(e.profiles.last_access_at), 'dd/MM/yyyy HH:mm') : '',
                            ]);
                          });
                          const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
                          const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                          const a = document.createElement('a');
                          a.href = URL.createObjectURL(blob);
                          const cls = classes.find((c: any) => c.id === viewByClassId);
                          a.download = `matriculados-${cls?.name || 'turma'}.csv`;
                          a.click();
                        }}>
                        <FileDown className="w-4 h-4 mr-1" /> Exportar CSV
                      </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                      {enrollmentsForViewClass.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-6">Nenhum aluno matriculado nesta turma.</p>
                      ) : (
                        <Table>
                          <TableHeader><TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>E-mail</TableHead>
                            <TableHead>Data de Matrícula</TableHead>
                            <TableHead>Último Acesso</TableHead>
                            <TableHead className="w-[80px]"></TableHead>
                          </TableRow></TableHeader>
                          <TableBody>
                            {enrollmentsForViewClass.map((e: any) => (
                              <TableRow key={e.id}>
                                <TableCell className="font-medium">{e.profiles?.full_name || '—'}</TableCell>
                                <TableCell>{e.profiles?.email || '—'}</TableCell>
                                <TableCell>{format(new Date(e.enrolled_at), 'dd/MM/yyyy')}</TableCell>
                                <TableCell>
                                  {e.profiles?.last_access_at
                                    ? format(new Date(e.profiles.last_access_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                                    : <span className="text-muted-foreground text-xs">Nunca</span>}
                                </TableCell>
                                <TableCell>
                                  <Button variant="ghost" size="icon" onClick={() => handleRemoveEnrollment(e.id)} className="text-destructive hover:text-destructive">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3 flex flex-row items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Clock className="w-4 h-4" /> Pendentes da turma ({pendingForViewClass.length})
                      </CardTitle>
                      <Button variant="outline" size="sm" disabled={pendingForViewClass.length === 0}
                        onClick={() => {
                          const rows = [['E-mail principal', 'E-mail secundário', 'Data de cadastro']];
                          pendingForViewClass.forEach((p: any) => {
                            rows.push([
                              p.email || '',
                              p.secondary_email || '',
                              p.created_at ? format(new Date(p.created_at), 'dd/MM/yyyy HH:mm') : '',
                            ]);
                          });
                          const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
                          const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                          const a = document.createElement('a');
                          a.href = URL.createObjectURL(blob);
                          const cls = classes.find((c: any) => c.id === viewByClassId);
                          a.download = `pendentes-${cls?.name || 'turma'}.csv`;
                          a.click();
                        }}>
                        <FileDown className="w-4 h-4 mr-1" /> Exportar CSV
                      </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                      {pendingForViewClass.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-6">Nenhum pendente nesta turma.</p>
                      ) : (
                        <Table>
                          <TableHeader><TableRow>
                            <TableHead>E-mails</TableHead>
                            <TableHead>Data de cadastro</TableHead>
                            <TableHead className="w-[80px]"></TableHead>
                          </TableRow></TableHeader>
                          <TableBody>
                            {pendingForViewClass.map((pe: any) => (
                              <TableRow key={pe.id}>
                                <TableCell className="font-medium">
                                  <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                      <Badge variant="secondary" className="text-[10px] uppercase">Principal</Badge>
                                      <span>{pe.email}</span>
                                    </div>
                                    {pe.secondary_email && (
                                      <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-[10px] uppercase">Secundário</Badge>
                                        <span className="text-muted-foreground">{pe.secondary_email}</span>
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>{format(new Date(pe.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</TableCell>
                                <TableCell>
                                  <Button variant="ghost" size="icon"
                                    onClick={async () => {
                                      const { error } = await supabase.from('pending_enrollments').delete().eq('id', pe.id);
                                      if (error) toast.error('Erro ao remover pré-matrícula');
                                      else { toast.success('Pré-matrícula removida'); refetchPending(); }
                                    }}>
                                    <Trash2 className="w-4 h-4 text-destructive" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            {/* RESPOSTAS TAB */}
            <TabsContent value="responses" className="mt-4 space-y-4">
              {/* Workshop responses */}
              {responses.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Respostas do Questionário do Programa</CardTitle>
                  </CardHeader>
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
                        {responses.map((r: any) => (
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
              )}

              {/* Exercise responses */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Respostas dos Exercícios dos Módulos</CardTitle>
                  <CardDescription>Respostas dos alunos aos exercícios configurados em cada módulo</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>E-mail</TableHead>
                        <TableHead>Exercício</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead className="w-[80px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {exerciseResponses.length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhuma resposta de exercício encontrada</TableCell></TableRow>
                      ) : exerciseResponses.map((r: any) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium">{r.profile?.full_name || '—'}</TableCell>
                          <TableCell>{r.profile?.email || '—'}</TableCell>
                          <TableCell><Badge variant="outline">{r.exercise?.title || '—'}</Badge></TableCell>
                          <TableCell>{format(new Date(r.submitted_at), 'dd/MM/yyyy HH:mm')}</TableCell>
                          <TableCell>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Respostas — {r.profile?.full_name}</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-1 mt-2">
                                  <p className="text-xs text-muted-foreground">Exercício: <span className="font-medium text-foreground">{r.exercise?.title}</span></p>
                                </div>
                                <div className="space-y-4 mt-4">
                                  {r.answers && typeof r.answers === 'object' ? (
                                    Object.entries(r.answers).map(([qId, answer]) => (
                                      <div key={qId}>
                                        <p className="text-sm font-medium text-muted-foreground">Questão: {qId}</p>
                                        <p className="text-sm mt-0.5 whitespace-pre-wrap">
                                          {Array.isArray(answer) ? (answer as string[]).join(', ') : String(answer)}
                                        </p>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-sm text-muted-foreground">Sem respostas</p>
                                  )}
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

              {responses.length === 0 && exerciseResponses.length === 0 && (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    Nenhuma resposta encontrada para este programa.
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* MATERIAIS TAB */}
            <TabsContent value="materials" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{editingMaterial ? 'Editar Material' : 'Adicionar Material'}</CardTitle>
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
                  {materialFileType === 'video' ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>URLs dos Vídeos (YouTube)</Label>
                        <Button type="button" size="sm" variant="ghost" className="gap-1 text-xs h-7" onClick={() => setMaterialVideoEntries(prev => [...prev, { url: '', title: '' }])}>
                          <Plus className="w-3 h-3" /> Adicionar vídeo
                        </Button>
                      </div>
                      <div className="space-y-3">
                        {materialVideoEntries.map((entry, idx) => (
                          <div key={idx} className="flex gap-2 items-start">
                            <div className="flex-1 space-y-1.5">
                              <Input
                                value={entry.url}
                                onChange={e => setMaterialVideoEntries(prev => prev.map((v, i) => i === idx ? { ...v, url: e.target.value } : v))}
                                placeholder="https://youtube.com/watch?v=..."
                                className="text-sm"
                              />
                              <Input
                                value={entry.title}
                                onChange={e => setMaterialVideoEntries(prev => prev.map((v, i) => i === idx ? { ...v, title: e.target.value } : v))}
                                placeholder={`Título do vídeo ${idx + 1} (opcional)`}
                                className="text-xs h-8"
                              />
                            </div>
                            {materialVideoEntries.length > 1 && (
                              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 mt-0.5 text-muted-foreground hover:text-destructive" onClick={() => setMaterialVideoEntries(prev => prev.filter((_, i) => i !== idx))}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : materialFileType === 'link' ? (
                    <div className="space-y-2">
                      <Label>URL do arquivo / link</Label>
                      <Input value={materialFileUrl} onChange={e => setMaterialFileUrl(e.target.value)} placeholder="https://..." />
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
                   <div className="flex gap-2">
                     {editingMaterial && (
                       <Button variant="outline" onClick={handleCancelEditMaterial}>
                         Cancelar Edição
                       </Button>
                     )}
                     <Button onClick={handleSaveMaterial} disabled={savingMaterial}>
                       {savingMaterial ? 'Salvando...' : editingMaterial ? 'Salvar Alterações' : 'Adicionar Material'}
                     </Button>
                   </div>
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
                             <div className="flex gap-1">
                               <Button variant="ghost" size="icon" onClick={() => handleEditMaterial(m)}>
                                 <Pencil className="w-4 h-4" />
                               </Button>
                               <Button variant="ghost" size="icon" onClick={() => handleDeleteMaterial(m.id)} className="text-destructive hover:text-destructive">
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
            </TabsContent>

            {/* BOAS-VINDAS TAB */}
            <TabsContent value="welcome" className="mt-4">
              <ProgramWelcomeManager programId={selectedProgram} />
            </TabsContent>

            {/* CERTIFICADOS TAB */}
            <TabsContent value="certificates" className="mt-4">
              <CertificateManager programId={selectedProgram} classes={classes} />
            </TabsContent>

            {/* VISÃO DO ALUNO TAB */}
            <TabsContent value="student-view" className="mt-4">
              {(() => {
                const selectedProgramData = programs.find((p: any) => p.id === selectedProgram);
                const firstClass = classes[0];
                const classSchedulesForPreview = firstClass ? schedules.filter((s: any) => s.class_id === firstClass.id) : [];
                const unassignedMats = materials.filter((m: any) => !m.module_id);
                const today = new Date().toISOString().split('T')[0];

                return (
                  <div className="space-y-6">
                    <Card className="border-dashed border-primary/30 bg-primary/5">
                      <CardContent className="py-3 px-4">
                        <p className="text-xs text-muted-foreground flex items-center gap-2">
                          <Eye className="w-3.5 h-3.5" />
                          Pré-visualização de como o aluno vê este programa em <strong>Meu Desenvolvimento</strong>.
                          {firstClass && <span> Exibindo cronograma da turma <strong>{firstClass.name}</strong>.</span>}
                        </p>
                      </CardContent>
                    </Card>

                    {/* Program Header */}
                    <Card className="overflow-hidden border-primary/20">
                      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h2 className="text-xl font-bold">{selectedProgramData?.name}</h2>
                              <Badge variant="outline" className="text-xs border-primary/40 text-primary">Matriculado</Badge>
                            </div>
                            {selectedProgramData?.description && (
                              <p className="text-sm text-muted-foreground max-w-xl">{selectedProgramData.description}</p>
                            )}
                            {firstClass && (
                              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground pt-1">
                                <span className="flex items-center gap-1">
                                  <GraduationCap className="w-3.5 h-3.5" />
                                  Turma: <span className="font-medium text-foreground">{firstClass.name}</span>
                                </span>
                                {firstClass.start_date && (
                                  <span className="flex items-center gap-1">
                                    <CalendarIcon className="w-3.5 h-3.5" />
                                    {format(new Date(firstClass.start_date + 'T12:00:00'), "dd/MM/yyyy")}
                                    {firstClass.end_date && ` — ${format(new Date(firstClass.end_date + 'T12:00:00'), "dd/MM/yyyy")}`}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          {firstClass?.video_conference_url && (
                            <Button size="sm" className="shrink-0 gap-2">
                              <Video className="w-4 h-4" />
                              Entrar na aula
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Journey Timeline */}
                      {classSchedulesForPreview.length > 0 && (
                        <div className="lg:col-span-1">
                          <Card>
                            <CardHeader className="pb-3">
                              <CardTitle className="text-sm flex items-center gap-2">
                                <CalendarIcon className="w-4 h-4 text-primary" />
                                Cronograma
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <JourneyTimeline
                                schedules={classSchedulesForPreview}
                                videoConferenceUrl={firstClass?.video_conference_url}
                                specialist={firstClass?.specialist}
                              />
                            </CardContent>
                          </Card>
                        </div>
                      )}

                      {/* Modules & Materials */}
                      <div className={cn(
                        classSchedulesForPreview.length > 0 ? "lg:col-span-2" : "lg:col-span-3",
                        "space-y-6"
                      )}>
                        {modules.length > 0 && (
                          <Card>
                            <CardHeader className="pb-3">
                              <CardTitle className="text-sm flex items-center gap-2">
                                <Layers className="w-4 h-4 text-primary" />
                                Módulos do Programa
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                              {modules.map((mod: any, idx: number) => {
                                const modSchedule = classSchedulesForPreview.find((s: any) => s.module_id === mod.id);
                                const isCompleted = modSchedule && modSchedule.schedule_date < today;
                                const isCurrent = modSchedule && modSchedule.schedule_date === today;
                                const moduleMats = materials.filter((m: any) => m.module_id === mod.id);

                                return (
                                  <Accordion type="single" collapsible key={mod.id}>
                                    <AccordionItem value={mod.id} className="border-0">
                                      <AccordionTrigger className={cn(
                                        "p-3 rounded-lg hover:no-underline hover:bg-muted/50",
                                      )}>
                                        <div className="flex items-center gap-3 text-left">
                                          <div className={cn(
                                            "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                                            isCompleted ? "bg-primary/20 text-primary" : isCurrent ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                          )}>
                                            {idx + 1}
                                          </div>
                                          <div>
                                            <p className="text-sm font-semibold">{mod.title}</p>
                                            {mod.description && <p className="text-xs text-muted-foreground line-clamp-1">{mod.description}</p>}
                                          </div>
                                        </div>
                                      </AccordionTrigger>
                                      <AccordionContent className="ml-11 pt-2 space-y-4">
                                        {moduleMats.length > 0 && (
                                          <ProgramMaterials materials={moduleMats} />
                                        )}
                                        <ExerciseRenderer moduleId={mod.id} />
                                        <FeatureLinkCards moduleId={mod.id} />
                                        {moduleMats.length === 0 && (
                                          <p className="text-xs text-muted-foreground py-2">Nenhum material neste módulo.</p>
                                        )}
                                      </AccordionContent>
                                    </AccordionItem>
                                  </Accordion>
                                );
                              })}
                            </CardContent>
                          </Card>
                        )}

                        {unassignedMats.length > 0 && (
                          <Accordion type="single" collapsible>
                            <AccordionItem value="general-materials" className="border rounded-lg bg-card">
                              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                                <span className="text-sm font-semibold flex items-center gap-2">
                                  <FileText className="w-4 h-4 text-primary" />
                                  Materiais Gerais
                                  <Badge variant="secondary" className="text-[10px]">{unassignedMats.length}</Badge>
                                </span>
                              </AccordionTrigger>
                              <AccordionContent className="px-4 pb-4">
                                <ProgramMaterials materials={unassignedMats} />
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        )}

                        {modules.length === 0 && unassignedMats.length === 0 && (
                          <Card>
                            <CardContent className="py-8 text-center text-muted-foreground text-sm">
                              Nenhum conteúdo cadastrado para este programa ainda.
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AppLayout>
  );
}
