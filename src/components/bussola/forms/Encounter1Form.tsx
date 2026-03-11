import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { DecisionMatrix } from '@/components/bussola/DecisionMatrix';

interface Encounter1FormProps {
  data: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
}

const INTELLIGENCES = [
  { key: 'linguistic', label: 'Linguística (ler, escrever, comunicar)', emoji: '📝' },
  { key: 'logical', label: 'Lógico-matemática (números, análise)', emoji: '🧮' },
  { key: 'spatial', label: 'Espacial (design, arquitetura, criatividade visual)', emoji: '🎨' },
  { key: 'kinesthetic', label: 'Corporal-cinestésica (movimentos, esportes)', emoji: '🏃' },
  { key: 'musical', label: 'Musical (ritmo, sons, instrumentos)', emoji: '🎵' },
  { key: 'interpersonal', label: 'Interpessoal (entender pessoas, equipe)', emoji: '🤝' },
  { key: 'intrapersonal', label: 'Intrapessoal (autoconhecimento, reflexão)', emoji: '🧘' },
  { key: 'naturalist', label: 'Naturalista (natureza, animais, meio ambiente)', emoji: '🌿' },
];

function GameCard({ title, emoji, children }: { title: string; emoji: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
      <div className="px-5 py-4 border-b border-white/5">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <span>{emoji}</span> {title}
        </h3>
      </div>
      <div className="p-5 space-y-4">
        {children}
      </div>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-xs font-semibold text-white/50 uppercase tracking-wider block mb-1.5">{children}</label>;
}

const inputClass = "bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-purple-400/50 focus:ring-purple-400/20";

export function Encounter1Form({ data, onChange }: Encounter1FormProps) {
  const [form, setForm] = useState<Record<string, any>>(data || {});

  useEffect(() => {
    if (data && Object.keys(data).length > 0) setForm(data);
  }, []);

  const update = (key: string, value: any) => {
    const next = { ...form, [key]: value };
    setForm(next);
    onChange(next);
  };

  const updateIntelligence = (key: string, checked: boolean) => {
    const current = form.intelligences || {};
    const next = { ...form, intelligences: { ...current, [key]: checked } };
    setForm(next);
    onChange(next);
  };

  return (
    <div className="space-y-6">
      <GameCard title="Resultados do meu TOV" emoji="🧭">
        <div>
          <FieldLabel>✨ Meus pontos fortes</FieldLabel>
          {[0, 1, 2].map(i => (
            <Input key={i} value={form[`strength_${i}`] || ''} onChange={e => update(`strength_${i}`, e.target.value)}
              placeholder={`Ponto forte ${i + 1}`} className={`${inputClass} mt-1.5`} />
          ))}
        </div>
        <div>
          <FieldLabel>🔧 Áreas para desenvolver</FieldLabel>
          {[0, 1].map(i => (
            <Input key={i} value={form[`develop_${i}`] || ''} onChange={e => update(`develop_${i}`, e.target.value)}
              placeholder={`Área ${i + 1}`} className={`${inputClass} mt-1.5`} />
          ))}
        </div>
        <div>
          <FieldLabel>🧠 Inteligências Múltiplas (marque as 3 principais)</FieldLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
            {INTELLIGENCES.map(intel => {
              const checked = form.intelligences?.[intel.key] || false;
              return (
                <button
                  key={intel.key}
                  type="button"
                  onClick={() => updateIntelligence(intel.key, !checked)}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition-all ${
                    checked
                      ? 'bg-purple-500/20 border border-purple-500/30 text-purple-200'
                      : 'bg-white/[0.02] border border-white/5 text-white/50 hover:bg-white/5'
                  }`}
                >
                  <span>{intel.emoji}</span>
                  <span className="text-xs">{intel.label}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <FieldLabel>📌 Áreas de interesse (Top 3)</FieldLabel>
          {[0, 1, 2].map(i => (
            <Input key={i} value={form[`interest_${i}`] || ''} onChange={e => update(`interest_${i}`, e.target.value)}
              placeholder={`${i + 1}º interesse`} className={`${inputClass} mt-1.5`} />
          ))}
        </div>
        <div>
          <FieldLabel>💼 Carreiras sugeridas pelo TOV</FieldLabel>
          {[0, 1, 2, 3, 4].map(i => (
            <Input key={i} value={form[`career_suggestion_${i}`] || ''} onChange={e => update(`career_suggestion_${i}`, e.target.value)}
              placeholder={`Carreira ${i + 1}`} className={`${inputClass} mt-1.5`} />
          ))}
        </div>
      </GameCard>

      <GameCard title="Matriz de Decisão" emoji="📊">
        <p className="text-sm text-white/40">
          Avalie as 3 carreiras usando critérios que importam pra VOCÊ. As pontuações são calculadas automaticamente.
        </p>
        <DecisionMatrix value={form.decisionMatrix} onChange={val => update('decisionMatrix', val)} />
      </GameCard>

      <GameCard title="Reflexão" emoji="💭">
        <div>
          <FieldLabel>O resultado faz sentido para você?</FieldLabel>
          <Textarea value={form.reflection_makes_sense || ''} onChange={e => update('reflection_makes_sense', e.target.value)}
            placeholder="Escreva sua reflexão..." className={inputClass} />
        </div>
        <div>
          <FieldLabel>Você escolhe a 1ª colocada como SUA carreira?</FieldLabel>
          <Textarea value={form.reflection_choice || ''} onChange={e => update('reflection_choice', e.target.value)}
            placeholder="Sim/Não e por quê..." className={inputClass} />
        </div>
        <div>
          <FieldLabel>Pesquisa sobre a carreira escolhida</FieldLabel>
          <Textarea value={form.career_research || ''} onChange={e => update('career_research', e.target.value)}
            placeholder="O que faz no dia a dia? Tempo de formação? Salário médio?" rows={4} className={inputClass} />
        </div>
      </GameCard>
    </div>
  );
}
