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

const ENCOUNTER_GRADIENTS = [
  'from-amber-500 to-orange-600',        // Welcome
  'from-violet-500 to-purple-600',        // E1
  'from-cyan-500 to-blue-600',            // E2
  'from-emerald-500 to-teal-600',         // E3
  'from-rose-500 to-pink-600',            // E4
  'from-amber-400 to-yellow-500',         // E5
];

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
      <div className="rounded-2xl bg-white/5 border border-white/10 p-4 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">{totalXP} XP</p>
              <p className="text-xs text-white/40">de {maxXP} XP total</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Star className="h-4 w-4 text-amber-400" />
            <span className="text-sm font-bold text-white">{completedCount}/{encounters.length}</span>
            <span className="text-xs text-white/40">etapas</span>
          </div>
        </div>
        <div className="h-3 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 transition-all duration-1000 ease-out"
            style={{ width: `${(totalXP / maxXP) * 100}%` }}
          />
        </div>
      </div>

      {/* Timeline */}
      <div className="relative space-y-0">
        {encounters.map((enc, i) => {
          const isLast = i === encounters.length - 1;
          const gradient = ENCOUNTER_GRADIENTS[i] || ENCOUNTER_GRADIENTS[0];

          return (
            <div key={enc.number} className="relative flex gap-4 group">
              {/* Vertical line + dot */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'relative flex h-12 w-12 items-center justify-center rounded-xl shrink-0 z-10 transition-all duration-300',
                    enc.status === 'completed' && `bg-gradient-to-br ${gradient} shadow-lg`,
                    enc.status === 'active' && `bg-gradient-to-br ${gradient} shadow-lg shadow-purple-500/30 ring-2 ring-white/30`,
                    enc.status === 'locked' && 'bg-white/5 border border-white/10'
                  )}
                >
                  {enc.status === 'completed' && <Check className="h-5 w-5 text-white" />}
                  {enc.status === 'active' && (
                    <>
                      <Play className="h-5 w-5 text-white ml-0.5" />
                      <div className="absolute inset-0 rounded-xl bg-white/20 animate-ping opacity-30" />
                    </>
                  )}
                  {enc.status === 'locked' && <Lock className="h-4 w-4 text-white/30" />}
                </div>
                {!isLast && (
                  <div className={cn(
                    'w-0.5 flex-1 min-h-[1rem] transition-colors',
                    enc.status === 'completed' ? 'bg-gradient-to-b from-white/30 to-white/10' : 'bg-white/5'
                  )} />
                )}
              </div>

              {/* Card */}
              <button
                onClick={() => handleClick(enc)}
                disabled={enc.status === 'locked'}
                className={cn(
                  'mb-4 flex-1 rounded-2xl p-4 text-left transition-all duration-300',
                  enc.status === 'completed' && 'bg-white/5 border border-white/10 hover:bg-white/8',
                  enc.status === 'active' && 'bg-gradient-to-r from-white/10 to-white/5 border border-white/20 shadow-xl shadow-purple-500/10 hover:from-white/15 hover:to-white/8 hover:border-white/30',
                  enc.status === 'locked' && 'bg-white/[0.02] border border-white/5 opacity-50 cursor-not-allowed'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{ENCOUNTER_ICONS[i]}</span>
                      <span className={cn(
                        'text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full',
                        enc.status === 'completed' && 'bg-emerald-500/20 text-emerald-400',
                        enc.status === 'active' && 'bg-purple-500/20 text-purple-300',
                        enc.status === 'locked' && 'bg-white/5 text-white/20'
                      )}>
                        {enc.number === 0 ? 'Início' : `Fase ${enc.number}`}
                      </span>
                      {enc.status === 'completed' && (
                        <span className="text-[10px] font-bold text-amber-400">+{XP_VALUES[i]} XP</span>
                      )}
                    </div>
                    <h3 className={cn(
                      'text-base font-bold',
                      enc.status === 'locked' ? 'text-white/30' : 'text-white'
                    )}>
                      {enc.title}
                    </h3>
                    <p className={cn(
                      'mt-0.5 text-xs',
                      enc.status === 'locked' ? 'text-white/15' : 'text-white/50'
                    )}>
                      {enc.subtitle}
                    </p>
                  </div>
                  {enc.status === 'active' && (
                    <div className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-purple-300" />
                      <span className="text-xs font-semibold text-white/80">Jogar</span>
                    </div>
                  )}
                </div>
                {enc.hasPrework && enc.status !== 'locked' && (
                  <div className="mt-3 flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2">
                    <div className={cn('h-2 w-2 rounded-full', enc.preworkDone ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse')} />
                    <span className="text-xs text-white/60">{enc.preworkDone ? '✓ Pré-trabalho feito' : '⏳ Pré-trabalho pendente'}</span>
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
