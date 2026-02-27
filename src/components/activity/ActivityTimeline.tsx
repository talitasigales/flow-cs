import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  GraduationCap,
  ClipboardList,
  TrendingUp,
  Grid3x3,
  CheckCircle2,
  Edit,
  Trash2,
  Plus,
  Activity,
} from 'lucide-react';
import { Card } from '@/components/ui/card';

interface AuditLog {
  id: string;
  action: string;
  table_name: string | null;
  created_at: string;
  new_data: any;
  old_data: any;
}

interface ActivityTimelineProps {
  logs: AuditLog[];
  loading: boolean;
}

function getActionIcon(action: string, tableName: string | null) {
  const iconClass = 'h-4 w-4';
  if (tableName === 'user_progress') return <GraduationCap className={iconClass} />;
  if (tableName === 'pdis' || tableName === 'pdi_actions' || tableName === 'pdi_checkins' || tableName === 'pdi_closures')
    return <ClipboardList className={iconClass} />;
  if (tableName === 'profile_evolution') return <TrendingUp className={iconClass} />;
  if (tableName === 'matriz_9box') return <Grid3x3 className={iconClass} />;
  if (action === 'INSERT') return <Plus className={iconClass} />;
  if (action === 'UPDATE') return <Edit className={iconClass} />;
  if (action === 'DELETE') return <Trash2 className={iconClass} />;
  return <Activity className={iconClass} />;
}

function getActionColor(action: string): string {
  switch (action) {
    case 'INSERT': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case 'UPDATE': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'DELETE': return 'bg-red-500/20 text-red-400 border-red-500/30';
    default: return 'bg-muted text-muted-foreground border-border';
  }
}

function getTableLabel(tableName: string | null): string {
  const labels: Record<string, string> = {
    user_progress: 'Progresso de Módulo',
    pdis: 'PDI',
    pdi_actions: 'Ação de PDI',
    pdi_checkins: 'Check-in de PDI',
    pdi_closures: 'Encerramento de PDI',
    pdi_mentors: 'Mentor de PDI',
    profile_evolution: 'Perfil PDA',
    matriz_9box: 'Matriz 9Box',
    profiles: 'Perfil do Usuário',
  };
  return labels[tableName || ''] || tableName || 'Sistema';
}

function getActionLabel(action: string): string {
  switch (action) {
    case 'INSERT': return 'Criou';
    case 'UPDATE': return 'Atualizou';
    case 'DELETE': return 'Removeu';
    default: return action;
  }
}

function getDescription(log: AuditLog): string {
  const actionLabel = getActionLabel(log.action);
  const tableLabel = getTableLabel(log.table_name);

  // Try to extract a name from the data
  const data = log.new_data || log.old_data;
  let detail = '';
  if (data) {
    if (data.employee_name) detail = ` — ${data.employee_name}`;
    else if (data.title) detail = ` — ${data.title}`;
    else if (data.description) detail = ` — ${data.description.substring(0, 40)}`;
  }

  return `${actionLabel} ${tableLabel}${detail}`;
}

export function ActivityTimeline({ logs, loading }: ActivityTimelineProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex gap-4 animate-pulse">
            <div className="w-10 h-10 rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-12">
        <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Nenhuma atividade encontrada</h3>
        <p className="text-muted-foreground">Suas ações na plataforma aparecerão aqui</p>
      </div>
    );
  }

  // Group by date
  const grouped = logs.reduce<Record<string, AuditLog[]>>((acc, log) => {
    const dateKey = format(new Date(log.created_at), 'yyyy-MM-dd');
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(log);
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      {Object.entries(grouped).map(([dateKey, dateLogs]) => (
        <div key={dateKey}>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1 bg-border" />
            <span className="text-sm font-medium text-muted-foreground px-3 py-1 rounded-full bg-muted/50">
              {format(new Date(dateKey), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="space-y-3">
            {dateLogs.map((log) => (
              <Card key={log.id} className="p-4 border-border/50 hover:border-primary/20 transition-colors">
                <div className="flex items-start gap-4">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border ${getActionColor(log.action)}`}>
                    {getActionIcon(log.action, log.table_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{getDescription(log)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(log.created_at), "HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full border ${getActionColor(log.action)}`}>
                    {getActionLabel(log.action)}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
