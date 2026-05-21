import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import { AppLayout } from '@/components/AppLayout';
import { useCSAccess } from '@/hooks/useCSAccess';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload, FileText, AlertTriangle, CheckCircle2, Download, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

interface RawRow { [k: string]: string }
interface NormRow {
  rowIndex: number;
  company_name: string;
  company_segment?: string;
  company_status?: string;
  company_start_date?: string;
  company_notes?: string;
  owner_email?: string;
  contact_name?: string;
  contact_email?: string;
  contact_role?: string;
  contact_phone?: string;
  contact_influence?: string;
}

const REQUIRED = ['company_name'];
const KNOWN = ['company_name','company_segment','company_status','company_start_date','company_notes','owner_email','contact_name','contact_email','contact_role','contact_phone','contact_influence'];

// Header aliases (PT-BR → canonical)
const ALIASES: Record<string, string> = {
  // company
  'empresa': 'company_name', 'nome_empresa': 'company_name', 'nome da empresa': 'company_name', 'razão social': 'company_name', 'razao social': 'company_name',
  'segmento': 'company_segment', 'setor': 'company_segment',
  'status': 'company_status',
  'data_inicio': 'company_start_date', 'data de início': 'company_start_date', 'inicio': 'company_start_date',
  'observações': 'company_notes', 'observacoes': 'company_notes', 'notas': 'company_notes', 'notes': 'company_notes',
  // owner
  'responsável': 'owner_email', 'responsavel': 'owner_email', 'responsavel_email': 'owner_email', 'cs_owner': 'owner_email', 'owner': 'owner_email', 'email_responsavel': 'owner_email',
  // contact
  'contato': 'contact_name', 'nome_contato': 'contact_name', 'nome do contato': 'contact_name',
  'email_contato': 'contact_email', 'email contato': 'contact_email', 'e-mail': 'contact_email', 'email': 'contact_email',
  'cargo': 'contact_role', 'função': 'contact_role', 'funcao': 'contact_role',
  'telefone': 'contact_phone', 'celular': 'contact_phone', 'phone': 'contact_phone',
  'influência': 'contact_influence', 'influencia': 'contact_influence',
};

function normalizeHeader(h: string): string {
  const k = h.trim().toLowerCase();
  if (KNOWN.includes(k)) return k;
  return ALIASES[k] ?? k;
}

const BATCH_SIZE = 500;

export default function AdminCSImport() {
  const navigate = useNavigate();
  const { loading: accessLoading, canManage } = useCSAccess();
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<NormRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [missingCols, setMissingCols] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<null | {
    companiesCreated: number; companiesReused: number;
    contactsCreated: number; contactsSkipped: number;
    ownersNotFound: string[]; errors: { row: number; message: string }[];
  }>(null);

  if (!accessLoading && !canManage) {
    return (
      <AppLayout>
        <div className="p-6">
          <Alert variant="destructive">
            <AlertTitle>Acesso negado</AlertTitle>
            <AlertDescription>Apenas administradores de CS podem importar dados em massa.</AlertDescription>
          </Alert>
        </div>
      </AppLayout>
    );
  }

  const handleFile = (file: File) => {
    setFileName(file.name);
    setResult(null);
    Papa.parse<RawRow>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: normalizeHeader,
      complete: (res) => {
        const headers = res.meta.fields ?? [];
        const missing = REQUIRED.filter((c) => !headers.includes(c));
        setMissingCols(missing);
        const normRows: NormRow[] = (res.data ?? []).map((r, i) => ({
          rowIndex: i + 2, // header is line 1
          company_name: (r.company_name ?? '').trim(),
          company_segment: r.company_segment?.trim(),
          company_status: r.company_status?.trim(),
          company_start_date: r.company_start_date?.trim(),
          company_notes: r.company_notes?.trim(),
          owner_email: r.owner_email?.trim().toLowerCase(),
          contact_name: r.contact_name?.trim(),
          contact_email: r.contact_email?.trim().toLowerCase(),
          contact_role: r.contact_role?.trim(),
          contact_phone: r.contact_phone?.trim(),
          contact_influence: r.contact_influence?.trim().toLowerCase(),
        })).filter((r) => r.company_name);
        setRows(normRows);
        toast.success(`${normRows.length} linhas válidas carregadas`);
      },
      error: (err) => toast.error(`Erro lendo CSV: ${err.message}`),
    });
  };

  const stats = (() => {
    const companies = new Set(rows.map((r) => r.company_name.toLowerCase()));
    const contacts = rows.filter((r) => r.contact_name).length;
    const owners = new Set(rows.map((r) => r.owner_email).filter(Boolean));
    return { companies: companies.size, contacts, owners: owners.size };
  })();

  const runImport = async (dryRun: boolean) => {
    if (rows.length === 0) return toast.error('Carregue um CSV primeiro');
    if (missingCols.length > 0) return toast.error(`Faltam colunas: ${missingCols.join(', ')}`);
    setImporting(true);
    setProgress(0);
    setResult(null);

    const acc = {
      companiesCreated: 0, companiesReused: 0,
      contactsCreated: 0, contactsSkipped: 0,
      ownersNotFound: new Set<string>(),
      errors: [] as { row: number; message: string }[],
    };

    try {
      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const chunk = rows.slice(i, i + BATCH_SIZE);
        const { data, error } = await supabase.functions.invoke('cs-import-companies', {
          body: { rows: chunk, dryRun },
        });
        if (error) throw error;
        const r = data as typeof result;
        if (r) {
          acc.companiesCreated += r.companiesCreated;
          acc.companiesReused += r.companiesReused;
          acc.contactsCreated += r.contactsCreated;
          acc.contactsSkipped += r.contactsSkipped;
          for (const o of r.ownersNotFound) acc.ownersNotFound.add(o);
          for (const e of r.errors) acc.errors.push(e);
        }
        setProgress(Math.round(((i + chunk.length) / rows.length) * 100));
      }
      setResult({ ...acc, ownersNotFound: Array.from(acc.ownersNotFound) });
      toast.success(dryRun ? 'Simulação concluída' : 'Importação concluída');
    } catch (e: any) {
      toast.error(e.message || 'Erro na importação');
    } finally {
      setImporting(false);
    }
  };

  const downloadReport = () => {
    if (!result) return;
    const lines = [
      ['tipo', 'detalhe'],
      ...result.errors.map((e) => ['erro', `linha ${e.row}: ${e.message}`]),
      ...result.ownersNotFound.map((o) => ['owner_nao_encontrado', o]),
    ];
    const csv = lines.map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cs-import-report-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadTemplate = () => {
    const csv = KNOWN.join(',') + '\n' +
      'Acme Indústria,Indústria,onboarding,2024-01-15,Cliente piloto,maria@empresa.com,João Silva,joao@acme.com,Diretor,11999990000,decisor';
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cs-import-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppLayout>
      <div className="container max-w-5xl py-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/cs')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Importar empresas e contatos</h1>
            <p className="text-sm text-muted-foreground">Upload em massa via CSV — com deduplicação automática.</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" /> Formato do arquivo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>Uma linha por contato (a empresa pode repetir). Colunas reconhecidas:</p>
            <code className="block bg-muted p-3 rounded text-xs overflow-x-auto">
              {KNOWN.join(', ')}
            </code>
            <p className="text-muted-foreground text-xs">
              Aceita também cabeçalhos em português: empresa, segmento, responsável, contato, email, cargo, telefone, etc.
            </p>
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="w-4 h-4 mr-2" /> Baixar template
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>1. Carregar CSV</CardTitle></CardHeader>
          <CardContent>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            <Button onClick={() => fileRef.current?.click()} disabled={importing}>
              <Upload className="w-4 h-4 mr-2" /> Selecionar arquivo CSV
            </Button>
            {fileName && (
              <p className="text-sm text-muted-foreground mt-2">
                Arquivo: <strong>{fileName}</strong> · {rows.length} linhas
              </p>
            )}
          </CardContent>
        </Card>

        {rows.length > 0 && (
          <>
            {missingCols.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="w-4 h-4" />
                <AlertTitle>Colunas obrigatórias faltando</AlertTitle>
                <AlertDescription>{missingCols.join(', ')}</AlertDescription>
              </Alert>
            )}

            <Card>
              <CardHeader><CardTitle>2. Resumo</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-3 gap-4 text-center">
                <div><div className="text-3xl font-bold">{stats.companies}</div><div className="text-xs text-muted-foreground">empresas únicas</div></div>
                <div><div className="text-3xl font-bold">{stats.contacts}</div><div className="text-xs text-muted-foreground">contatos</div></div>
                <div><div className="text-3xl font-bold">{stats.owners}</div><div className="text-xs text-muted-foreground">owners distintos</div></div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>3. Pré-visualização (primeiras 10 linhas)</CardTitle></CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>Email contato</TableHead>
                      <TableHead>Owner</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.slice(0, 10).map((r) => (
                      <TableRow key={r.rowIndex}>
                        <TableCell>{r.company_name}</TableCell>
                        <TableCell>{r.contact_name || '—'}</TableCell>
                        <TableCell className="text-xs">{r.contact_email || '—'}</TableCell>
                        <TableCell className="text-xs">{r.owner_email || '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>4. Executar</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => runImport(true)} disabled={importing || missingCols.length > 0}>
                    Simular (dry-run)
                  </Button>
                  <Button onClick={() => runImport(false)} disabled={importing || missingCols.length > 0}>
                    Importar de verdade
                  </Button>
                </div>
                {importing && (
                  <div className="space-y-1">
                    <Progress value={progress} />
                    <p className="text-xs text-muted-foreground">{progress}%</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" /> Resultado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div><div className="text-2xl font-bold text-green-500">{result.companiesCreated}</div><div className="text-xs text-muted-foreground">empresas criadas</div></div>
                <div><div className="text-2xl font-bold">{result.companiesReused}</div><div className="text-xs text-muted-foreground">empresas já existentes</div></div>
                <div><div className="text-2xl font-bold text-green-500">{result.contactsCreated}</div><div className="text-xs text-muted-foreground">contatos criados</div></div>
                <div><div className="text-2xl font-bold text-muted-foreground">{result.contactsSkipped}</div><div className="text-xs text-muted-foreground">contatos duplicados</div></div>
              </div>

              {result.ownersNotFound.length > 0 && (
                <Alert>
                  <AlertTriangle className="w-4 h-4" />
                  <AlertTitle>{result.ownersNotFound.length} owners não encontrados</AlertTitle>
                  <AlertDescription className="text-xs break-all">{result.ownersNotFound.join(', ')}</AlertDescription>
                </Alert>
              )}

              {result.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="w-4 h-4" />
                  <AlertTitle>{result.errors.length} erros</AlertTitle>
                  <AlertDescription className="text-xs max-h-40 overflow-auto">
                    {result.errors.slice(0, 20).map((e, i) => (
                      <div key={i}>linha {e.row}: {e.message}</div>
                    ))}
                    {result.errors.length > 20 && <div>… +{result.errors.length - 20} mais (ver relatório)</div>}
                  </AlertDescription>
                </Alert>
              )}

              {(result.errors.length > 0 || result.ownersNotFound.length > 0) && (
                <Button variant="outline" onClick={downloadReport}>
                  <Download className="w-4 h-4 mr-2" /> Baixar relatório CSV
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
