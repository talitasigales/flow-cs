import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Copy, Link2, Mail, Ban, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface PDIShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pdiId: string;
  employeeName: string;
}

interface ShareRow {
  id: string;
  token: string;
  is_active: boolean;
  hide_notes: boolean;
  expires_at: string | null;
  view_count: number;
  last_viewed_at: string | null;
}

function generateToken() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export default function PDIShareDialog({ open, onOpenChange, pdiId, employeeName }: PDIShareDialogProps) {
  const [share, setShare] = useState<ShareRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [expiresAt, setExpiresAt] = useState('');

  const shareUrl = share ? `${window.location.origin}/pdi/compartilhado/${share.token}` : '';

  useEffect(() => {
    if (!open) return;
    void loadShare();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, pdiId]);

  const loadShare = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('pdi_shares')
      .select('*')
      .eq('pdi_id', pdiId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('[PDIShare] load error:', error);
      toast.error('Erro ao carregar o link de compartilhamento');
    } else if (data) {
      setShare(data as ShareRow);
      setExpiresAt(data.expires_at ? String(data.expires_at).slice(0, 10) : '');
    } else {
      setShare(null);
      setExpiresAt('');
    }
    setLoading(false);
  };

  const createShare = async () => {
    const { data: userRes } = await supabase.auth.getUser();
    const userId = userRes.user?.id;
    if (!userId) return;

    setSaving(true);
    const { data, error } = await supabase
      .from('pdi_shares')
      .insert({ pdi_id: pdiId, token: generateToken(), created_by: userId })
      .select()
      .single();
    setSaving(false);

    if (error) {
      console.error('[PDIShare] create error:', error);
      toast.error(`Erro ao gerar link: ${error.message}`);
      return;
    }
    setShare(data as ShareRow);
    toast.success('Link gerado com sucesso');
  };

  const updateShare = async (patch: Partial<ShareRow>) => {
    if (!share) return;
    setSaving(true);
    const { data, error } = await supabase
      .from('pdi_shares')
      .update(patch)
      .eq('id', share.id)
      .select()
      .single();
    setSaving(false);

    if (error) {
      console.error('[PDIShare] update error:', error);
      toast.error(`Erro ao atualizar: ${error.message}`);
      return;
    }
    setShare(data as ShareRow);
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    toast.success('Link copiado');
  };

  const sendEmail = async () => {
    if (!share) return;
    setSending(true);
    const { data, error } = await supabase.functions.invoke('pdi-share', {
      body: { action: 'send_email', share_id: share.id, email, link: shareUrl },
    });
    setSending(false);

    if (error || (data as any)?.error) {
      console.error('[PDIShare] email error:', error, data);
      toast.error('Não foi possível enviar o e-mail');
      return;
    }
    toast.success(`Link enviado para ${email}`);
    setEmail('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Compartilhar PDI com {employeeName}</DialogTitle>
          <DialogDescription>
            Gere um link seguro para que a pessoa acompanhe o próprio plano, sem precisar de conta na plataforma.
            O acesso é somente leitura.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !share ? (
          <Button onClick={createShare} disabled={saving}>
            <Link2 className="h-4 w-4 mr-2" />
            Gerar link de acompanhamento
          </Button>
        ) : (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label>Link</Label>
              <div className="flex gap-2">
                <Input readOnly value={shareUrl} className="text-xs" />
                <Button variant="outline" size="icon" onClick={copyLink}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant={share.is_active ? 'default' : 'destructive'}>
                  {share.is_active ? 'Ativo' : 'Revogado'}
                </Badge>
                <span>{share.view_count} visualizaç{share.view_count === 1 ? 'ão' : 'ões'}</span>
                {share.last_viewed_at && (
                  <span>· último acesso em {new Date(share.last_viewed_at).toLocaleDateString('pt-BR')}</span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="pr-4">
                <p className="text-sm font-medium">Ocultar minhas anotações privadas</p>
                <p className="text-xs text-muted-foreground">
                  As notas gerais e as notas dos check-ins não aparecem no link.
                </p>
              </div>
              <Switch
                checked={share.hide_notes}
                onCheckedChange={(v) => updateShare({ hide_notes: v })}
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pdi-share-expires">Validade (opcional)</Label>
              <div className="flex gap-2">
                <Input
                  id="pdi-share-expires"
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
                <Button
                  variant="outline"
                  onClick={() => updateShare({ expires_at: expiresAt ? new Date(`${expiresAt}T23:59:59`).toISOString() : null })}
                  disabled={saving}
                >
                  Salvar
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pdi-share-email">Enviar por e-mail</Label>
              <div className="flex gap-2">
                <Input
                  id="pdi-share-email"
                  type="email"
                  placeholder="email@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Button onClick={sendEmail} disabled={sending || !email || !share.is_active}>
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <Button
              variant={share.is_active ? 'destructive' : 'outline'}
              className="w-full"
              onClick={() => updateShare({ is_active: !share.is_active })}
              disabled={saving}
            >
              <Ban className="h-4 w-4 mr-2" />
              {share.is_active ? 'Revogar link' : 'Reativar link'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
