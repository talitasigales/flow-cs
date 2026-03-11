import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Trophy } from 'lucide-react';

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
      {/* Step 1: Criteria */}
      <div>
        <h4 className="font-semibold text-sm mb-2">Passo 1: Seus Critérios e Pesos (0-10)</h4>
        <div className="space-y-2">
          {criteria.map((c, i) => (
            <div key={i} className="flex gap-2 items-center">
              <Input
                value={c.name}
                onChange={e => {
                  const next = [...criteria];
                  next[i] = { ...next[i], name: e.target.value };
                  setCriteria(next);
                }}
                placeholder={`Critério ${i + 1}`}
                className="flex-1"
              />
              <Input
                type="number"
                min={0}
                max={10}
                value={c.weight}
                onChange={e => {
                  const next = [...criteria];
                  next[i] = { ...next[i], weight: Number(e.target.value) };
                  setCriteria(next);
                }}
                className="w-20 text-center"
              />
              {criteria.length > 3 && (
                <Button variant="ghost" size="icon" onClick={() => setCriteria(criteria.filter((_, j) => j !== i))}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          ))}
          {criteria.length < 7 && (
            <Button variant="outline" size="sm" onClick={() => setCriteria([...criteria, { name: '', weight: 5 }])}>
              <Plus className="h-4 w-4 mr-1" /> Adicionar critério
            </Button>
          )}
        </div>
      </div>

      {/* Step 2: Career names */}
      <div>
        <h4 className="font-semibold text-sm mb-2">Passo 2: Nomeie suas 3 carreiras</h4>
        <div className="grid grid-cols-3 gap-2">
          {careers.map((c, i) => (
            <Input
              key={i}
              value={c}
              onChange={e => {
                const next = [...careers];
                next[i] = e.target.value;
                setCareers(next);
              }}
              placeholder={`Carreira ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Step 3: Scores table */}
      <div>
        <h4 className="font-semibold text-sm mb-2">Passo 3: Avalie cada carreira (nota 0-10)</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border">
            <thead>
              <tr className="bg-muted/50">
                <th className="border p-2 text-left">Critério</th>
                <th className="border p-2 text-center w-16">Peso</th>
                {careers.map((c, i) => (
                  <th key={i} className="border p-2 text-center min-w-[120px]">{c || `Carreira ${i + 1}`}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {criteria.map((crit, ci) => (
                <tr key={ci}>
                  <td className="border p-2 font-medium">{crit.name || `Critério ${ci + 1}`}</td>
                  <td className="border p-2 text-center text-muted-foreground">{crit.weight}</td>
                  {careers.map((_, cari) => {
                    const score = getScore(cari, ci);
                    const weighted = score * crit.weight;
                    return (
                      <td key={cari} className="border p-2">
                        <div className="flex items-center justify-center gap-1">
                          <Input
                            type="number"
                            min={0}
                            max={10}
                            value={score}
                            onChange={e => setScore(cari, ci, Number(e.target.value))}
                            className="w-14 text-center h-8"
                          />
                          <span className="text-xs text-muted-foreground">({weighted})</span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr className="bg-muted/30 font-bold">
                <td className="border p-2" colSpan={2}>TOTAL</td>
                {careers.map((_, i) => (
                  <td key={i} className={cn('border p-2 text-center text-lg', totals[i] === maxTotal && totals[i] > 0 && 'text-primary')}>
                    {totals[i]}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Ranking */}
      {totals.some(t => t > 0) && (
        <div className="rounded-lg bg-primary/5 p-4 border border-primary/20">
          <h4 className="font-semibold flex items-center gap-2 mb-2">
            <Trophy className="h-4 w-4 text-primary" /> Ranking Final
          </h4>
          <div className="space-y-1">
            {ranking.map((idx, pos) => {
              const medals = ['🥇', '🥈', '🥉'];
              return (
                <p key={idx} className="text-sm">
                  {medals[pos]} {pos + 1}º lugar: <strong>{careers[idx] || `Carreira ${idx + 1}`}</strong> — {totals[idx]} pts
                </p>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
