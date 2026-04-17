import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Trash2, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const ROLE_LABELS: Record<string, string> = {
  cs_admin: 'Admin CS',
  cs_editor: 'Editor',
  cs_viewer: 'Visualizador',
};

export default function AdminCSAccess() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const [accessList, setAccessList] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [newUserId, setNewUserId] = useState('');
  const [newRole, setNewRole] = useState('cs_viewer');

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      toast.error('Acesso negado');
      navigate('/dashboard');
    }
  }, [isAdmin, adminLoading, navigate]);

  const fetchAll = async () => {
    setLoading(true);
    const { data: access } = await (supabase as any).from('cs_user_access').select('*').order('created_at', { ascending: false });
    const list = access ?? [];
    const ids = list.map((a: any) => a.user_id);
    let profMap: Record<string, any> = {};
    if (ids.length > 0) {
      const { data: profs } = await supabase.from('profiles').select('user_id, full_name, email, company').in('user_id', ids);
      profMap = Object.fromEntries((profs ?? []).map((p: any) => [p.user_id, p]));
    }
    setAccessList(list.map((a: any) => ({ ...a, profile: profMap[a.user_id] ?? {} })));

    const { data: all } = await supabase.from('profiles').select('user_id, full_name, email, company').order('full_name');
    setAllUsers(all ?? []);
    setLoading(false);
  };

  useEffect(() => { if (isAdmin) fetchAll(); }, [isAdmin]);

  const handleGrant = async () => {
    if (!newUserId) return toast.error('Selecione um usuário');
    const { error } = await (supabase as any).from('cs_user_access').insert({
      user_id: newUserId,
      cs_role: newRole,
      created_by: user?.id,
    });
    if (error) return toast.error(error.message);
    toast.success('Acesso concedido');
    setNewUserId('');
    fetchAll();
  };

  const handleUpdateRole = async (id: string, role: string) => {
    const { error } = await (supabase as any).from('cs_user_access').update({ cs_role: role }).eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Papel atualizado');
    fetchAll();
  };

  const handleRevoke = async (id: string) => {
    if (!confirm('Revogar acesso CS deste usuário?')) return;
    const { error } = await (supabase as any).from('cs_user_access').delete().eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Acesso revogado');
    fetchAll();
  };

  const grantedIds = new Set(accessList.map(a => a.user_id));
  const availableUsers = allUsers.filter(u => !grantedIds.has(u.user_id));
  const filtered = accessList.filter(a => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (a.profile?.full_name || '').toLowerCase().includes(q) || (a.profile?.email || '').toLowerCase().includes(q);
  });

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6 max-w-5xl">
        <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}><ArrowLeft className="w-4 h-4 mr-2" />Voltar</Button>
        <div>
          <h1 className="text-3xl font-bold gradient-text">Acesso ao módulo CS</h1>
          <p className="text-muted-foreground text-sm">Defina quais membros do time têm acesso ao CRM interno e em qual papel.</p>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Conceder acesso</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[260px]">
              <Select value={newUserId} onValueChange={setNewUserId}>
                <SelectTrigger><SelectValue placeholder="Selecionar usuário" /></SelectTrigger>
                <SelectContent>
                  {availableUsers.map(u => (
                    <SelectItem key={u.user_id} value={u.user_id}>
                      {u.full_name || u.email} {u.company ? `· ${u.company}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(ROLE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={handleGrant}><Plus className="w-4 h-4 mr-2" />Conceder</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Usuários com acesso ({accessList.length})</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input className="pl-9" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground text-sm">Carregando...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Papel</TableHead>
                    <TableHead className="w-20"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Nenhum usuário com acesso.</TableCell></TableRow>
                  ) : filtered.map(a => (
                    <TableRow key={a.id}>
                      <TableCell>
                        <div className="font-medium">{a.profile?.full_name || '—'}</div>
                        <div className="text-xs text-muted-foreground">{a.profile?.email}</div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{a.profile?.company || '—'}</TableCell>
                      <TableCell>
                        <Select value={a.cs_role} onValueChange={(v) => handleUpdateRole(a.id, v)}>
                          <SelectTrigger className="w-[160px] h-8"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Object.entries(ROLE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleRevoke(a.id)}><Trash2 className="w-4 h-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
