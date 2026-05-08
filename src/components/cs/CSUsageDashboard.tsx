import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Activity, Sparkles, Users as UsersIcon, Download, BarChart3 } from 'lucide-react';
import { UserActivityDialog } from '@/components/admin/UserActivityDialog';
import { generateCSV, downloadCSV } from '@/utils/exportUtils';

interface UsageRow {
  user_id: string;
  full_name: string | null;
  email: string | null;
  company: string | null;
  role: string | null;
  nanda_count: number;
  action_count: number;
  last_activity: string | null;
  created_at: string;
}

export function CSUsageDashboard() {
  const [rows, setRows] = useState<UsageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [activityDays, setActivityDays] = useState('all');
  const [activityOpen, setActivityOpen] = useState(false);
  const [activityUserId, setActivityUserId] = useState<string | null>(null);
  const [activityUserName, setActivityUserName] = useState('');

  useEffect(() => {
    void load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [profilesRes, rolesRes, nandaRes, auditRes] = await Promise.all([
        (supabase as any).from('profiles').select('user_id, full_name, email, company, created_at'),
        (supabase as any).from('user_roles').select('user_id, role'),
        (supabase as any).from('nanda_messages').select('user_id, created_at').eq('role', 'user'),
        (supabase as any).from('audit_logs').select('user_id, created_at'),
      ]);

      const roleMap: Record<string, string> = {};
      for (const r of rolesRes.data ?? []) roleMap[r.user_id] = r.role;

      const nandaCounts: Record<string, number> = {};
      const lastActivity: Record<string, string> = {};
      for (const m of nandaRes.data ?? []) {
        if (!m.user_id) continue;
        nandaCounts[m.user_id] = (nandaCounts[m.user_id] || 0) + 1;
        if (!lastActivity[m.user_id] || m.created_at > lastActivity[m.user_id]) lastActivity[m.user_id] = m.created_at;
      }
      const actionCounts: Record<string, number> = {};
      for (const l of auditRes.data ?? []) {
        if (!l.user_id) continue;
        actionCounts[l.user_id] = (actionCounts[l.user_id] || 0) + 1;
        if (!lastActivity[l.user_id] || l.created_at > lastActivity[l.user_id]) lastActivity[l.user_id] = l.created_at;
      }

      const list: UsageRow[] = (profilesRes.data ?? []).map((p: any) => ({
        user_id: p.user_id,
        full_name: p.full_name,
        email: p.email,
        company: p.company,
        role: roleMap[p.user_id] ?? null,
        nanda_count: nandaCounts[p.user_id] || 0,
        action_count: actionCounts[p.user_id] || 0,
        last_activity: lastActivity[p.user_id] || null,
        created_at: p.created_at,
      }));
      setRows(list);
    } finally {
      setLoading(false);
    }
  };

  const companies = useMemo(() => {
    const s = new Set<string>();
    rows.forEach(r => r.company && s.add(r.company));
    return Array.from(s).sort();
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const cutoff = activityDays === 'all' ? 0 : Date.now() - Number(activityDays) * 86400000;
    return rows.filter(r => {
      if (companyFilter !== 'all' && (r.company || '') !== companyFilter) return false;
      if (q) {
        const hay = `${r.full_name ?? ''} ${r.email ?? ''} ${r.company ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (cutoff && (!r.last_activity || +new Date(r.last_activity) < cutoff)) return false;
      return true;
    });
  }, [rows, search, companyFilter, activityDays]);

  const kpis = useMemo(() => {
    const now = Date.now();
    const active7 = filtered.filter(r => r.last_activity && (now - +new Date(r.last_activity)) <= 7 * 86400000).length;
    const totalNanda = filtered.reduce((s, r) => s + r.nanda_count, 0);
    const totalActions = filtered.reduce((s, r) => s + r.action_count, 0);
    return { total: filtered.length, active7, totalNanda, totalActions };
  }, [filtered]);

  const exportCsv = () => {
    const headers = ['Nome', 'Email', 'Empresa', 'Permissão', 'Mensagens Nanda', 'Total ações', 'Última atividade', 'Cadastrado em'];
    const data = filtered.map(r => [
      r.full_name || '',
      r.email || '',
      r.company || '',
      r.role || 'user',
      r.nanda_count,
      r.action_count,
      r.last_activity ? new Date(r.last_activity).toLocaleString('pt-BR') : '',
      new Date(r.created_at).toLocaleDateString('pt-BR'),
    ]);
    const scope = companyFilter === 'all' ? 'geral' : companyFilter.toLowerCase().replace(/\s+/g, '-');
    downloadCSV(generateCSV(headers, data), `cs-uso-usuarios-${scope}-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const fmtRel = (iso: string | null) => {
    if (!iso) return '—';
    const d = Math.floor((Date.now() - +new Date(iso)) / 86400000);
    if (d === 0) return 'hoje';
    if (d === 1) return 'ontem';
    if (d < 30) return `há ${d}d`;
    if (d < 365) return `há ${Math.floor(d / 30)}m`;
    return `há ${Math.floor(d / 365)}a`;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi icon={UsersIcon} label="Usuários" value={kpis.total} />
        <Kpi icon={Activity} label="Ativos (7d)" value={kpis.active7} tone="success" />
        <Kpi icon={Sparkles} label="Mensagens Nanda" value={kpis.totalNanda} />
        <Kpi icon={BarChart3} label="Ações registradas" value={kpis.totalActions} />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-base">Uso por usuário</CardTitle>
            <Button size="sm" variant="outline" onClick={exportCsv} disabled={!filtered.length}>
              <Download className="w-4 h-4 mr-2" />Exportar CSV
            </Button>
          </div>
          <div className="flex flex-wrap gap-3 items-end pt-3">
            <div className="flex-1 min-w-[220px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input className="pl-9" placeholder="Buscar por nome, email ou empresa..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>
            <Select value={companyFilter} onValueChange={setCompanyFilter}>
              <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as empresas</SelectItem>
                {companies.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={activityDays} onValueChange={setActivityDays}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Atividade: todos</SelectItem>
                <SelectItem value="7">Ativos últimos 7d</SelectItem>
                <SelectItem value="30">Ativos últimos 30d</SelectItem>
                <SelectItem value="90">Ativos últimos 90d</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-10 text-center text-muted-foreground">Carregando...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead className="text-right">Nanda</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                  <TableHead>Última atividade</TableHead>
                  <TableHead className="w-[110px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum usuário encontrado.</TableCell></TableRow>
                ) : filtered.map(r => (
                  <TableRow key={r.user_id}>
                    <TableCell>
                      <div className="font-medium">{r.full_name || '—'}</div>
                      <div className="text-xs text-muted-foreground">{r.email}</div>
                    </TableCell>
                    <TableCell className="text-sm">{r.company || '—'}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">{r.nanda_count}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline">{r.action_count}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{fmtRel(r.last_activity)}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" onClick={() => {
                        setActivityUserId(r.user_id);
                        setActivityUserName(r.full_name || r.email || 'Usuário');
                        setActivityOpen(true);
                      }}>
                        <Activity className="w-4 h-4 mr-1" />Detalhes
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <UserActivityDialog
        open={activityOpen}
        onOpenChange={setActivityOpen}
        userId={activityUserId}
        userName={activityUserName}
      />
    </div>
  );
}

function Kpi({ icon: Icon, label, value, tone }: { icon: any; label: string; value: number; tone?: 'success' }) {
  const toneCls = tone === 'success' ? 'text-emerald-500' : 'text-primary';
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
