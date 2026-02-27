import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, History, RefreshCw } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { ActivityTimeline } from '@/components/activity/ActivityTimeline';

interface AuditLog {
  id: string;
  action: string;
  table_name: string | null;
  created_at: string;
  new_data: any;
  old_data: any;
}

export default function ActivityHistory() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('all');
  const [tableFilter, setTableFilter] = useState('all');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) fetchLogs();
  }, [user, actionFilter, tableFilter, page]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('audit_logs')
        .select('id, action, table_name, created_at, new_data, old_data')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (actionFilter !== 'all') query = query.eq('action', actionFilter);
      if (tableFilter !== 'all') query = query.eq('table_name', tableFilter);

      const { data, error } = await query;
      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="border-b border-border/50 bg-card/50 backdrop-blur sticky top-0 z-10">
            <div className="container mx-auto px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button variant="ghost" onClick={() => navigate('/dashboard')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar
                  </Button>
                  <div className="flex items-center gap-2">
                    <History className="h-6 w-6 text-primary" />
                    <h1 className="text-2xl font-bold gradient-text">Histórico de Atividades</h1>
                  </div>
                </div>
                <Button variant="outline" size="icon" onClick={() => fetchLogs()}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="container mx-auto px-6 py-6 space-y-6">
            {/* Filters */}
            <div className="flex flex-wrap gap-4">
              <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(0); }}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Tipo de ação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as ações</SelectItem>
                  <SelectItem value="INSERT">Criação</SelectItem>
                  <SelectItem value="UPDATE">Atualização</SelectItem>
                  <SelectItem value="DELETE">Exclusão</SelectItem>
                </SelectContent>
              </Select>

              <Select value={tableFilter} onValueChange={(v) => { setTableFilter(v); setPage(0); }}>
                <SelectTrigger className="w-52">
                  <SelectValue placeholder="Área" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as áreas</SelectItem>
                  <SelectItem value="user_progress">Módulos</SelectItem>
                  <SelectItem value="pdis">PDI</SelectItem>
                  <SelectItem value="pdi_actions">Ações de PDI</SelectItem>
                  <SelectItem value="pdi_checkins">Check-ins</SelectItem>
                  <SelectItem value="profile_evolution">Perfil PDA</SelectItem>
                  <SelectItem value="matriz_9box">Matriz 9Box</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <ActivityTimeline logs={logs} loading={loading} />

            {/* Pagination */}
            {logs.length > 0 && (
              <div className="flex justify-center gap-4 pt-4">
                <Button variant="outline" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                  Anterior
                </Button>
                <span className="flex items-center text-sm text-muted-foreground">Página {page + 1}</span>
                <Button variant="outline" disabled={logs.length < PAGE_SIZE} onClick={() => setPage(p => p + 1)}>
                  Próxima
                </Button>
              </div>
            )}
        </div>
    </AppLayout>
  );
}
