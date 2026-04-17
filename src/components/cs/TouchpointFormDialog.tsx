import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { TOUCHPOINT_TYPE_LABELS, TOUCHPOINT_STATUS_LABELS } from '@/lib/cs/healthScore';

interface Touchpoint {
  id: string; type: string; status: string; occurred_at: string; title: string | null;
  description: string | null; tags: string[] | null;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  companyId: string;
  touchpoint?: Touchpoint | null;
  onSaved: () => void;
}

export function TouchpointFormDialog({ open, onOpenChange, companyId, touchpoint, onSaved }: Props) {
  const { user } = useAuth();
  const [type, setType] = useState('reuniao_estrategica');
  const [status, setStatus] = useState('realizado');
  const [occurredAt, setOccurredAt] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tagsText, setTagsText] = useState('');
  const [contacts, setContacts] = useState<Array<{ id: string; name: string }>>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setType(touchpoint?.type ?? 'reuniao_estrategica');
    setStatus(touchpoint?.status ?? 'realizado');
    setOccurredAt(touchpoint ? new Date(touchpoint.occurred_at).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16));
    setTitle(touchpoint?.title ?? '');
    setDescription(touchpoint?.description ?? '');
    setTagsText((touchpoint?.tags ?? []).join(', '));

    (async () => {
      const { data } = await (supabase as any).from('cs_contacts').select('id, name').eq('company_id', companyId).eq('is_active', true);
      setContacts((data ?? []) as any);
      if (touchpoint?.id) {
        const { data: rel } = await (supabase as any).from('cs_touchpoint_contacts').select('contact_id').eq('touchpoint_id', touchpoint.id);
        setSelected((rel ?? []).map((r: any) => r.contact_id));
      } else {
        setSelected([]);
      }
    })();
  }, [open, companyId, touchpoint]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const tags = tagsText.split(',').map(t => t.trim()).filter(Boolean);
      const payload: any = {
        company_id: companyId,
        owner_user_id: touchpoint?.id ? undefined : user?.id,
        type, status,
        occurred_at: new Date(occurredAt).toISOString(),
        title: title.trim() || null,
        description: description.trim() || null,
        tags,
      };
      let tpId: string;
      if (touchpoint?.id) {
        const { error } = await (supabase as any).from('cs_touchpoints').update(payload).eq('id', touchpoint.id);
        if (error) throw error;
        tpId = touchpoint.id;
        await (supabase as any).from('cs_touchpoint_contacts').delete().eq('touchpoint_id', tpId);
        await supabase.rpc('log_user_action', { _action: 'CS_TOUCHPOINT_UPDATE', _table_name: 'cs_touchpoints', _record_id: tpId });
      } else {
        const { data, error } = await (supabase as any).from('cs_touchpoints').insert(payload).select('id').single();
        if (error) throw error;
        tpId = data.id;
        await supabase.rpc('log_user_action', { _action: 'CS_TOUCHPOINT_CREATE', _table_name: 'cs_touchpoints', _record_id: tpId });
      }
      if (selected.length > 0) {
        await (supabase as any).from('cs_touchpoint_contacts').insert(selected.map(cid => ({ touchpoint_id: tpId, contact_id: cid })));
      }
      toast.success(touchpoint ? 'Touchpoint atualizado' : 'Touchpoint registrado');
      onSaved();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{touchpoint ? 'Editar touchpoint' : 'Novo touchpoint'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tipo *</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TOUCHPOINT_TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status *</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TOUCHPOINT_STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Data e hora *</Label>
              <Input type="datetime-local" value={occurredAt} onChange={e => setOccurredAt(e.target.value)} />
            </div>
            <div>
              <Label>Título</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Resumo curto" />
            </div>
          </div>
          <div>
            <Label>Descrição detalhada</Label>
            <Textarea rows={5} value={description} onChange={e => setDescription(e.target.value)} placeholder="O que aconteceu, decisões, próximos passos..." />
          </div>
          <div>
            <Label>Tags (separadas por vírgula)</Label>
            <Input value={tagsText} onChange={e => setTagsText(e.target.value)} placeholder="renovacao, q4, expansao" />
          </div>
          {contacts.length > 0 && (
            <div>
              <Label className="mb-2 block">Contatos envolvidos</Label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto rounded border p-3">
                {contacts.map(c => (
                  <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={selected.includes(c.id)}
                      onCheckedChange={(v) => setSelected(v ? [...selected, c.id] : selected.filter(x => x !== c.id))}
                    />
                    <span>{c.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
