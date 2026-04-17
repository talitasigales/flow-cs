import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Calendar, Users, Presentation, Briefcase, MapPin, MessageCircle, LifeBuoy, TrendingUp, Circle, MoreHorizontal, Pencil, Trash2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TOUCHPOINT_TYPE_LABELS, TOUCHPOINT_STATUS_LABELS } from '@/lib/cs/healthScore';
import { cn } from '@/lib/utils';

const ICONS: Record<string, any> = {
  reuniao_estrategica: Users,
  onboarding: Calendar,
  apresentacao: Presentation,
  construcao_cargo: Briefcase,
  visita: MapPin,
  follow_up: MessageCircle,
  suporte: LifeBuoy,
  expansao: TrendingUp,
  outro: Circle,
};

const COLORS: Record<string, string> = {
  reuniao_estrategica: 'bg-primary/15 text-primary',
  onboarding: 'bg-blue-500/15 text-blue-500',
  apresentacao: 'bg-purple-500/15 text-purple-500',
  construcao_cargo: 'bg-amber-500/15 text-amber-500',
  visita: 'bg-green-500/15 text-green-500',
  follow_up: 'bg-cyan-500/15 text-cyan-500',
  suporte: 'bg-destructive/15 text-destructive',
  expansao: 'bg-emerald-500/15 text-emerald-500',
  outro: 'bg-muted text-muted-foreground',
};

export interface TimelineItem {
  id: string;
  type: string;
  status: string;
  occurred_at: string;
  title: string | null;
  description: string | null;
  tags: string[] | null;
  owner_user_id: string | null;
  owner_name?: string;
  contacts?: Array<{ id: string; name: string }>;
}

interface Props {
  items: TimelineItem[];
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (item: TimelineItem) => void;
  onDelete: (id: string) => void;
}

export function TouchpointTimeline({ items, canEdit, canDelete, onEdit, onDelete }: Props) {
  const [confirmId, setConfirmId] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
        Nenhum touchpoint registrado ainda.
      </div>
    );
  }

  // Group by month
  const groups: Record<string, TimelineItem[]> = {};
  for (const it of items) {
    const key = format(new Date(it.occurred_at), "MMMM 'de' yyyy", { locale: ptBR });
    (groups[key] ??= []).push(it);
  }

  return (
    <div className="space-y-8">
      {Object.entries(groups).map(([month, list]) => (
        <div key={month}>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">{month}</h3>
          <div className="relative pl-6 border-l-2 border-border space-y-4">
            {list.map(item => {
              const Icon = ICONS[item.type] ?? Circle;
              const colorCls = COLORS[item.type] ?? COLORS.outro;
              const isCritical = item.type === 'suporte';
              return (
                <div key={item.id} className="relative">
                  <div className={cn('absolute -left-[34px] flex items-center justify-center w-10 h-10 rounded-full border-2 border-background', colorCls)}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className={cn('rounded-lg border bg-card p-4 transition-colors', isCritical && 'border-destructive/40')}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-semibold text-sm">{TOUCHPOINT_TYPE_LABELS[item.type]}</span>
                          <Badge variant={item.status === 'cancelado' ? 'destructive' : item.status === 'agendado' ? 'secondary' : 'outline'} className="text-[10px]">
                            {TOUCHPOINT_STATUS_LABELS[item.status]}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(item.occurred_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                        {item.title && <p className="text-sm font-medium mb-1">{item.title}</p>}
                        {item.description && <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.description}</p>}
                        {(item.tags?.length ?? 0) > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {item.tags!.map(t => <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>)}
                          </div>
                        )}
                        {(item.contacts?.length ?? 0) > 0 && (
                          <p className="text-xs text-muted-foreground mt-2">
                            <strong>Contatos:</strong> {item.contacts!.map(c => c.name).join(', ')}
                          </p>
                        )}
                        {item.owner_name && (
                          <p className="text-xs text-muted-foreground mt-1">Por {item.owner_name}</p>
                        )}
                      </div>
                      {(canEdit || canDelete) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="w-4 h-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {canEdit && <DropdownMenuItem onClick={() => onEdit(item)}><Pencil className="w-4 h-4 mr-2" />Editar</DropdownMenuItem>}
                            {canDelete && (
                              confirmId === item.id ? (
                                <DropdownMenuItem onClick={() => { onDelete(item.id); setConfirmId(null); }} className="text-destructive">
                                  <Trash2 className="w-4 h-4 mr-2" />Confirmar exclusão
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={(e) => { e.preventDefault(); setConfirmId(item.id); }} className="text-destructive">
                                  <Trash2 className="w-4 h-4 mr-2" />Excluir
                                </DropdownMenuItem>
                              )
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
