import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { COMPANY_STATUS_LABELS } from '@/lib/cs/healthScore';

interface CSOwnerOption { user_id: string; full_name: string | null; }
interface Company { id: string; name: string; segment: string | null; status: string; start_date: string | null; owner_user_id: string | null; notes: string | null; }

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  company?: Company | null;
  onSaved: () => void;
}

export function CompanyFormDialog({ open, onOpenChange, company, onSaved }: Props) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [segment, setSegment] = useState('');
  const [status, setStatus] = useState('onboarding');
  const [startDate, setStartDate] = useState('');
  const [ownerId, setOwnerId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [owners, setOwners] = useState<CSOwnerOption[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(company?.name ?? '');
    setSegment(company?.segment ?? '');
    setStatus(company?.status ?? 'onboarding');
    setStartDate(company?.start_date ?? '');
    setOwnerId(company?.owner_user_id ?? user?.id ?? '');
    setNotes(company?.notes ?? '');

    (async () => {
      const { data: access } = await (supabase as any).from('cs_user_access').select('user_id');
      const ids = (access ?? []).map((a: any) => a.user_id);
      if (user?.id && !ids.includes(user.id)) ids.push(user.id);
      if (ids.length === 0) return setOwners([]);
      const { data: profs } = await supabase.from('profiles').select('user_id, full_name').in('user_id', ids);
      setOwners((profs ?? []) as any);
    })();
  }, [open, company, user]);

  const handleSave = async () => {
    if (!name.trim()) return toast.error('Nome é obrigatório');
    setSaving(true);
    try {
      const payload: any = {
        name: name.trim(),
        segment: segment.trim() || null,
        status,
        start_date: startDate || null,
        owner_user_id: ownerId || null,
        notes: notes.trim() || null,
      };
      if (company?.id) {
        const { error } = await (supabase as any).from('cs_companies').update(payload).eq('id', company.id);
        if (error) throw error;
        await supabase.rpc('log_user_action', { _action: 'CS_COMPANY_UPDATE', _table_name: 'cs_companies', _record_id: company.id });
        toast.success('Empresa atualizada');
      } else {
        payload.created_by = user?.id;
        const { data, error } = await (supabase as any).from('cs_companies').insert(payload).select('id').single();
        if (error) throw error;
        await supabase.rpc('log_user_action', { _action: 'CS_COMPANY_CREATE', _table_name: 'cs_companies', _record_id: data.id });
        toast.success('Empresa criada');
      }
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{company ? 'Editar empresa' : 'Nova empresa'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Nome da empresa *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Segmento</Label>
              <Input value={segment} onChange={e => setSegment(e.target.value)} placeholder="Ex: Indústria, Serviços" />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(COMPANY_STATUS_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Data de início</Label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div>
              <Label>Responsável (CS owner)</Label>
              <Select value={ownerId} onValueChange={setOwnerId}>
                <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>
                  {owners.map(o => <SelectItem key={o.user_id} value={o.user_id}>{o.full_name || o.user_id.slice(0, 8)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Observações</Label>
            <Textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
