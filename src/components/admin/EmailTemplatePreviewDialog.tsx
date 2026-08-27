import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, RefreshCw, AlertTriangle, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

type TemplateKey = 'welcome' | '24h' | '1h';

interface Recipient {
  email: string;
  name?: string | null;
}

interface PreviewData {
  subject?: string;
  html?: string;
  recipients_count?: number;
  sample_recipients?: Recipient[];
  recipients?: Recipient[];
  session?: { date?: string; start_time?: string | null; end_time?: string | null };
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  programId: string | null;
  classId: string | null;
  className?: string | null;
}

export function EmailTemplatePreviewDialog({ open, onOpenChange, programId, classId, className }: Props) {
  const [tab, setTab] = useState<TemplateKey>('welcome');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cache, setCache] = useState<Record<string, PreviewData>>({});
  const [selected, setSelected] = useState<string[]>([]);
  const [sending, setSending] = useState(false);

  const load = async (key: TemplateKey, force = false) => {
    if (!programId || !classId) return;
    const cacheKey = `${classId}:${key}`;
    if (!force && cache[cacheKey]) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } =
        key === 'welcome'
          ? await supabase.functions.invoke('send-enrollment-welcome', {
              body: { program_id: programId, class_id: classId, preview: true },
            })
          : await supabase.functions.invoke('send-class-email-reminder', {
              body: { class_id: classId, reminder_type: key, preview: true },
            });
      if (fnError) throw fnError;
      if ((data as any)?.error) throw new Error((data as any).error);
      setCache((prev) => ({ ...prev, [cacheKey]: data as PreviewData }));
    } catch (err: any) {
      setError(err.message || 'Não foi possível carregar a pré-visualização');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) load(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tab, classId]);

  useEffect(() => {
    setSelected([]);
  }, [tab, classId, open]);

  const current = classId ? cache[`${classId}:${tab}`] : undefined;
  const recipients: Recipient[] = current?.recipients ?? current?.sample_recipients ?? [];

  const toggle = (email: string) =>
    setSelected((prev) => (prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]));

  const sendTo = async (emails: string[]) => {
    if (!programId || !classId || !emails.length) return;
    setSending(true);
    try {
      const { data, error: fnError } =
        tab === 'welcome'
          ? await supabase.functions.invoke('send-enrollment-welcome', {
              body: { program_id: programId, class_id: classId, emails },
            })
          : await supabase.functions.invoke('send-class-email-reminder', {
              body: { class_id: classId, reminder_type: tab, emails },
            });
      if (fnError) throw fnError;
      if ((data as any)?.error) throw new Error((data as any).error);
      const sent = (data as any)?.sent ?? emails.length;
      toast({ title: 'Envio concluído', description: `${sent} e-mail(s) enviado(s) com sucesso.` });
      setSelected([]);
    } catch (err: any) {
      toast({ title: 'Falha no envio', description: err.message || 'Tente novamente.', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Pré-visualizar e-mails da turma</DialogTitle>
          <DialogDescription>
            {className ? `Turma: ${className}. ` : ''}
            Confira o conteúdo exato que será enviado — nenhum e-mail é disparado aqui.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as TemplateKey)} className="flex-1 min-h-0 flex flex-col">
          <TabsList className="self-start">
            <TabsTrigger value="welcome">Boas-vindas</TabsTrigger>
            <TabsTrigger value="24h">Lembrete 24h</TabsTrigger>
            <TabsTrigger value="1h">Lembrete 1h</TabsTrigger>
          </TabsList>

          <TabsContent value={tab} className="flex-1 min-h-0 mt-4 space-y-3 overflow-y-auto">
            {loading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-10 justify-center">
                <Loader2 className="w-4 h-4 animate-spin" /> Carregando template...
              </div>
            )}

            {!loading && error && (
              <div className="flex items-start gap-2 text-sm text-destructive border border-destructive/30 rounded-md p-3">
                <AlertTriangle className="w-4 h-4 mt-0.5" />
                <div className="flex-1">
                  <p>{error}</p>
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => load(tab, true)}>
                    <RefreshCw className="w-3 h-3 mr-1" /> Tentar novamente
                  </Button>
                </div>
              </div>
            )}

            {!loading && !error && current && (
              <>
                <div className="rounded-md border p-3 space-y-2 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-muted-foreground">Assunto:</span>
                    <span className="font-medium">{current.subject}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-muted-foreground">Destinatários:</span>
                    <Badge variant="secondary">{current.recipients_count ?? 0} aluno(s)</Badge>
                    {current.session?.date && (
                      <Badge variant="outline">
                        Encontro: {current.session.date}
                        {current.session.start_time ? ` às ${String(current.session.start_time).slice(0, 5)}` : ''}
                      </Badge>
                    )}
                  </div>
                  <div className="pt-1 flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => load(tab, true)}>
                      <RefreshCw className="w-3 h-3 mr-1" /> Atualizar
                    </Button>
                    <Button
                      size="sm"
                      disabled={sending || !selected.length}
                      onClick={() => sendTo(selected)}
                    >
                      {sending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Send className="w-3 h-3 mr-1" />}
                      Enviar aos selecionados ({selected.length})
                    </Button>
                  </div>
                </div>

                {!!recipients.length && (
                  <div className="rounded-md border">
                    <div className="flex items-center justify-between gap-2 border-b px-3 py-2 text-sm">
                      <span className="font-medium">Alunos da turma</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setSelected(selected.length === recipients.length ? [] : recipients.map((r) => r.email))
                        }
                      >
                        {selected.length === recipients.length ? 'Limpar seleção' : 'Selecionar todos'}
                      </Button>
                    </div>
                    <div className="max-h-56 overflow-y-auto divide-y">
                      {recipients.map((r) => (
                        <div key={r.email} className="flex items-center gap-3 px-3 py-2 text-sm">
                          <Checkbox
                            checked={selected.includes(r.email)}
                            onCheckedChange={() => toggle(r.email)}
                            aria-label={`Selecionar ${r.email}`}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">{r.name || r.email}</p>
                            {r.name && <p className="truncate text-xs text-muted-foreground">{r.email}</p>}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={sending}
                            onClick={() => sendTo([r.email])}
                          >
                            <Send className="w-3 h-3 mr-1" /> Enviar
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <iframe
                  title="Pré-visualização do e-mail"
                  srcDoc={current.html || ''}
                  className="w-full h-[55vh] rounded-md border bg-white"
                  sandbox=""
                />
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

export default EmailTemplatePreviewDialog;
