import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface Encounter4FormProps {
  data: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
}

const PRESSURE_TYPES = [
  { key: 'familiar', label: 'Pressão Familiar', icon: '👨‍👩‍👦', color: 'from-violet-500/20 border-violet-500/20' },
  { key: 'social', label: 'Pressão Social', icon: '👥', color: 'from-cyan-500/20 border-cyan-500/20' },
  { key: 'financial', label: 'Pressão Financeira/Tempo', icon: '💰', color: 'from-amber-500/20 border-amber-500/20' },
];

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

const inputClass = "bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-rose-400/50 focus:ring-rose-400/20";

export function Encounter4Form({ data, onChange }: Encounter4FormProps) {
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
      <GameCard title="Conversa com a Família" emoji="💬">
        <div>
          <FieldLabel>Como foi apresentar seu plano para a família?</FieldLabel>
          <Textarea value={form.familyReaction || ''} onChange={e => update('familyReaction', e.target.value)} className={inputClass} />
        </div>
        <div>
          <FieldLabel>Eles apoiaram? Tiveram resistências?</FieldLabel>
          <Textarea value={form.familySupport || ''} onChange={e => update('familySupport', e.target.value)} className={inputClass} />
        </div>
      </GameCard>

      <GameCard title="Mapeamento de Pressões" emoji="😤">
        {PRESSURE_TYPES.map(p => (
          <div key={p.key} className={`rounded-xl bg-gradient-to-r ${p.color} to-transparent border p-4 space-y-3`}>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span>{p.icon}</span> {p.label}
            </h4>
            <div>
              <FieldLabel>Descrição</FieldLabel>
              <Input value={form[`pressure_${p.key}_desc`] || ''} onChange={e => update(`pressure_${p.key}_desc`, e.target.value)} className={inputClass} />
            </div>
            <div>
              <FieldLabel>Como isso me afeta?</FieldLabel>
              <Input value={form[`pressure_${p.key}_effect`] || ''} onChange={e => update(`pressure_${p.key}_effect`, e.target.value)} className={inputClass} />
            </div>
            <div>
              <FieldLabel>O que EU posso controlar?</FieldLabel>
              <Input value={form[`pressure_${p.key}_control`] || ''} onChange={e => update(`pressure_${p.key}_control`, e.target.value)} className={inputClass} />
            </div>
          </div>
        ))}
      </GameCard>

      <GameCard title="Meus 3 Maiores Medos" emoji="😰">
        {[0, 1, 2].map(i => (
          <Input key={i} value={form[`fear_${i}`] || ''} onChange={e => update(`fear_${i}`, e.target.value)}
            placeholder={`Medo ${i + 1}`} className={inputClass} />
        ))}
      </GameCard>

      <GameCard title="Reestruturação Cognitiva" emoji="🧠">
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-4">
          <FieldLabel>💭 Pensamento sabotador</FieldLabel>
          <Textarea value={form.saboteurThought || ''} onChange={e => update('saboteurThought', e.target.value)}
            placeholder="Aquela voz negativa na sua cabeça..." className={inputClass} />
        </div>
        <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4">
          <FieldLabel>🔍 É verdade isso? Tem evidência real?</FieldLabel>
          <Textarea value={form.challengeThought || ''} onChange={e => update('challengeThought', e.target.value)} className={inputClass} />
        </div>
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4">
          <FieldLabel>💡 Pensamento alternativo (mais realista)</FieldLabel>
          <Textarea value={form.alternativeThought || ''} onChange={e => update('alternativeThought', e.target.value)} className={inputClass} />
        </div>
      </GameCard>

      <GameCard title="Ferramentas de Regulação Emocional" emoji="🛠️">
        <div>
          <FieldLabel>🫁 Respiração 4-7-8: Vou praticar ___ vezes por semana</FieldLabel>
          <Input type="number" value={form.breathingFrequency || ''} onChange={e => update('breathingFrequency', e.target.value)} className={`${inputClass} w-24`} />
        </div>
        <div>
          <FieldLabel>🤝 Rede de Apoio (quem pode me ajudar?)</FieldLabel>
          {[0, 1, 2].map(i => (
            <Input key={i} value={form[`support_${i}`] || ''} onChange={e => update(`support_${i}`, e.target.value)}
              placeholder={`Pessoa ${i + 1}`} className={`${inputClass} mt-1.5`} />
          ))}
        </div>
        <div className="rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 p-4">
          <FieldLabel>✨ Frase Motivacional</FieldLabel>
          <Input value={form.motivationalPhrase || ''} onChange={e => update('motivationalPhrase', e.target.value)}
            className={`${inputClass} text-lg font-medium`} placeholder="Sua frase de força..." />
        </div>
      </GameCard>
    </div>
  );
}
