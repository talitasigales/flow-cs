import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { useCSAccess } from '@/hooks/useCSAccess';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Building2, AlertTriangle, Users as UsersIcon, Activity } from 'lucide-react';
import { CompanyFormDialog } from '@/components/cs/CompanyFormDialog';
import { HealthBadge } from '@/components/cs/HealthBadge';
import { AlertsBanner } from '@/components/cs/AlertsBanner';
import { CSUsageDashboard } from '@/components/cs/CSUsageDashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { calculateHealthScore, COMPANY_STATUS_LABELS } from '@/lib/cs/healthScore';
import { toast } from 'sonner';

interface CompanyRow {
  id: string;
  name: string;
  segment: string | null;
  status: string;
  start_date: string | null;
  owner_user_id: string | null;
  notes: string | null;
  created_at: string;
}

const statusColors: Record<string, string> = {
  onboarding: 'bg-blue-500/15 text-blue-500 border-blue-500/30',
  ativo: 'bg-green-500/15 text-green-500 border-green-500/30',
  risco: 'bg-yellow-500/15 text-yellow-500 border-yellow-500/30',
  churn: 'bg-destructive/15 text-destructive border-destructive/30',
  expansao: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
};

export default function CSDashboard() {
  const navigate = useNavigate();
  const { loading: accessLoading, hasAccess, canEdit } = useCSAccess();
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [touchpointsByCompany, setTouchpointsByCompany] = useState<Record<string, any[]>>({});
  const [ownersMap, setOwnersMap] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [healthFilter, setHealthFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState(false);

  useEffect(() => {
    if (!accessLoading && !hasAccess) {
      toast.error('Acesso negado ao módulo CS');
      navigate('/dashboard');
    }
  }, [accessLoading, hasAccess, navigate]);

  const fetchAll = async () => {
    setLoading(true);
    const { data: comps } = await (supabase as any)
      .from('cs_companies')
      .select('*')
      .order('name');
    const list = (comps ?? []) as CompanyRow[];
    setCompanies(list);

    const ids = list.map(c => c.id);
    if (ids.length > 0) {
      const { data: tps } = await (supabase as any)
        .from('cs_touchpoints')
        .select('id, company_id, type, status, occurred_at')
        .in('company_id', ids);
      const map: Record<string, any[]> = {};
      for (const tp of tps ?? []) (map[tp.company_id] ??= []).push(tp);
      setTouchpointsByCompany(map);
    }

    const ownerIds = Array.from(new Set(list.map(c => c.owner_user_id).filter(Boolean))) as string[];
    if (ownerIds.length > 0) {
      const { data: profs } = await supabase.from('profiles').select('user_id, full_name').in('user_id', ownerIds);
      setOwnersMap(Object.fromEntries((profs ?? []).map((p: any) => [p.user_id, p.full_name || ''])));
    }
    setLoading(false);
  };

  useEffect(() => { if (hasAccess) fetchAll(); }, [hasAccess]);

  const enriched = useMemo(() => {
    return companies.map(c => {
      const tps = touchpointsByCompany[c.id] ?? [];
      const health = calculateHealthScore(c.status, tps);
      return { ...c, health, owner_name: c.owner_user_id ? ownersMap[c.owner_user_id] : '' };
    });
  }, [companies, touchpointsByCompany, ownersMap]);

  const alerts = useMemo(() => {
    const now = Date.now();
    let noContact = 0, noOnboarding = 0, decreasing = 0;
    for (const c of enriched) {
      const tps = touchpointsByCompany[c.id] ?? [];
      const realized = tps.filter(t => t.status === 'realizado').sort((a, b) => +new Date(b.occurred_at) - +new Date(a.occurred_at));
      const lastDays = realized[0] ? Math.floor((now - +new Date(realized[0].occurred_at)) / 86400000) : Infinity;
      if (lastDays > 45) noContact++;
      const ageDays = Math.floor((now - +new Date(c.created_at)) / 86400000);
      const hasOnboarding = tps.some(t => t.type === 'onboarding');
      if (ageDays > 14 && !hasOnboarding) noOnboarding++;
      const last30 = realized.filter(t => (now - +new Date(t.occurred_at)) / 86400000 <= 30).length;
      const prev30 = realized.filter(t => {
        const d = (now - +new Date(t.occurred_at)) / 86400000;
        return d > 30 && d <= 60;
      }).length;
      if (prev30 >= 2 && last30 < prev30 / 2) decreasing++;
    }
    return { noContact, noOnboarding, decreasing };
  }, [enriched, touchpointsByCompany]);

  const filtered = enriched.filter(c => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (ownerFilter !== 'all' && c.owner_user_id !== ownerFilter) return false;
    if (healthFilter !== 'all' && c.health.band !== healthFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!c.name.toLowerCase().includes(q) && !(c.segment ?? '').toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const kpis = useMemo(() => ({
    total: enriched.length,
    risco: enriched.filter(c => c.status === 'risco' || c.status === 'churn').length,
    expansao: enriched.filter(c => c.status === 'expansao').length,
    critical: enriched.filter(c => c.health.band === 'critical').length,
  }), [enriched]);

  if (accessLoading || loading) {
    return <AppLayout><div className="p-8 text-muted-foreground">Carregando...</div></AppLayout>;
  }

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6 max-w-7xl">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold gradient-text">Customer Success</h1>
            <p className="text-muted-foreground text-sm">Gestão de relacionamento com clientes e acompanhamento de uso da plataforma.</p>
          </div>
        </div>

        <Tabs defaultValue="timeline" className="space-y-6">
          <TabsList>
            <TabsTrigger value="timeline">Timeline & Touchpoints</TabsTrigger>
            <TabsTrigger value="usage">Uso de usuários</TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="space-y-6 mt-0">
            <div className="flex items-center justify-end">
              {canEdit && (
                <Button onClick={() => setOpenForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />Nova empresa
                </Button>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <KpiCard icon={Building2} label="Empresas" value={kpis.total} />
              <KpiCard icon={AlertTriangle} label="Em risco/churn" value={kpis.risco} tone="danger" />
              <KpiCard icon={Activity} label="Health crítico" value={kpis.critical} tone="danger" />
              <KpiCard icon={UsersIcon} label="Em expansão" value={kpis.expansao} tone="success" />
            </div>

            <AlertsBanner {...alerts} />

            <Card>
              <CardHeader>
                <div className="flex flex-wrap gap-3 items-end">
                  <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input className="pl-9" placeholder="Buscar empresa ou segmento..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      {Object.entries(COMPANY_STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={ownerFilter} onValueChange={setOwnerFilter}>
                    <SelectTrigger className="w-[180px]"><SelectValue placeholder="Responsável" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos responsáveis</SelectItem>
                      {Object.entries(ownersMap).map(([id, name]) => <SelectItem key={id} value={id}>{name || id.slice(0, 8)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={healthFilter} onValueChange={setHealthFilter}>
                    <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Health: todos</SelectItem>
                      <SelectItem value="healthy">Saudável</SelectItem>
                      <SelectItem value="warning">Atenção</SelectItem>
                      <SelectItem value="critical">Crítico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Health</TableHead>
                      <TableHead>Último contato</TableHead>
                      <TableHead>Responsável</TableHead>
                      <TableHead>Segmento</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhuma empresa encontrada.</TableCell></TableRow>
                    ) : filtered.map(c => (
                      <TableRow key={c.id} className="cursor-pointer hover:bg-muted/40" onClick={() => navigate(`/cs/empresas/${c.id}`)}>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell><Badge variant="outline" className={statusColors[c.status]}>{COMPANY_STATUS_LABELS[c.status]}</Badge></TableCell>
                        <TableCell><HealthBadge score={c.health.score} band={c.health.band} /></TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {c.health.daysSinceLast === null ? 'Nunca' : `há ${c.health.daysSinceLast}d`}
                        </TableCell>
                        <TableCell className="text-sm">{c.owner_name || '—'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{c.segment || '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="usage" className="mt-0">
            <CSUsageDashboard />
          </TabsContent>
        </Tabs>
      </div>

      <CompanyFormDialog open={openForm} onOpenChange={setOpenForm} onSaved={fetchAll} />
    </AppLayout>
  );
}

function KpiCard({ icon: Icon, label, value, tone }: { icon: any; label: string; value: number; tone?: 'danger' | 'success' }) {
  const toneCls = tone === 'danger' ? 'text-destructive' : tone === 'success' ? 'text-emerald-500' : 'text-primary';
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center ${toneCls}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
