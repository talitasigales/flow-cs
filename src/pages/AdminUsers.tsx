import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ArrowLeft, UserPlus, Shield, User, KeyRound, Copy, Check, Trash2, Search, Activity, Sparkles, Download } from 'lucide-react';
import { toast } from 'sonner';
import { UserActivityDialog } from '@/components/admin/UserActivityDialog';
import { generateCSV, downloadCSV } from '@/utils/exportUtils';

interface UserData {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  company: string | null;
  created_at: string;
  role: 'admin' | 'user' | null;
  nanda_count: number;
  action_count: number;
  last_activity: string | null;
}

const AdminUsers = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'user'>('user');
  const [inviting, setInviting] = useState(false);
  const [inviteResult, setInviteResult] = useState<{ tempPassword?: string; message?: string } | null>(null);
  const [inviteCopied, setInviteCopied] = useState(false);
  
  // Reset password states
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetUserId, setResetUserId] = useState('');
  const [resetUserName, setResetUserName] = useState('');
  const [resetting, setResetting] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [copied, setCopied] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Activity dialog
  const [activityOpen, setActivityOpen] = useState(false);
  const [activityUserId, setActivityUserId] = useState<string | null>(null);
  const [activityUserName, setActivityUserName] = useState('');

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      toast.error('Acesso negado');
      navigate('/dashboard');
    }
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchUsers();
    }
  }, [user, isAdmin]);

  const fetchUsers = async () => {
    try {
      // Fetch all profiles with their roles
      const { data: profiles, error: profilesError } = await (supabase as any)
        .from('profiles')
        .select('id, user_id, full_name, email, company, created_at')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch all user roles
      const { data: roles, error: rolesError } = await (supabase as any)
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Fetch usage data: Nanda messages and audit logs
      const [nandaRes, auditRes] = await Promise.all([
        (supabase as any).from('nanda_messages').select('user_id, created_at').eq('role', 'user'),
        (supabase as any).from('audit_logs').select('user_id, created_at'),
      ]);

      const nandaCounts: Record<string, number> = {};
      for (const m of (nandaRes.data || [])) {
        if (m.user_id) nandaCounts[m.user_id] = (nandaCounts[m.user_id] || 0) + 1;
      }

      const actionCounts: Record<string, number> = {};
      const lastActivity: Record<string, string> = {};
      for (const l of (auditRes.data || [])) {
        if (!l.user_id) continue;
        actionCounts[l.user_id] = (actionCounts[l.user_id] || 0) + 1;
        if (!lastActivity[l.user_id] || l.created_at > lastActivity[l.user_id]) {
          lastActivity[l.user_id] = l.created_at;
        }
      }
      // Nanda messages also count as activity for "last_activity"
      for (const m of (nandaRes.data || [])) {
        if (!m.user_id) continue;
        if (!lastActivity[m.user_id] || m.created_at > lastActivity[m.user_id]) {
          lastActivity[m.user_id] = m.created_at;
        }
      }

      // Combine profiles with roles
      const usersWithRoles = (profiles || []).map((profile: any) => {
        const userRole = (roles || []).find((r: any) => r.user_id === profile.user_id);
        return {
          ...profile,
          role: userRole?.role || null,
          nanda_count: nandaCounts[profile.user_id] || 0,
          action_count: actionCounts[profile.user_id] || 0,
          last_activity: lastActivity[profile.user_id] || null,
        };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteUser = async () => {
    if (!inviteEmail) {
      toast.error('Digite um email válido');
      return;
    }

    setInviting(true);
    try {
      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: { email: inviteEmail, role: inviteRole }
      });

      if (error) throw error;

      if (data?.tempPassword) {
        setInviteResult({ tempPassword: data.tempPassword, message: `Usuário ${inviteEmail} criado com sucesso!` });
      } else {
        toast.success(data?.message || 'Convite processado com sucesso!');
        setInviteDialogOpen(false);
        setInviteEmail('');
        setInviteRole('user');
        setInviteResult(null);
      }
      fetchUsers();
    } catch (error: any) {
      console.error('Error inviting user:', error);
      toast.error(error.message || 'Erro ao convidar usuário');
    } finally {
      setInviting(false);
    }
  };

  const copyInvitePassword = () => {
    if (inviteResult?.tempPassword) {
      navigator.clipboard.writeText(inviteResult.tempPassword);
      setInviteCopied(true);
      toast.success('Senha copiada!');
      setTimeout(() => setInviteCopied(false), 2000);
    }
  };

  const handleToggleRole = async (userId: string, currentRole: 'admin' | 'user' | null) => {
    try {
      if (currentRole === 'admin') {
        // Remove admin role
        const { error } = await (supabase as any)
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', 'admin');

        if (error) throw error;
        toast.success('Permissões de admin removidas');
      } else {
        // Add admin role (upsert to avoid duplicate key error)
        const { error } = await (supabase as any)
          .from('user_roles')
          .upsert({ user_id: userId, role: 'admin' }, { onConflict: 'user_id,role' });

        if (error) throw error;
        toast.success('Usuário promovido a admin');
      }

      fetchUsers();
    } catch (error: any) {
      console.error('Error toggling role:', error);
      toast.error('Erro ao alterar permissões');
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId }
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`Usuário ${userName} excluído com sucesso`);
      fetchUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error(error.message || 'Erro ao excluir usuário');
    }
  };

  const handleResetPassword = async () => {
    if (!resetUserId) return;
    
    setResetting(true);
    try {
      const { data, error } = await supabase.functions.invoke('reset-password', {
        body: { userId: resetUserId }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setGeneratedPassword(data.provisionalPassword);
      toast.success('Senha resetada com sucesso!');
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast.error(error.message || 'Erro ao resetar senha');
      setResetDialogOpen(false);
    } finally {
      setResetting(false);
    }
  };

  const openResetDialog = (userId: string, name: string | null) => {
    setResetUserId(userId);
    setResetUserName(name || 'Usuário');
    setGeneratedPassword('');
    setCopied(false);
    setResetDialogOpen(true);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPassword);
    setCopied(true);
    toast.success('Senha copiada!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (adminLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Gerenciamento de Usuários</h1>
              <p className="text-muted-foreground">Gerencie usuários e permissões do sistema</p>
            </div>
          </div>

          <Dialog open={inviteDialogOpen} onOpenChange={(open) => {
            setInviteDialogOpen(open);
            if (!open) {
              setInviteEmail('');
              setInviteRole('user');
              setInviteResult(null);
              setInviteCopied(false);
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Convidar Usuário
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Convidar Novo Usuário</DialogTitle>
                <DialogDescription>
                  {inviteResult ? inviteResult.message : 'Envie um convite por email para um novo usuário acessar a plataforma'}
                </DialogDescription>
              </DialogHeader>

              {inviteResult?.tempPassword ? (
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <Label className="text-sm text-muted-foreground">Senha provisória:</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <code className="flex-1 p-3 bg-background rounded border text-lg font-mono">
                        {inviteResult.tempPassword}
                      </code>
                      <Button size="icon" variant="outline" onClick={copyInvitePassword}>
                        {inviteCopied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Envie esta senha ao usuário de forma segura. Ele será obrigado a trocá-la no primeiro login.
                  </p>
                  <DialogFooter>
                    <Button onClick={() => { setInviteDialogOpen(false); setInviteResult(null); setInviteEmail(''); setInviteRole('user'); }}>
                      Fechar
                    </Button>
                  </DialogFooter>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="usuario@exemplo.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="role">Permissão</Label>
                      <Select value={inviteRole} onValueChange={(value: 'admin' | 'user') => setInviteRole(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">Usuário</SelectItem>
                          <SelectItem value="admin">Administrador</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleInviteUser} disabled={inviting}>
                      {inviting ? 'Enviando...' : 'Enviar Convite'}
                    </Button>
                  </DialogFooter>
                </>
              )}
            </DialogContent>
          </Dialog>
        </div>

        {(() => {
          const uniqueCompanies = Array.from(new Set(users.map(u => u.company).filter(Boolean))).sort() as string[];
          const term = searchTerm.toLowerCase().trim();
          const filteredUsers = users.filter(u => {
            const matchesSearch = !term ||
              (u.full_name || '').toLowerCase().includes(term) ||
              (u.email || '').toLowerCase().includes(term) ||
              (u.company || '').toLowerCase().includes(term);
            const matchesCompany = companyFilter === 'all' || (u.company || '') === companyFilter;
            const matchesRole = roleFilter === 'all'
              || (roleFilter === 'admin' && u.role === 'admin')
              || (roleFilter === 'user' && u.role !== 'admin');
            return matchesSearch && matchesCompany && matchesRole;
          });

          return (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <CardTitle>Usuários Cadastrados</CardTitle>
                <CardDescription>
                  Mostrando {filteredUsers.length} de {users.length} usuário{users.length !== 1 ? 's' : ''}
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (filteredUsers.length === 0) {
                    toast.error('Nenhum usuário para exportar');
                    return;
                  }
                  const headers = [
                    'Nome', 'Email', 'Empresa', 'Permissão',
                    'Mensagens Nanda', 'Total de ações', 'Última atividade', 'Cadastrado em',
                  ];
                  const rows = filteredUsers.map(u => [
                    u.full_name || '', u.email || '', u.company || '',
                    u.role === 'admin' ? 'Admin' : 'Usuário',
                    u.nanda_count, u.action_count,
                    u.last_activity ? new Date(u.last_activity).toLocaleString('pt-BR') : '',
                    new Date(u.created_at).toLocaleDateString('pt-BR'),
                  ]);
                  const csv = generateCSV(headers, rows);
                  const scope = companyFilter !== 'all'
                    ? companyFilter.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 40)
                    : 'geral';
                  downloadCSV(csv, `atividade_usuarios_${scope}_${new Date().toISOString().split('T')[0]}.csv`);
                  toast.success(`${filteredUsers.length} usuários exportados`);
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV {companyFilter !== 'all' ? '(empresa filtrada)' : '(geral)'}
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, email ou empresa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={companyFilter} onValueChange={setCompanyFilter}>
                <SelectTrigger><SelectValue placeholder="Empresa" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as empresas</SelectItem>
                  {uniqueCompanies.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger><SelectValue placeholder="Permissão" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as permissões</SelectItem>
                  <SelectItem value="admin">Administradores</SelectItem>
                  <SelectItem value="user">Usuários</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Permissão</TableHead>
                  <TableHead>Atividade</TableHead>
                  <TableHead>Última atividade</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((userData) => (
                  <TableRow key={userData.id}>
                    <TableCell className="font-medium">
                      {userData.full_name || 'Sem nome'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{userData.email || '-'}</TableCell>
                    <TableCell>{userData.company || '-'}</TableCell>
                    <TableCell>
                      {userData.role === 'admin' ? (
                        <Badge variant="default">
                          <Shield className="h-3 w-3 mr-1" />
                          Admin
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <User className="h-3 w-3 mr-1" />
                          Usuário
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="outline" className="text-[10px]" title="Ações registradas">
                          <Activity className="h-3 w-3 mr-1" />{userData.action_count}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] border-primary/40 text-primary" title="Mensagens enviadas à Nanda">
                          <Sparkles className="h-3 w-3 mr-1" />{userData.nanda_count}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {userData.last_activity
                        ? new Date(userData.last_activity).toLocaleDateString('pt-BR')
                        : '—'}
                    </TableCell>
                    <TableCell className="text-right space-x-2 space-y-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setActivityUserId(userData.user_id);
                          setActivityUserName(userData.full_name || userData.email || 'Usuário');
                          setActivityOpen(true);
                        }}
                      >
                        <Activity className="h-3 w-3 mr-1" />
                        Atividade
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openResetDialog(userData.user_id, userData.full_name)}
                      >
                        <KeyRound className="h-3 w-3 mr-1" />
                        Resetar Senha
                      </Button>
                      <Button
                        size="sm"
                        variant={userData.role === 'admin' ? 'destructive' : 'outline'}
                        onClick={() => handleToggleRole(userData.user_id, userData.role)}
                        disabled={userData.user_id === user?.id}
                      >
                        {userData.role === 'admin' ? 'Remover Admin' : 'Tornar Admin'}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={userData.user_id === user?.id}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Excluir
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir Usuário</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir {userData.full_name || 'este usuário'}? Esta ação é irreversível e todos os dados serão perdidos.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteUser(userData.user_id, userData.full_name || 'Usuário')}>
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
          );
        })()}

        <UserActivityDialog
          open={activityOpen}
          onOpenChange={setActivityOpen}
          userId={activityUserId}
          userName={activityUserName}
        />


        {/* Reset Password Dialog */}
        <Dialog open={resetDialogOpen} onOpenChange={(open) => {
          if (!open) {
            setResetDialogOpen(false);
            setGeneratedPassword('');
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Resetar Senha</DialogTitle>
              <DialogDescription>
                {generatedPassword 
                  ? `A senha de ${resetUserName} foi resetada com sucesso.`
                  : `Tem certeza que deseja resetar a senha de ${resetUserName}?`
                }
              </DialogDescription>
            </DialogHeader>
            
            {generatedPassword ? (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <Label className="text-sm text-muted-foreground">Nova senha provisória:</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <code className="flex-1 p-3 bg-background rounded border text-lg font-mono">
                      {generatedPassword}
                    </code>
                    <Button size="icon" variant="outline" onClick={copyToClipboard}>
                      {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  O usuário será obrigado a trocar a senha no próximo login.
                </p>
                <DialogFooter>
                  <Button onClick={() => setResetDialogOpen(false)}>
                    Fechar
                  </Button>
                </DialogFooter>
              </div>
            ) : (
              <DialogFooter>
                <Button variant="outline" onClick={() => setResetDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleResetPassword} disabled={resetting}>
                  {resetting ? 'Resetando...' : 'Confirmar Reset'}
                </Button>
              </DialogFooter>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminUsers;
