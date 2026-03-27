import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Award, Upload, Check } from 'lucide-react';
import { generateCertificateCode } from '@/utils/certificateUtils';

interface Props {
  programId: string;
  classes: any[];
}

export function CertificateManager({ programId, classes }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedClassId, setSelectedClassId] = useState('all');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [courseHours, setCourseHours] = useState('');
  const [courseDates, setCourseDates] = useState('');
  const [directorName, setDirectorName] = useState('');
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [signatureUrl, setSignatureUrl] = useState('');
  const [saving, setSaving] = useState(false);

  // Auto-populate specialist name when class changes
  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId);
    if (classId !== 'all') {
      const cls = classes.find((c: any) => c.id === classId);
      if (cls?.specialist && !directorName) {
        setDirectorName(cls.specialist);
      }
    }
  };

  // Fetch enrollments for this program
  const { data: enrollments = [] } = useQuery({
    queryKey: ['cert-enrollments', programId, selectedClassId],
    queryFn: async () => {
      let query = supabase
        .from('program_enrollments')
        .select('id, user_id, class_id')
        .eq('program_id', programId);
      if (selectedClassId && selectedClassId !== 'all') {
        query = query.eq('class_id', selectedClassId);
      }
      const { data: enrs } = await query;
      if (!enrs || enrs.length === 0) return [];
      const userIds = [...new Set(enrs.map(e => e.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', userIds);
      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
      return enrs.map(e => ({ ...e, profile: profileMap.get(e.user_id) }));
    },
  });

  // Fetch existing certificates
  const { data: certificates = [], refetch: refetchCerts } = useQuery({
    queryKey: ['cert-list', programId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('certificates')
        .select('*')
        .eq('program_id', programId);
      return data || [];
    },
  });

  const getCertForEnrollment = (enrollmentId: string) =>
    certificates.find((c: any) => c.enrollment_id === enrollmentId);

  const handleUploadSignature = async () => {
    if (!signatureFile) return;
    const ext = signatureFile.name.split('.').pop();
    const path = `signatures/director-${Date.now()}.${ext}`;
    const { data, error } = await supabase.storage
      .from('program-materials')
      .upload(path, signatureFile, { upsert: true });
    if (error) {
      toast.error('Erro ao enviar assinatura');
      return;
    }
    const { data: urlData } = supabase.storage.from('program-materials').getPublicUrl(path);
    setSignatureUrl(urlData.publicUrl);
    toast.success('Assinatura enviada');
  };

  const handleEnableCertificates = async () => {
    if (selectedStudents.length === 0) {
      toast.error('Selecione ao menos um aluno');
      return;
    }
    if (!courseHours || !courseDates || !directorName) {
      toast.error('Preencha carga horária, datas e nome da diretora');
      return;
    }
    setSaving(true);
    try {
      const records = selectedStudents.map(enrollmentId => {
        const enr = enrollments.find((e: any) => e.id === enrollmentId);
        return {
          enrollment_id: enrollmentId,
          user_id: enr?.user_id,
          program_id: programId,
          class_id: enr?.class_id || null,
          certificate_code: generateCertificateCode(),
          course_hours: parseInt(courseHours),
          course_dates: courseDates,
          director_name: directorName,
          director_signature_url: signatureUrl || null,
          enabled_by: user!.id,
        };
      });

      const { error } = await (supabase as any)
        .from('certificates')
        .insert(records);

      if (error) throw error;
      toast.success(`Certificado habilitado para ${selectedStudents.length} aluno(s)`);
      setSelectedStudents([]);
      refetchCerts();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao habilitar certificados');
    } finally {
      setSaving(false);
    }
  };

  const toggleStudent = (enrollmentId: string) => {
    setSelectedStudents(prev =>
      prev.includes(enrollmentId)
        ? prev.filter(id => id !== enrollmentId)
        : [...prev, enrollmentId]
    );
  };

  const eligibleEnrollments = enrollments.filter(
    (e: any) => !getCertForEnrollment(e.id)
  );

  const selectAll = () => {
    if (selectedStudents.length === eligibleEnrollments.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(eligibleEnrollments.map((e: any) => e.id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            Configurar Certificados
          </CardTitle>
          <CardDescription>Defina os dados que aparecerão no certificado</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Carga Horária (horas)</Label>
              <Input
                type="number"
                value={courseHours}
                onChange={e => setCourseHours(e.target.value)}
                placeholder="Ex: 40"
              />
            </div>
            <div className="space-y-2">
              <Label>Datas do Curso</Label>
              <Input
                value={courseDates}
                onChange={e => setCourseDates(e.target.value)}
                placeholder="Ex: 10/03/2026 a 14/03/2026"
              />
            </div>
            <div className="space-y-2">
              <Label>Nome do(a) Especialista</Label>
              <Input
                value={directorName}
                onChange={e => setDirectorName(e.target.value)}
                placeholder="Ex: Léo Manero"
              />
            </div>
            <div className="space-y-2">
              <Label>Assinatura (imagem)</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={e => setSignatureFile(e.target.files?.[0] || null)}
                  className="flex-1"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleUploadSignature}
                  disabled={!signatureFile}
                >
                  <Upload className="w-4 h-4" />
                </Button>
              </div>
              {signatureUrl && (
                <div className="flex items-center gap-2 mt-1">
                  <img src={signatureUrl} alt="Assinatura" className="h-10 object-contain border rounded" />
                  <span className="text-xs text-muted-foreground">Assinatura carregada</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student selection */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Alunos Matriculados</CardTitle>
            <CardDescription>Selecione os alunos que concluíram o programa</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedClassId} onValueChange={setSelectedClassId}>
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
          </div>
        </CardHeader>
        <CardContent>
          {enrollments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhum aluno matriculado.</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={selectedStudents.length === eligibleEnrollments.length && eligibleEnrollments.length > 0}
                        onCheckedChange={selectAll}
                      />
                    </TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrollments.map((enr: any) => {
                    const cert = getCertForEnrollment(enr.id);
                    const hasCert = !!cert;
                    return (
                      <TableRow key={enr.id}>
                        <TableCell>
                          {hasCert ? (
                            <Check className="w-4 h-4 text-primary" />
                          ) : (
                            <Checkbox
                              checked={selectedStudents.includes(enr.id)}
                              onCheckedChange={() => toggleStudent(enr.id)}
                            />
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{enr.profile?.full_name || '—'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{enr.profile?.email || '—'}</TableCell>
                        <TableCell>
                          {hasCert ? (
                            <div className="flex items-center gap-2">
                              <Badge className="bg-primary/10 text-primary border-0">
                                Habilitado
                              </Badge>
                              {cert.generated_at && (
                                <Badge variant="outline" className="text-[10px]">Gerado</Badge>
                              )}
                              <span className="text-[10px] text-muted-foreground">{cert.certificate_code}</span>
                            </div>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">Pendente</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {eligibleEnrollments.length > 0 && (
                <div className="flex justify-end mt-4">
                  <Button
                    onClick={handleEnableCertificates}
                    disabled={saving || selectedStudents.length === 0 || !courseHours || !courseDates || !directorName}
                    className="gap-2"
                  >
                    <Award className="w-4 h-4" />
                    {saving ? 'Habilitando...' : `Habilitar Certificado (${selectedStudents.length})`}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
