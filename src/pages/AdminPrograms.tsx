import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Upload, Users, FileText, Trash2, Eye } from 'lucide-react';
import { useEffect } from 'react';

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
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [csvText, setCsvText] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [importing, setImporting] = useState(false);
  const [viewingResponse, setViewingResponse] = useState<any>(null);

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

  const { data: enrollments = [], refetch: refetchEnrollments } = useQuery({
    queryKey: ['all-enrollments', selectedProgram],
    enabled: !!selectedProgram,
    queryFn: async () => {
      const { data } = await supabase
        .from('program_enrollments')
        .select('id, user_id, enrolled_at, profiles(full_name, email)')
        .eq('program_id', selectedProgram)
        .order('enrolled_at', { ascending: false });
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

  const handleImport = async () => {
    if (!csvText.trim() || !selectedProgram) {
      toast.error('Selecione um programa e insira os e-mails');
      return;
    }
    setImporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('import-enrollments', {
        body: { emails: csvText, program_id: selectedProgram },
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
          <p className="text-muted-foreground text-sm">Matrículas, importação de turmas e respostas dos alunos</p>
        </div>

        <div className="flex items-center gap-3">
          <Label>Programa:</Label>
          <Select value={selectedProgram} onValueChange={setSelectedProgram}>
            <SelectTrigger className="w-[250px]">
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
          <Tabs defaultValue="enrollments">
            <TabsList>
              <TabsTrigger value="enrollments" className="gap-1.5"><Users className="w-4 h-4" /> Matrículas ({enrollments.length})</TabsTrigger>
              <TabsTrigger value="import" className="gap-1.5"><Upload className="w-4 h-4" /> Importar Turma</TabsTrigger>
              <TabsTrigger value="responses" className="gap-1.5"><FileText className="w-4 h-4" /> Respostas ({responses.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="enrollments" className="mt-4">
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>E-mail</TableHead>
                        <TableHead>Data de Matrícula</TableHead>
                        <TableHead className="w-[80px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {enrollments.length === 0 ? (
                        <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Nenhuma matrícula encontrada</TableCell></TableRow>
                      ) : enrollments.map((e: any) => (
                        <TableRow key={e.id}>
                          <TableCell className="font-medium">{e.profiles?.full_name || '—'}</TableCell>
                          <TableCell>{e.profiles?.email || '—'}</TableCell>
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

            <TabsContent value="import" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Importar Turma</CardTitle>
                  <CardDescription>Cole os e-mails dos alunos (um por linha, separados por vírgula ou ponto e vírgula)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
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
