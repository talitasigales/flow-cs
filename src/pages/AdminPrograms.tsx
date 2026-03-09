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
import { Upload, Users, FileText, Trash2, Eye, Plus, CalendarIcon, GraduationCap, PackagePlus } from 'lucide-react';

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
  const [savingClass, setSavingClass] = useState(false);

  // Import class selector
  const [importClassId, setImportClassId] = useState('');

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
      });
      if (error) throw error;
      toast.success('Turma criada com sucesso');
      setClassName('');
      setClassStartDate(undefined);
      setClassEndDate(undefined);
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
          <p className="text-muted-foreground text-sm">Turmas, matrículas, importação e respostas dos alunos</p>
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
              <TabsTrigger value="enrollments" className="gap-1.5"><Users className="w-4 h-4" /> Matrículas ({enrollments.length})</TabsTrigger>
              <TabsTrigger value="import" className="gap-1.5"><Upload className="w-4 h-4" /> Importar</TabsTrigger>
              <TabsTrigger value="responses" className="gap-1.5"><FileText className="w-4 h-4" /> Respostas ({responses.length})</TabsTrigger>
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
                        <TableHead>Data Início</TableHead>
                        <TableHead>Data Fim</TableHead>
                        <TableHead className="w-[80px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {classes.length === 0 ? (
                        <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Nenhuma turma cadastrada</TableCell></TableRow>
                      ) : classes.map((c: any) => (
                        <TableRow key={c.id}>
                          <TableCell className="font-medium">{c.name}</TableCell>
                          <TableCell>{c.start_date ? format(new Date(c.start_date + 'T12:00:00'), 'dd/MM/yyyy') : '—'}</TableCell>
                          <TableCell>{c.end_date ? format(new Date(c.end_date + 'T12:00:00'), 'dd/MM/yyyy') : '—'}</TableCell>
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
          </Tabs>
        )}
      </div>
    </AppLayout>
  );
}
