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
import { ArrowLeft, UserPlus, Shield, User, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface UserData {
  id: string;
  email: string;
  full_name: string | null;
  company: string | null;
  created_at: string;
  role: 'admin' | 'user' | null;
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
        .select('id, email, full_name, company, created_at')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch all user roles
      const { data: roles, error: rolesError } = await (supabase as any)
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Combine profiles with roles
      const usersWithRoles = (profiles || []).map((profile: any) => {
        const userRole = (roles || []).find((r: any) => r.user_id === profile.id);
        return {
          ...profile,
          role: userRole?.role || null
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
      const { error } = await supabase.functions.invoke('invite-user', {
        body: { email: inviteEmail, role: inviteRole }
      });

      if (error) throw error;

      toast.success('Convite enviado com sucesso!');
      setInviteDialogOpen(false);
      setInviteEmail('');
      setInviteRole('user');
      fetchUsers();
    } catch (error: any) {
      console.error('Error inviting user:', error);
      toast.error(error.message || 'Erro ao convidar usuário');
    } finally {
      setInviting(false);
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
        // Add admin role
        const { error } = await (supabase as any)
          .from('user_roles')
          .insert({ user_id: userId, role: 'admin' });

        if (error) throw error;
        toast.success('Usuário promovido a admin');
      }

      fetchUsers();
    } catch (error: any) {
      console.error('Error toggling role:', error);
      toast.error('Erro ao alterar permissões');
    }
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

          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
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
                  Envie um convite por email para um novo usuário acessar a plataforma
                </DialogDescription>
              </DialogHeader>
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
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Usuários Cadastrados</CardTitle>
            <CardDescription>
              Total de {users.length} usuário{users.length !== 1 ? 's' : ''} no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Permissão</TableHead>
                  <TableHead>Cadastrado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((userData) => (
                  <TableRow key={userData.id}>
                    <TableCell className="font-medium">
                      {userData.full_name || 'Sem nome'}
                    </TableCell>
                    <TableCell>{userData.email}</TableCell>
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
                      {new Date(userData.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant={userData.role === 'admin' ? 'destructive' : 'outline'}
                        onClick={() => handleToggleRole(userData.id, userData.role)}
                        disabled={userData.id === user?.id}
                      >
                        {userData.role === 'admin' ? 'Remover Admin' : 'Tornar Admin'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminUsers;
