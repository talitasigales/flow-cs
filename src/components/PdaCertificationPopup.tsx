import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Clock, Sparkles, CheckCircle2 } from 'lucide-react';

const STORAGE_KEY = 'pda_cert_popup_dismissed_v1';

export function PdaCertificationPopup() {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '' });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) {
      const t = setTimeout(() => setOpen(true), 1200);
      return () => clearTimeout(t);
    }
  }, []);

  const handleClose = (o: boolean) => {
    setOpen(o);
    if (!o) localStorage.setItem(STORAGE_KEY, new Date().toISOString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone || !form.company) {
      toast.error('Preencha todos os campos');
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke('send-pda-certification-lead', { body: form });
      if (error) throw error;
      setSent(true);
      toast.success('Recebemos seu interesse! Em breve entraremos em contato.');
      setTimeout(() => handleClose(false), 2500);
    } catch (err: any) {
      toast.error('Não foi possível enviar. Tente novamente.', { description: err?.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <div className="bg-gradient-to-br from-primary/20 via-primary/5 to-background p-6 border-b border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">Novas turmas abertas</Badge>
          </div>
          <DialogHeader>
            <DialogTitle className="text-2xl">Certificação Analista Comportamental PDA Assessment</DialogTitle>
            <DialogDescription className="text-base">
              Torne-se um analista certificado e use o PDA para impulsionar pessoas e times.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
          <div className="grid gap-3">
            <div className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-card/50">
              <Calendar className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-sm mb-1">Próximas turmas</p>
                <ul className="text-sm text-muted-foreground space-y-0.5">
                  <li>• 24, 25 e 26 de junho</li>
                  <li>• 15, 16 e 17 de julho</li>
                  <li>• 22, 23 e 24 de julho</li>
                </ul>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /><span>9h de duração · 3 encontros · online ao vivo</span></div>
            </div>
            <div className="flex flex-wrap items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
              <span className="text-sm text-muted-foreground">Investimento:</span>
              <span className="text-2xl font-bold text-primary">R$ 1.758</span>
              <span className="text-xs text-muted-foreground ml-auto">*consulte informações para turmas in company</span>
            </div>
          </div>

          {sent ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-500 mb-3" />
              <p className="font-semibold">Interesse registrado!</p>
              <p className="text-sm text-muted-foreground">Nossa equipe entrará em contato em breve.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <p className="text-sm font-medium">Tenho interesse — quero ser contatado:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="pda-name">Nome</Label>
                  <Input id="pda-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={200} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pda-email">E-mail</Label>
                  <Input id="pda-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required maxLength={200} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pda-phone">Telefone</Label>
                  <Input id="pda-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required maxLength={50} placeholder="(11) 90000-0000" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pda-company">Empresa</Label>
                  <Input id="pda-company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} required maxLength={200} />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => handleClose(false)}>Agora não</Button>
                <Button type="submit" disabled={submitting}>{submitting ? 'Enviando...' : 'Quero saber mais'}</Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
