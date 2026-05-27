import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Award, Upload, Check, Download, Mail, Loader2 } from 'lucide-react';
import { generateCertificateCode, generateCertificatePdf, generateCertificatePdfBlob } from '@/utils/certificateUtils';

interface Props {
  programId: string;
  classes: any[];
}

export function CertificateManager({ programId, classes }: Props) {
  const { user } = useAuth();
  const [selectedClassId, setSelectedClassId] = useState('all');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectedForEmail, setSelectedForEmail] = useState<string[]>([]);
  const [courseHours, setCourseHours] = useState('');
  const [courseDates, setCourseDates] = useState('');
  const [directorName, setDirectorName] = useState('');
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [signatureUrl, setSignatureUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState<string | null>(null);

  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId);
    if (classId !== 'all') {
      const cls = classes.find((c: any) => c.id === classId);
      if (cls?.specialist && !directorName) {
        setDirectorName(cls.specialist);
      }
    }
  };

  // Fetch program name
  const { data: program } = useQuery({
    queryKey: ['cert-program', programId],
    queryFn: async () => {
      const { data } = await supabase.from('programs').select('name').eq('id', programId).single();
      return data;
    },
  });

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
      return enrs || [];
    },
  });

  const { data: certificates = [], refetch: refetchCerts } = useQuery({
    queryKey: ['cert-list', programId, selectedClassId],
    queryFn: async () => {
      let query = (supabase as any)
        .from('certificates')
        .select('*')
        .eq('program_id', programId);
      if (selectedClassId && selectedClassId !== 'all') {
        query = query.eq('class_id', selectedClassId);
      }
      const { data } = await query;
      return data || [];
    },
  });

  // Fetch profiles for any user_id appearing in enrollments OR certificates
  const profileUserIds = [
    ...new Set<string>([
      ...enrollments.map((e: any) => e.user_id),
      ...certificates.map((c: any) => c.user_id).filter(Boolean),
    ]),
  ];

  const { data: profilesMap = new Map() } = useQuery({
    queryKey: ['cert-profiles', profileUserIds.sort().join(',')],
    enabled: profileUserIds.length > 0,
    queryFn: async () => {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', profileUserIds);
      return new Map((profiles || []).map((p: any) => [p.user_id, p]));
    },
  });

  // Build unified rows: enrollments + certificates without matching enrollment
  const rows = (() => {
    const enrolledIds = new Set(enrollments.map((e: any) => e.id));
    const enrollmentRows = enrollments.map((e: any) => ({
      key: `enr-${e.id}`,
      enrollmentId: e.id,
      userId: e.user_id,
      classId: e.class_id,
      profile: (profilesMap as Map<string, any>).get(e.user_id),
      cert: certificates.find((c: any) => c.enrollment_id === e.id),
    }));
    const orphanCertRows = certificates
      .filter((c: any) => !c.enrollment_id || !enrolledIds.has(c.enrollment_id))
      .map((c: any) => ({
        key: `cert-${c.id}`,
        enrollmentId: c.enrollment_id || null,
        userId: c.user_id,
        classId: c.class_id,
        profile: (profilesMap as Map<string, any>).get(c.user_id),
        cert: c,
      }));
    return [...enrollmentRows, ...orphanCertRows];
  })();

  const getCertForEnrollment = (enrollmentId: string) =>
    certificates.find((c: any) => c.enrollment_id === enrollmentId);


  const handleUploadSignature = async () => {
    if (!signatureFile) return;
    const ext = signatureFile.name.split('.').pop();
    const path = `signatures/director-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
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
      toast.error('Preencha carga horária, datas e nome do(a) especialista');
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

      const { error } = await (supabase as any).from('certificates').insert(records);
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

  const buildCertData = (cert: any, studentName: string) => {
    const cls = cert.class_id ? classes.find((c: any) => c.id === cert.class_id) : null;
    const fmtDate = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR');
    const classDatesStr = cls?.start_date && cls?.end_date
      ? `${fmtDate(cls.start_date)} a ${fmtDate(cls.end_date)}`
      : cert.course_dates;

    return {
      studentName,
      programName: program?.name || 'Programa',
      courseHours: cert.course_hours,
      courseDates: cert.course_dates,
      certificateCode: cert.certificate_code,
      directorName: cert.director_name,
      directorSignatureUrl: cert.director_signature_url,
      emissionDate: new Date().toLocaleDateString('pt-BR'),
      classDates: classDatesStr,
    };
  };

  const handleDownloadPdf = async (cert: any, studentName: string) => {
    setGeneratingPdf(cert.id);
    try {
      await generateCertificatePdf(buildCertData(cert, studentName));
      // Mark as generated
      await (supabase as any).from('certificates').update({ generated_at: new Date().toISOString() }).eq('id', cert.id);
      refetchCerts();
      toast.success('Certificado gerado com sucesso');
    } catch (e: any) {
      toast.error('Erro ao gerar certificado: ' + e.message);
    } finally {
      setGeneratingPdf(null);
    }
  };

  const handleSendEmails = async () => {
    if (selectedForEmail.length === 0) {
      toast.error('Selecione ao menos um certificado para enviar');
      return;
    }
    setSendingEmail(true);
    try {
      const certPayloads: any[] = [];

      for (const certId of selectedForEmail) {
        const cert = certificates.find((c: any) => c.id === certId);
        if (!cert) continue;
        const profile = (profilesMap as Map<string, any>).get(cert.user_id);
        const studentName = profile?.full_name || 'Aluno';
        const studentEmail = profile?.email;
        if (!studentEmail) continue;


        // Generate PDF blob
        const blob = await generateCertificatePdfBlob(buildCertData(cert, studentName));

        // Upload to storage
        const pdfPath = `certificates/${cert.certificate_code}.pdf`;
        await supabase.storage.from('program-materials').upload(pdfPath, blob, {
          upsert: true,
          contentType: 'application/pdf',
        });

        const { data: urlData } = supabase.storage.from('program-materials').getPublicUrl(pdfPath);

        certPayloads.push({
          certificateId: cert.id,
          pdfUrl: urlData.publicUrl,
          studentEmail,
          studentName,
          programName: program?.name || 'Programa',
        });
      }

      if (certPayloads.length === 0) {
        toast.error('Nenhum certificado válido para enviar');
        setSendingEmail(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('send-certificate-email', {
        body: { certificates: certPayloads },
      });

      if (error) throw error;

      const successCount = data?.results?.filter((r: any) => r.success).length || 0;
      const failCount = data?.results?.filter((r: any) => !r.success).length || 0;

      if (successCount > 0) toast.success(`E-mail enviado para ${successCount} aluno(s)`);
      if (failCount > 0) toast.error(`Falha ao enviar para ${failCount} aluno(s)`);

      setSelectedForEmail([]);
      refetchCerts();
    } catch (e: any) {
      toast.error('Erro ao enviar e-mails: ' + e.message);
    } finally {
      setSendingEmail(false);
    }
  };

  const toggleStudent = (enrollmentId: string) => {
    setSelectedStudents(prev =>
      prev.includes(enrollmentId)
        ? prev.filter(id => id !== enrollmentId)
        : [...prev, enrollmentId]
    );
  };

  const toggleEmailCert = (certId: string) => {
    setSelectedForEmail(prev =>
      prev.includes(certId)
        ? prev.filter(id => id !== certId)
        : [...prev, certId]
    );
  };

  const eligibleEnrollments = enrollments.filter(
    (e: any) => !getCertForEnrollment(e.id)
  );

  const allCerts = certificates as any[];

  const selectAll = () => {
    if (selectedStudents.length === eligibleEnrollments.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(eligibleEnrollments.map((e: any) => e.id));
    }
  };

  const selectAllForEmail = () => {
    const allCertIds = allCerts.map((c: any) => c.id);
    if (selectedForEmail.length === allCertIds.length) {
      setSelectedForEmail([]);
    } else {
      setSelectedForEmail(allCertIds);
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
            <Select value={selectedClassId} onValueChange={handleClassChange}>
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
                    <TableHead className="w-10">
                      <Checkbox
                        checked={selectedForEmail.length === enabledCerts.length && enabledCerts.length > 0}
                        onCheckedChange={selectAllForEmail}
                      />
                    </TableHead>
                    <TableHead>Ações</TableHead>
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
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className="bg-primary/10 text-primary border-0">Habilitado</Badge>
                              {cert.generated_at && (
                                <Badge variant="outline" className="text-[10px]">Gerado</Badge>
                              )}
                              {cert.emailed_at && (
                                <Badge variant="outline" className="text-[10px] border-green-500 text-green-600">
                                  <Mail className="w-3 h-3 mr-1" /> Enviado
                                </Badge>
                              )}
                              <span className="text-[10px] text-muted-foreground">{cert.certificate_code}</span>
                            </div>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">Pendente</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {hasCert && (
                            <Checkbox
                              checked={selectedForEmail.includes(cert.id)}
                              onCheckedChange={() => toggleEmailCert(cert.id)}
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          {hasCert && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadPdf(cert, enr.profile?.full_name || 'Aluno')}
                              disabled={generatingPdf === cert.id}
                              title="Baixar certificado PDF"
                            >
                              {generatingPdf === cert.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Download className="w-4 h-4" />
                              )}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              <div className="flex justify-between mt-4 gap-2 flex-wrap">
                {enabledCerts.length > 0 && (
                  <Button
                    onClick={handleSendEmails}
                    disabled={sendingEmail || selectedForEmail.length === 0}
                    variant="outline"
                    className="gap-2"
                  >
                    {sendingEmail ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Mail className="w-4 h-4" />
                    )}
                    {sendingEmail ? 'Enviando...' : `Enviar por E-mail (${selectedForEmail.length})`}
                  </Button>
                )}

                {eligibleEnrollments.length > 0 && (
                  <Button
                    onClick={handleEnableCertificates}
                    disabled={saving || selectedStudents.length === 0 || !courseHours || !courseDates || !directorName}
                    className="gap-2 ml-auto"
                  >
                    <Award className="w-4 h-4" />
                    {saving ? 'Habilitando...' : `Habilitar Certificado (${selectedStudents.length})`}
                  </Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
