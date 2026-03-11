import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Criterion {
  name: string;
  weight: number;
}

interface DecisionMatrixProps {
  value?: {
    criteria: Criterion[];
    careers: string[];
    scores: Record<string, Record<string, number>>;
  };
  onChange: (val: DecisionMatrixProps['value']) => void;
}

const inputClass = "bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-purple-400/50 focus:ring-purple-400/20";

export function DecisionMatrix({ value, onChange }: DecisionMatrixProps) {
  const [criteria, setCriteria] = useState<Criterion[]>(
    value?.criteria || [
      { name: 'Salário', weight: 7 },
      { name: 'Mercado de trabalho', weight: 8 },
      { name: 'Alinhamento com valores', weight: 9 },
      { name: 'Tempo de formação', weight: 5 },
      { name: 'Equilíbrio vida-trabalho', weight: 6 },
    ]
  );
  const [careers, setCareers] = useState<string[]>(value?.careers || ['', '', '']);
  const [scores, setScores] = useState<Record<string, Record<string, number>>>(value?.scores || {});

  useEffect(() => {
    onChange({ criteria, careers, scores });
  }, [criteria, careers, scores]);

  const getScore = (careerIdx: number, critIdx: number) => scores[`c${careerIdx}`]?.[`cr${critIdx}`] || 0;
  const setScore = (careerIdx: number, critIdx: number, val: number) => {
    setScores(prev => ({
      ...prev,
      [`c${careerIdx}`]: { ...prev[`c${careerIdx}`], [`cr${critIdx}`]: Math.min(10, Math.max(0, val)) },
    }));
  };

  const getTotal = (careerIdx: number) =>
    criteria.reduce((sum, crit, critIdx) => sum + getScore(careerIdx, critIdx) * crit.weight, 0);

  const totals = careers.map((_, i) => getTotal(i));
  const maxTotal = Math.max(...totals);
  const ranking = [...careers.keys()].sort((a, b) => totals[b] - totals[a]);

  return (
    <div className="space-y-6">
      {/* Criteria */}
      <div>
        <h4 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-3">Passo 1: Seus Critérios e Pesos (0-10)</h4>
        <div className="space-y-2">
          {criteria.map((c, i) => (
            <div key={i} className="flex gap-2 items-center">
              <Input value={c.name} onChange={e => {
                const next = [...criteria]; next[i] = { ...next[i], name: e.target.value }; setCriteria(next);
              }} placeholder={`Critério ${i + 1}`} className={`${inputClass} flex-1`} />
              <Input type="number" min={0} max={10} value={c.weight} onChange={e => {
                const next = [...criteria]; next[i] = { ...next[i], weight: Number(e.target.value) }; setCriteria(next);
              }} className={`${inputClass} w-20 text-center`} />
              {criteria.length > 3 && (
                <Button variant="ghost" size="icon" onClick={() => setCriteria(criteria.filter((_, j) => j !== i))} className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10">
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          {criteria.length < 7 && (
            <Button variant="outline" size="sm" onClick={() => setCriteria([...criteria, { name: '', weight: 5 }])}
              className="bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white">
              <Plus className="h-4 w-4 mr-1" /> Adicionar critério
            </Button>
          )}
        </div>
      </div>

      {/* Career names */}
      <div>
        <h4 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-3">Passo 2: Suas 3 carreiras</h4>
        <div className="grid grid-cols-3 gap-2">
          {careers.map((c, i) => (
            <Input key={i} value={c} onChange={e => {
              const next = [...careers]; next[i] = e.target.value; setCareers(next);
            }} placeholder={`Carreira ${i + 1}`} className={inputClass} />
          ))}
        </div>
      </div>

      {/* Scores */}
      <div>
        <h4 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-3">Passo 3: Avalie cada carreira (0-10)</h4>
        <div className="space-y-2">
          {criteria.map((crit, ci) => (
            <div key={ci} className="rounded-xl bg-white/[0.02] border border-white/5 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-white/60">{crit.name || `Critério ${ci + 1}`}</span>
                <span className="text-[10px] text-white/30">peso: {crit.weight}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {careers.map((car, cari) => (
                  <div key={cari} className="flex items-center gap-1">
                    <Input type="number" min={0} max={10} value={getScore(cari, ci)}
                      onChange={e => setScore(cari, ci, Number(e.target.value))}
                      className={`${inputClass} w-14 text-center h-8 text-sm`} />
                    <span className="text-[10px] text-white/20">= {getScore(cari, ci) * crit.weight}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          {careers.map((c, i) => (
            <div key={i} className={cn(
              'rounded-xl p-3 text-center',
              totals[i] === maxTotal && totals[i] > 0 ? 'bg-purple-500/20 border border-purple-500/30' : 'bg-white/5 border border-white/5'
            )}>
              <span className="text-[10px] text-white/40 block">{c || `Carreira ${i + 1}`}</span>
              <span className={cn('text-xl font-black', totals[i] === maxTotal && totals[i] > 0 ? 'text-purple-300' : 'text-white/70')}>
                {totals[i]}
              </span>
              <span className="text-[10px] text-white/30 block">pts</span>
            </div>
          ))}
        </div>
      </div>

      {/* Ranking */}
      {totals.some(t => t > 0) && (
        <div className="rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/5 border border-amber-500/20 p-4">
          <h4 className="font-bold text-white flex items-center gap-2 mb-3">
            <Trophy className="h-4 w-4 text-amber-400" /> Ranking Final
          </h4>
          <div className="space-y-2">
            {ranking.map((idx, pos) => {
              const medals = ['🥇', '🥈', '🥉'];
              return (
                <div key={idx} className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2',
                  pos === 0 ? 'bg-amber-500/10' : 'bg-white/[0.02]'
                )}>
                  <span className="text-lg">{medals[pos]}</span>
                  <div>
                    <span className={cn('text-sm font-bold', pos === 0 ? 'text-amber-300' : 'text-white/60')}>
                      {careers[idx] || `Carreira ${idx + 1}`}
                    </span>
                    <span className="text-xs text-white/30 ml-2">{totals[idx]} pts</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
