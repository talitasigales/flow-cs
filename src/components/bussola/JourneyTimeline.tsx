import { Check, Lock, Play, Sparkles } from 'lucide-react';
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

export function JourneyTimeline({ encounters, programId }: JourneyTimelineProps) {
  const navigate = useNavigate();

  const handleClick = (enc: EncounterStatus) => {
    if (enc.status === 'locked') return;
    navigate(`/bussola/encontro/${enc.number}?program=${programId}`);
  };

  return (
    <div className="relative space-y-0">
      {encounters.map((enc, i) => {
        const isLast = i === encounters.length - 1;
        const colors = {
          locked: 'border-muted bg-muted/30 text-muted-foreground',
          active: 'border-primary bg-primary/5 text-foreground shadow-lg shadow-primary/10 ring-2 ring-primary/20',
          completed: 'border-green-500 bg-green-50 text-foreground',
        };
        const dotColors = {
          locked: 'bg-muted text-muted-foreground',
          active: 'bg-primary text-primary-foreground animate-pulse',
          completed: 'bg-green-500 text-white',
        };

        return (
          <div key={enc.number} className="relative flex gap-4">
            {/* Vertical line + dot */}
            <div className="flex flex-col items-center">
              <div className={cn('flex h-10 w-10 items-center justify-center rounded-full border-2 shrink-0 z-10', dotColors[enc.status])}>
                {enc.status === 'completed' && <Check className="h-5 w-5" />}
                {enc.status === 'active' && <Play className="h-4 w-4 ml-0.5" />}
                {enc.status === 'locked' && <Lock className="h-4 w-4" />}
              </div>
              {!isLast && (
                <div className={cn('w-0.5 flex-1 min-h-[2rem]', enc.status === 'completed' ? 'bg-green-300' : 'bg-muted')} />
              )}
            </div>

            {/* Card */}
            <button
              onClick={() => handleClick(enc)}
              disabled={enc.status === 'locked'}
              className={cn(
                'mb-4 flex-1 rounded-xl border-2 p-4 text-left transition-all',
                colors[enc.status],
                enc.status !== 'locked' && 'cursor-pointer hover:shadow-md',
                enc.status === 'locked' && 'cursor-not-allowed opacity-60'
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {enc.number === 0 ? 'Boas-Vindas' : `Encontro ${enc.number}`}
                  </p>
                  <h3 className="mt-1 text-lg font-bold">{enc.title}</h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">{enc.subtitle}</p>
                </div>
                {enc.status === 'active' && (
                  <Sparkles className="h-5 w-5 text-primary shrink-0" />
                )}
              </div>
              {enc.hasPrework && enc.status !== 'locked' && (
                <div className="mt-2 flex items-center gap-1.5">
                  <div className={cn('h-2 w-2 rounded-full', enc.preworkDone ? 'bg-green-500' : 'bg-amber-400')} />
                  <span className="text-xs">{enc.preworkDone ? 'Pré-trabalho concluído' : 'Pré-trabalho pendente'}</span>
                </div>
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}
