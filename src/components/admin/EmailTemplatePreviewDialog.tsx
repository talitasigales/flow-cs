import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

type TemplateKey = 'welcome' | '24h' | '1h';

interface PreviewData {
  subject?: string;
  html?: string;
  recipients_count?: number;
  sample_recipients?: { email: string; name?: string | null }[];
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

  const current = classId ? cache[`${classId}:${tab}`] : undefined;

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
                  {!!current.sample_recipients?.length && (
                    <p className="text-xs text-muted-foreground">
                      Ex.: {current.sample_recipients.map((r) => r.email).join(', ')}
                    </p>
                  )}
                  <div className="pt-1">
                    <Button variant="outline" size="sm" onClick={() => load(tab, true)}>
                      <RefreshCw className="w-3 h-3 mr-1" /> Atualizar
                    </Button>
                  </div>
                </div>

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
