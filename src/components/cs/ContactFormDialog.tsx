import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { INFLUENCE_LABELS } from '@/lib/cs/healthScore';

interface Contact { id: string; name: string; role_title: string | null; email: string | null; phone: string | null; influence: string; is_active: boolean; }

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  companyId: string;
  contact?: Contact | null;
  onSaved: () => void;
}

export function ContactFormDialog({ open, onOpenChange, companyId, contact, onSaved }: Props) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [influence, setInfluence] = useState('usuario');
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(contact?.name ?? '');
    setRole(contact?.role_title ?? '');
    setEmail(contact?.email ?? '');
    setPhone(contact?.phone ?? '');
    setInfluence(contact?.influence ?? 'usuario');
    setActive(contact?.is_active ?? true);
  }, [open, contact]);

  const handleSave = async () => {
    if (!name.trim()) return toast.error('Nome é obrigatório');
    setSaving(true);
    try {
      const payload: any = {
        company_id: companyId,
        name: name.trim(),
        role_title: role.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        influence,
        is_active: active,
      };
      if (contact?.id) {
        const { error } = await (supabase as any).from('cs_contacts').update(payload).eq('id', contact.id);
        if (error) throw error;
        toast.success('Contato atualizado');
      } else {
        const { error } = await (supabase as any).from('cs_contacts').insert(payload);
        if (error) throw error;
        toast.success('Contato criado');
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{contact ? 'Editar contato' : 'Novo contato'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Nome *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <Label>Cargo</Label>
            <Input value={role} onChange={e => setRole(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>E-mail</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Nível de influência</Label>
            <Select value={influence} onValueChange={setInfluence}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(INFLUENCE_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label>Contato ativo</Label>
            <Switch checked={active} onCheckedChange={setActive} />
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
