import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link2, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Props {
  table: 'program_enrollments' | 'pending_enrollments';
  rowId: string;
  resilienceUrl: string | null | undefined;
  dilemmasUrl: string | null | undefined;
  onSaved?: () => void;
}

export function StudentLinksEditor({ table, rowId, resilienceUrl, dilemmasUrl, onSaved }: Props) {
  const [open, setOpen] = useState(false);
  const [qr, setQr] = useState(resilienceUrl || '');
  const [dg, setDg] = useState(dilemmasUrl || '');
  const [saving, setSaving] = useState(false);

  const hasLinks = !!(resilienceUrl || dilemmasUrl);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await (supabase as any)
      .from(table)
      .update({
        resilience_url: qr.trim() || null,
        dilemmas_url: dg.trim() || null,
      })
      .eq('id', rowId);
    setSaving(false);
    if (error) {
      toast.error('Erro ao salvar links');
      return;
    }
    toast.success('Links atualizados');
    setOpen(false);
    onSaved?.();
  };

  return (
    <Popover open={open} onOpenChange={(v) => { setOpen(v); if (v) { setQr(resilienceUrl || ''); setDg(dilemmasUrl || ''); } }}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs">
          <Link2 className="w-3.5 h-3.5" />
          {hasLinks ? <span className="text-primary">QR/DG</span> : <span className="text-muted-foreground">QR/DG</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[360px] space-y-3" align="end">
        <div className="space-y-1">
          <p className="text-sm font-semibold">Links individuais (QR e DG)</p>
          <p className="text-[11px] text-muted-foreground">Se vazio, usa o link geral da turma.</p>
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Link Resiliência (QR)</Label>
          <Input value={qr} onChange={(e) => setQr(e.target.value)} placeholder="https://..." />
          {resilienceUrl && (
            <a href={resilienceUrl} target="_blank" rel="noreferrer" className="text-[11px] text-primary inline-flex items-center gap-1 hover:underline">
              <ExternalLink className="w-3 h-3" /> Abrir atual
            </a>
          )}
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Link Dilemas de Gestão (DG)</Label>
          <Input value={dg} onChange={(e) => setDg(e.target.value)} placeholder="https://..." />
          {dilemmasUrl && (
            <a href={dilemmasUrl} target="_blank" rel="noreferrer" className="text-[11px] text-primary inline-flex items-center gap-1 hover:underline">
              <ExternalLink className="w-3 h-3" /> Abrir atual
            </a>
          )}
        </div>
        <Button size="sm" className="w-full" onClick={handleSave} disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar'}
        </Button>
      </PopoverContent>
    </Popover>
  );
}
