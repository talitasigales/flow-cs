import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Encounter2FormProps {
  data: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
}

function GameCard({ title, emoji, children }: { title: string; emoji: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
      <div className="px-5 py-4 border-b border-white/5">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <span>{emoji}</span> {title}
        </h3>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-xs font-semibold text-white/50 uppercase tracking-wider block mb-1.5">{children}</label>;
}

const inputClass = "bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-cyan-400/50 focus:ring-cyan-400/20";

export function Encounter2Form({ data, onChange }: Encounter2FormProps) {
  const [form, setForm] = useState<Record<string, any>>(data || {});

  useEffect(() => {
    if (data && Object.keys(data).length > 0) setForm(data);
  }, []);

  const update = (key: string, value: any) => {
    const next = { ...form, [key]: value };
    setForm(next);
    onChange(next);
  };

  const updateCompetency = (index: number, field: string, value: any) => {
    const comps = [...(form.competencies || Array(10).fill(null).map(() => ({ name: '', current: 0, needed: 0, gap: 0, priority: '' })))];
    comps[index] = { ...comps[index], [field]: value };
    if (field === 'current' || field === 'needed') {
      comps[index].gap = (comps[index].needed || 0) - (comps[index].current || 0);
    }
    update('competencies', comps);
  };

  const competencies = form.competencies || Array(10).fill(null).map(() => ({ name: '', current: 0, needed: 0, gap: 0, priority: '' }));

  return (
    <div className="space-y-6">
      <GameCard title="Entrevista com Profissional" emoji="🎤">
        <div>
          <FieldLabel>Nome do profissional</FieldLabel>
          <Input value={form.interviewName || ''} onChange={e => update('interviewName', e.target.value)} className={inputClass} />
        </div>
        <div>
          <FieldLabel>Profissão</FieldLabel>
          <Input value={form.interviewProfession || ''} onChange={e => update('interviewProfession', e.target.value)} className={inputClass} />
        </div>
        <div>
          <FieldLabel>Principal aprendizado</FieldLabel>
          <Textarea value={form.interviewLearning || ''} onChange={e => update('interviewLearning', e.target.value)} className={inputClass} />
        </div>
      </GameCard>

      <GameCard title="Gap Analysis" emoji="📊">
        <div>
          <FieldLabel>Carreira escolhida</FieldLabel>
          <Input value={form.chosenCareer || ''} onChange={e => update('chosenCareer', e.target.value)} className={inputClass} />
        </div>

        <div className="space-y-3">
          {competencies.map((comp: any, i: number) => (
            <div key={i} className="rounded-xl bg-white/[0.02] border border-white/5 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white/30 min-w-[24px]">{i + 1}.</span>
                <Input value={comp.name || ''} onChange={e => updateCompetency(i, 'name', e.target.value)}
                  placeholder={`Competência ${i + 1}`} className={`${inputClass} h-8 text-sm`} />
              </div>
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <span className="text-[10px] text-white/30 block mb-1">Atual</span>
                  <Input type="number" min={0} max={10} value={comp.current || 0}
                    onChange={e => updateCompetency(i, 'current', Number(e.target.value))}
                    className={`${inputClass} h-8 text-center text-sm`} />
                </div>
                <div>
                  <span className="text-[10px] text-white/30 block mb-1">Necessário</span>
                  <Input type="number" min={0} max={10} value={comp.needed || 0}
                    onChange={e => updateCompetency(i, 'needed', Number(e.target.value))}
                    className={`${inputClass} h-8 text-center text-sm`} />
                </div>
                <div>
                  <span className="text-[10px] text-white/30 block mb-1">GAP</span>
                  <div className={`h-8 rounded-md flex items-center justify-center text-sm font-bold ${
                    comp.gap > 3 ? 'bg-rose-500/20 text-rose-400' : comp.gap > 0 ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {comp.gap || 0}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-white/30 block mb-1">Prioridade</span>
                  <Select value={comp.priority || ''} onValueChange={v => updateCompetency(i, 'priority', v)}>
                    <SelectTrigger className={`${inputClass} h-8 text-sm`}><SelectValue placeholder="-" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">🔴 Alta</SelectItem>
                      <SelectItem value="M">🟡 Média</SelectItem>
                      <SelectItem value="B">🟢 Baixa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div>
          <FieldLabel>🎯 Top 3 Gaps Prioritários</FieldLabel>
          {[0, 1, 2].map(i => (
            <Input key={i} value={form[`topGap_${i}`] || ''} onChange={e => update(`topGap_${i}`, e.target.value)}
              placeholder={`Gap prioritário ${i + 1}`} className={`${inputClass} mt-1.5`} />
          ))}
        </div>
      </GameCard>

      <GameCard title="Plano de Desenvolvimento (90 dias)" emoji="📋">
        {[1, 2, 3].map(gap => (
          <div key={gap} className="rounded-xl bg-white/[0.03] border border-white/5 p-4 space-y-3">
            <h4 className="text-sm font-bold text-cyan-300">Gap {gap}: {form[`topGap_${gap - 1}`] || '...'}</h4>
            <div>
              <FieldLabel>Como desenvolver?</FieldLabel>
              <Input value={form[`gap${gap}_how`] || ''} onChange={e => update(`gap${gap}_how`, e.target.value)} className={inputClass} />
            </div>
            <div>
              <FieldLabel>Onde?</FieldLabel>
              <Input value={form[`gap${gap}_where`] || ''} onChange={e => update(`gap${gap}_where`, e.target.value)} className={inputClass} />
            </div>
            <div>
              <FieldLabel>Até quando?</FieldLabel>
              <Input value={form[`gap${gap}_when`] || ''} onChange={e => update(`gap${gap}_when`, e.target.value)} className={inputClass} />
            </div>
          </div>
        ))}
      </GameCard>

      <div className="rounded-2xl bg-cyan-500/10 border border-cyan-500/20 p-5 text-center">
        <p className="text-sm text-cyan-300 font-medium">
          ✍️ Eu me comprometo a desenvolver essas 3 competências nos próximos 90 dias.
        </p>
      </div>
    </div>
  );
}
