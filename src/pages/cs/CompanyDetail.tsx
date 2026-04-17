import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { useCSAccess } from '@/hooks/useCSAccess';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Pencil, Mail, Phone, Trash2 } from 'lucide-react';
import { CompanyFormDialog } from '@/components/cs/CompanyFormDialog';
import { ContactFormDialog } from '@/components/cs/ContactFormDialog';
import { TouchpointFormDialog } from '@/components/cs/TouchpointFormDialog';
import { TouchpointTimeline, TimelineItem } from '@/components/cs/TouchpointTimeline';
import { HealthBadge } from '@/components/cs/HealthBadge';
import { calculateHealthScore, COMPANY_STATUS_LABELS, INFLUENCE_LABELS } from '@/lib/cs/healthScore';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function CompanyDetail() {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const { loading: accessLoading, hasAccess, canEdit, canManage } = useCSAccess();

  const [company, setCompany] = useState<any>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [touchpoints, setTouchpoints] = useState<any[]>([]);
  const [ownerName, setOwnerName] = useState('');
  const [loading, setLoading] = useState(true);

  const [editCompany, setEditCompany] = useState(false);
  const [contactDialog, setContactDialog] = useState<{ open: boolean; contact?: any }>({ open: false });
  const [tpDialog, setTpDialog] = useState<{ open: boolean; tp?: any }>({ open: false });

  useEffect(() => {
    if (!accessLoading && !hasAccess) {
      toast.error('Acesso negado');
      navigate('/dashboard');
    }
  }, [accessLoading, hasAccess, navigate]);

  const fetchAll = async () => {
    if (!companyId) return;
    setLoading(true);
    const { data: comp } = await (supabase as any).from('cs_companies').select('*').eq('id', companyId).maybeSingle();
    setCompany(comp);
    if (comp?.owner_user_id) {
      const { data: prof } = await supabase.from('profiles').select('full_name').eq('user_id', comp.owner_user_id).maybeSingle();
      setOwnerName(prof?.full_name || '');
    }
    const { data: ctcs } = await (supabase as any).from('cs_contacts').select('*').eq('company_id', companyId).order('name');
    setContacts(ctcs ?? []);
    const { data: tps } = await (supabase as any).from('cs_touchpoints').select('*').eq('company_id', companyId).order('occurred_at', { ascending: false });
    const tpList = (tps ?? []) as any[];

    // attach contacts
    if (tpList.length > 0) {
      const ids = tpList.map(t => t.id);
      const { data: rels } = await (supabase as any).from('cs_touchpoint_contacts').select('touchpoint_id, contact_id').in('touchpoint_id', ids);
      const contactMap = new Map((ctcs ?? []).map((c: any) => [c.id, c.name]));
      const tpContacts: Record<string, any[]> = {};
      for (const r of rels ?? []) {
        const name = contactMap.get(r.contact_id);
        if (name) (tpContacts[r.touchpoint_id] ??= []).push({ id: r.contact_id, name });
      }
      // owner names
      const ownerIds = Array.from(new Set(tpList.map(t => t.owner_user_id).filter(Boolean)));
      const { data: profs } = ownerIds.length > 0
        ? await supabase.from('profiles').select('user_id, full_name').in('user_id', ownerIds as string[])
        : { data: [] };
      const ownerMap = Object.fromEntries((profs ?? []).map((p: any) => [p.user_id, p.full_name]));
      setTouchpoints(tpList.map(t => ({ ...t, contacts: tpContacts[t.id] ?? [], owner_name: t.owner_user_id ? ownerMap[t.owner_user_id] : '' })));
    } else {
      setTouchpoints([]);
    }
    setLoading(false);
  };

  useEffect(() => { if (hasAccess && companyId) fetchAll(); }, [hasAccess, companyId]);

  const handleDeleteCompany = async () => {
    if (!confirm('Excluir esta empresa e todo o histórico associado?')) return;
    const { error } = await (supabase as any).from('cs_companies').delete().eq('id', companyId);
    if (error) return toast.error(error.message);
    toast.success('Empresa excluída');
    navigate('/cs');
  };

  const handleDeleteContact = async (id: string) => {
    const { error } = await (supabase as any).from('cs_contacts').delete().eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Contato removido');
    fetchAll();
  };

  const handleDeleteTouchpoint = async (id: string) => {
    const { error } = await (supabase as any).from('cs_touchpoints').delete().eq('id', id);
    if (error) return toast.error(error.message);
    await supabase.rpc('log_user_action', { _action: 'CS_TOUCHPOINT_DELETE', _table_name: 'cs_touchpoints', _record_id: id });
    toast.success('Touchpoint removido');
    fetchAll();
  };

  if (loading || !company) {
    return <AppLayout><div className="p-8 text-muted-foreground">Carregando...</div></AppLayout>;
  }

  const health = calculateHealthScore(company.status, touchpoints);

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6 max-w-6xl">
        <Button variant="ghost" size="sm" onClick={() => navigate('/cs')}>
          <ArrowLeft className="w-4 h-4 mr-2" />Voltar
        </Button>

        <Card>
          <CardContent className="p-6 flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold">{company.name}</h1>
                <Badge variant="outline">{COMPANY_STATUS_LABELS[company.status]}</Badge>
                <HealthBadge score={health.score} band={health.band} />
              </div>
              <div className="text-sm text-muted-foreground space-x-3">
                {company.segment && <span>Segmento: <strong className="text-foreground">{company.segment}</strong></span>}
                {ownerName && <span>Responsável: <strong className="text-foreground">{ownerName}</strong></span>}
                {company.start_date && <span>Início: <strong className="text-foreground">{format(new Date(company.start_date), 'dd/MM/yyyy', { locale: ptBR })}</strong></span>}
              </div>
              {company.notes && <p className="text-sm text-muted-foreground max-w-2xl">{company.notes}</p>}
            </div>
            <div className="flex gap-2">
              {canEdit && <Button variant="outline" size="sm" onClick={() => setEditCompany(true)}><Pencil className="w-4 h-4 mr-2" />Editar</Button>}
              {canManage && <Button variant="outline" size="sm" onClick={handleDeleteCompany} className="text-destructive"><Trash2 className="w-4 h-4 mr-2" />Excluir</Button>}
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="timeline">
          <TabsList>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="contacts">Contatos ({contacts.length})</TabsTrigger>
            <TabsTrigger value="overview">Visão geral</TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="space-y-4 mt-6">
            <div className="flex justify-end">
              {canEdit && <Button onClick={() => setTpDialog({ open: true })}><Plus className="w-4 h-4 mr-2" />Novo touchpoint</Button>}
            </div>
            <TouchpointTimeline
              items={touchpoints as TimelineItem[]}
              canEdit={canEdit}
              canDelete={canManage}
              onEdit={(t) => setTpDialog({ open: true, tp: t })}
              onDelete={handleDeleteTouchpoint}
            />
          </TabsContent>

          <TabsContent value="contacts" className="space-y-4 mt-6">
            <div className="flex justify-end">
              {canEdit && <Button onClick={() => setContactDialog({ open: true })}><Plus className="w-4 h-4 mr-2" />Novo contato</Button>}
            </div>
            {contacts.length === 0 ? (
              <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">Nenhum contato cadastrado.</div>
            ) : (
              <div className="grid md:grid-cols-2 gap-3">
                {contacts.map(c => (
                  <Card key={c.id} className={!c.is_active ? 'opacity-60' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold">{c.name}</h3>
                            <Badge variant="secondary" className="text-[10px]">{INFLUENCE_LABELS[c.influence]}</Badge>
                            {!c.is_active && <Badge variant="outline" className="text-[10px]">Inativo</Badge>}
                          </div>
                          {c.role_title && <p className="text-sm text-muted-foreground">{c.role_title}</p>}
                          <div className="mt-2 space-y-1">
                            {c.email && <a href={`mailto:${c.email}`} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary"><Mail className="w-3 h-3" />{c.email}</a>}
                            {c.phone && <p className="flex items-center gap-2 text-xs text-muted-foreground"><Phone className="w-3 h-3" />{c.phone}</p>}
                          </div>
                        </div>
                        {canEdit && (
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setContactDialog({ open: true, contact: c })}><Pencil className="w-3.5 h-3.5" /></Button>
                            {canManage && <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteContact(c.id)}><Trash2 className="w-3.5 h-3.5" /></Button>}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="overview" className="mt-6">
            <Card>
              <CardContent className="p-6 space-y-3">
                <h3 className="font-semibold">Customer Experience</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <Stat label="Health Score" value={`${health.score}/100`} />
                  <Stat label="Último contato" value={health.daysSinceLast === null ? 'Nunca' : `há ${health.daysSinceLast}d`} />
                  <Stat label="Touchpoints (total)" value={String(touchpoints.length)} />
                  <Stat label="Contatos ativos" value={String(contacts.filter(c => c.is_active).length)} />
                </div>
                {health.reasons.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Fatores do health score</p>
                    <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                      {health.reasons.map((r, i) => <li key={i}>{r}</li>)}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <CompanyFormDialog open={editCompany} onOpenChange={setEditCompany} company={company} onSaved={fetchAll} />
      <ContactFormDialog open={contactDialog.open} onOpenChange={(v) => setContactDialog({ open: v })} companyId={companyId!} contact={contactDialog.contact} onSaved={fetchAll} />
      <TouchpointFormDialog open={tpDialog.open} onOpenChange={(v) => setTpDialog({ open: v })} companyId={companyId!} touchpoint={tpDialog.tp} onSaved={fetchAll} />
    </AppLayout>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}
