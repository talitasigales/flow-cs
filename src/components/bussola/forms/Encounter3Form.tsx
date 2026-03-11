import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface Encounter3FormProps {
  data: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
}

const ROUTES = [
  { key: 'A', label: 'Graduação Tradicional (ENEM/Vestibular)', emoji: '🎓', color: 'from-violet-500/20 to-violet-500/5 border-violet-500/20', fields: ['course', 'institution', 'duration', 'cost', 'viability'] },
  { key: 'B', label: 'Técnico + Graduação', emoji: '🔧', color: 'from-cyan-500/20 to-cyan-500/5 border-cyan-500/20', fields: ['techCourse', 'techDuration', 'afterTech', 'cost', 'viability'] },
  { key: 'C', label: 'Graduação Alternativa (EAD/Exterior)', emoji: '🌍', color: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/20', fields: ['description', 'duration', 'cost', 'viability'] },
  { key: 'D', label: 'Curso Livre + Empreendedorismo', emoji: '🚀', color: 'from-amber-500/20 to-amber-500/5 border-amber-500/20', fields: ['description', 'courses', 'investment', 'viability'] },
];

const ROADMAP_YEARS = [2026, 2027, 2028, 2029, 2030, 2031, 2032];
const COMPARISON_CRITERIA = ['Tempo Total', 'Custo Total', 'Viável Financeiramente?', 'Posso trabalhar enquanto estudo?', 'Mercado valoriza?'];

function GameCard({ title, emoji, children }: { title: string; emoji: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
      <div className="px-5 py-4 border-b border-white/5">
        <h3 className="text-base font-bold text-white flex items-center gap-2"><span>{emoji}</span> {title}</h3>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-xs font-semibold text-white/50 uppercase tracking-wider block mb-1.5">{children}</label>;
}

const inputClass = "bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-emerald-400/50 focus:ring-emerald-400/20";

export function Encounter3Form({ data, onChange }: Encounter3FormProps) {
  const [form, setForm] = useState<Record<string, any>>(data || {});

  useEffect(() => {
    if (data && Object.keys(data).length > 0) setForm(data);
  }, []);

  const update = (key: string, value: any) => {
    const next = { ...form, [key]: value };
    setForm(next);
    onChange(next);
  };

  return (
    <div className="space-y-6">
      <GameCard title="4 Rotas de Formação" emoji="🗺️">
        <div>
          <FieldLabel>Carreira escolhida</FieldLabel>
          <Input value={form.chosenCareer || ''} onChange={e => update('chosenCareer', e.target.value)} className={inputClass} />
        </div>
      </GameCard>

      {ROUTES.map(route => (
        <div key={route.key} className={`rounded-2xl bg-gradient-to-br ${route.color} border p-5 space-y-3`}>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>{route.emoji}</span> Rota {route.key}: {route.label}
          </h3>
          {route.fields.map(field => (
            <div key={field}>
              <FieldLabel>{field === 'viability' ? 'Viabilidade (1-10)' : field.replace(/([A-Z])/g, ' $1')}</FieldLabel>
              <Input value={form[`route${route.key}_${field}`] || ''} onChange={e => update(`route${route.key}_${field}`, e.target.value)}
                type={field === 'viability' ? 'number' : 'text'} min={field === 'viability' ? 1 : undefined}
                max={field === 'viability' ? 10 : undefined} className={inputClass} />
            </div>
          ))}
        </div>
      ))}

      <GameCard title="Comparativo das 4 Rotas" emoji="📊">
        <div className="space-y-3">
          {COMPARISON_CRITERIA.map(crit => (
            <div key={crit} className="rounded-xl bg-white/[0.02] border border-white/5 p-3">
              <span className="text-xs font-bold text-white/50 block mb-2">{crit}</span>
              <div className="grid grid-cols-4 gap-2">
                {['A', 'B', 'C', 'D'].map(r => (
                  <div key={r}>
                    <span className="text-[10px] text-white/30 block mb-1">Rota {r}</span>
                    <Input value={form[`comp_${crit}_${r}`] || ''} onChange={e => update(`comp_${crit}_${r}`, e.target.value)}
                      className={`${inputClass} h-8 text-sm`} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </GameCard>

      <div className="rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 p-5 space-y-3">
        <h3 className="text-base font-bold text-white flex items-center gap-2">🎯 Rota Escolhida</h3>
        <div>
          <FieldLabel>Rota escolhida</FieldLabel>
          <Input value={form.chosenRoute || ''} onChange={e => update('chosenRoute', e.target.value)} className={inputClass} placeholder="A, B, C ou D" />
        </div>
        <div>
          <FieldLabel>Por quê?</FieldLabel>
          <Textarea value={form.chosenRouteWhy || ''} onChange={e => update('chosenRouteWhy', e.target.value)} className={inputClass} />
        </div>
      </div>

      <GameCard title="Roadmap até os 25 anos" emoji="🗓️">
        <div>
          <FieldLabel>Minha idade hoje</FieldLabel>
          <Input type="number" value={form.currentAge || ''} onChange={e => update('currentAge', e.target.value)} className={`${inputClass} w-24`} />
        </div>
        <div className="space-y-2">
          {ROADMAP_YEARS.map((year, i) => {
            const age = form.currentAge ? Number(form.currentAge) + i : '';
            return (
              <div key={year} className="flex items-center gap-3 rounded-xl bg-white/[0.02] border border-white/5 p-3">
                <div className="flex items-center gap-2 min-w-[80px]">
                  <span className="text-xs font-bold text-emerald-400">{age || '?'}</span>
                  <span className="text-xs text-white/30">|</span>
                  <span className="text-xs text-white/50">{year}</span>
                </div>
                <Input value={form[`roadmap_${year}`] || ''} onChange={e => update(`roadmap_${year}`, e.target.value)}
                  className={`${inputClass} h-8 text-sm flex-1`} placeholder="O que vou fazer?" />
              </div>
            );
          })}
        </div>
      </GameCard>

      <GameCard title="Meu Plano B" emoji="🔄">
        <Textarea value={form.planB || ''} onChange={e => update('planB', e.target.value)}
          placeholder="Se a rota principal não der certo, o que eu faço?" rows={3} className={inputClass} />
      </GameCard>
    </div>
  );
}
