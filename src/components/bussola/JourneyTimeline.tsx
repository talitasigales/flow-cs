import { Check, Lock, Play, Sparkles, Star, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

export interface EncounterStatus {
  number: number;
  title: string;
  subtitle: string;
  status: 'locked' | 'active' | 'completed';
  hasPrework?: boolean;
  preworkDone?: boolean;
}

interface JourneyTimelineProps {
  encounters: EncounterStatus[];
  programId: string;
}

const ENCOUNTER_ICONS = ['🌟', '🧭', '🔧', '🗺️', '💪', '🚀'];
const XP_VALUES = [50, 200, 200, 200, 200, 300];

export function JourneyTimeline({ encounters, programId }: JourneyTimelineProps) {
  const navigate = useNavigate();

  const completedCount = encounters.filter(e => e.status === 'completed').length;
  const totalXP = encounters.reduce((sum, e, i) => e.status === 'completed' ? sum + XP_VALUES[i] : sum, 0);
  const maxXP = XP_VALUES.reduce((a, b) => a + b, 0);

  const handleClick = (enc: EncounterStatus) => {
    if (enc.status === 'locked') return;
    navigate(`/bussola/encontro/${enc.number}?program=${programId}`);
  };

  return (
    <div className="space-y-6">
      {/* XP Progress bar */}
      <div className="rounded-2xl bg-card border border-border p-4 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-secondary to-primary">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">{totalXP} XP</p>
              <p className="text-xs text-muted-foreground">de {maxXP} XP total</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Star className="h-4 w-4 text-secondary" />
            <span className="text-sm font-bold text-foreground">{completedCount}/{encounters.length}</span>
            <span className="text-xs text-muted-foreground">etapas</span>
          </div>
        </div>
        <div className="h-3 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-secondary via-primary to-accent transition-all duration-1000 ease-out"
            style={{ width: `${(totalXP / maxXP) * 100}%` }}
          />
        </div>
      </div>

      {/* Timeline */}
      <div className="relative space-y-0">
        {encounters.map((enc, i) => {
          const isLast = i === encounters.length - 1;

          return (
            <div key={enc.number} className="relative flex gap-4 group">
              {/* Vertical line + dot */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'relative flex h-12 w-12 items-center justify-center rounded-xl shrink-0 z-10 transition-all duration-300',
                    enc.status === 'completed' && 'bg-gradient-to-br from-primary to-accent shadow-lg',
                    enc.status === 'active' && 'bg-gradient-to-br from-primary to-secondary shadow-lg shadow-primary/30 ring-2 ring-primary/30',
                    enc.status === 'locked' && 'bg-muted border border-border'
                  )}
                >
                  {enc.status === 'completed' && <Check className="h-5 w-5 text-primary-foreground" />}
                  {enc.status === 'active' && (
                    <>
                      <Play className="h-5 w-5 text-primary-foreground ml-0.5" />
                      <div className="absolute inset-0 rounded-xl bg-primary-foreground/20 animate-ping opacity-30" />
                    </>
                  )}
                  {enc.status === 'locked' && <Lock className="h-4 w-4 text-muted-foreground/50" />}
                </div>
                {!isLast && (
                  <div className={cn(
                    'w-0.5 flex-1 min-h-[1rem] transition-colors',
                    enc.status === 'completed' ? 'bg-gradient-to-b from-primary/40 to-primary/10' : 'bg-border'
                  )} />
                )}
              </div>

              {/* Card */}
              <button
                onClick={() => handleClick(enc)}
                disabled={enc.status === 'locked'}
                className={cn(
                  'mb-4 flex-1 rounded-2xl p-4 text-left transition-all duration-300',
                  enc.status === 'completed' && 'bg-card border border-border hover:bg-muted/50',
                  enc.status === 'active' && 'bg-gradient-to-r from-card to-muted/50 border border-primary/20 shadow-xl shadow-primary/10 hover:border-primary/40',
                  enc.status === 'locked' && 'bg-card/30 border border-border/50 opacity-50 cursor-not-allowed'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{ENCOUNTER_ICONS[i]}</span>
                      <span className={cn(
                        'text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full',
                        enc.status === 'completed' && 'bg-success/20 text-success',
                        enc.status === 'active' && 'bg-primary/20 text-primary',
                        enc.status === 'locked' && 'bg-muted text-muted-foreground/40'
                      )}>
                        {enc.number === 0 ? 'Início' : `Fase ${enc.number}`}
                      </span>
                      {enc.status === 'completed' && (
                        <span className="text-[10px] font-bold text-secondary">+{XP_VALUES[i]} XP</span>
                      )}
                    </div>
                    <h3 className={cn(
                      'text-base font-bold',
                      enc.status === 'locked' ? 'text-muted-foreground/40' : 'text-foreground'
                    )}>
                      {enc.title}
                    </h3>
                    <p className={cn(
                      'mt-0.5 text-xs',
                      enc.status === 'locked' ? 'text-muted-foreground/30' : 'text-muted-foreground'
                    )}>
                      {enc.subtitle}
                    </p>
                  </div>
                  {enc.status === 'active' && (
                    <div className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      <span className="text-xs font-semibold text-foreground/80">Jogar</span>
                    </div>
                  )}
                </div>
                {enc.hasPrework && enc.status !== 'locked' && (
                  <div className="mt-3 flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
                    <div className={cn('h-2 w-2 rounded-full', enc.preworkDone ? 'bg-success' : 'bg-secondary animate-pulse')} />
                    <span className="text-xs text-muted-foreground">{enc.preworkDone ? '✓ Pré-trabalho feito' : '⏳ Pré-trabalho pendente'}</span>
                  </div>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
