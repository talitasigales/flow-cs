import { Badge } from '@/components/ui/badge';
import { HealthBand } from '@/lib/cs/healthScore';
import { Activity, AlertTriangle, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  score: number;
  band: HealthBand;
  className?: string;
}

export function HealthBadge({ score, band, className }: Props) {
  const map = {
    healthy: { Icon: Heart, label: 'Saudável', cls: 'bg-green-500/15 text-green-500 border-green-500/30' },
    warning: { Icon: Activity, label: 'Atenção', cls: 'bg-yellow-500/15 text-yellow-500 border-yellow-500/30' },
    critical: { Icon: AlertTriangle, label: 'Crítico', cls: 'bg-destructive/15 text-destructive border-destructive/30' },
  } as const;
  const { Icon, label, cls } = map[band];
  return (
    <Badge variant="outline" className={cn('gap-1', cls, className)}>
      <Icon className="w-3 h-3" />
      <span className="font-semibold">{score}</span>
      <span className="opacity-80">· {label}</span>
    </Badge>
  );
}
