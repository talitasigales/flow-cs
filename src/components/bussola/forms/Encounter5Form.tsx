import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

interface Encounter5FormProps {
  data: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
}

const MAP_PERIODS = ['Até Mar/2026', 'Até Jun/2026', 'Até Set/2026', 'Até Dez/2026', 'Até Mar/2027', 'Até Jun/2027'];

const COMMITMENTS = [
  'Seguir o plano que construí nesses 5 encontros',
  'Rever meu plano a cada 6 meses',
  'Pedir ajuda quando precisar',
  'Confiar no meu processo (mesmo quando der medo)',
  'Lembrar que MUDAR DE IDEIA está OK',
];

function GameCard({ title, emoji, children, className = '' }: { title: string; emoji: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl bg-white/5 border border-white/10 overflow-hidden ${className}`}>
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

const inputClass = "bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-amber-400/50 focus:ring-amber-400/20";

export function Encounter5Form({ data, onChange }: Encounter5FormProps) {
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
      <GameCard title="Revisão da Jornada" emoji="🔄">
        <div>
          <FieldLabel>O que eu aprendi sobre mim nesses 5 encontros?</FieldLabel>
          <Textarea value={form.journeyLearnings || ''} onChange={e => update('journeyLearnings', e.target.value)} rows={3} className={inputClass} />
        </div>
        <div>
          <FieldLabel>O que mudou desde a Fase 1?</FieldLabel>
          <Textarea value={form.whatChanged || ''} onChange={e => update('whatChanged', e.target.value)} rows={3} className={inputClass} />
        </div>
      </GameCard>

      <GameCard title="Meu Mapa 2026-2027" emoji="🗓️">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>Carreira escolhida</FieldLabel>
            <Input value={form.finalCareer || ''} onChange={e => update('finalCareer', e.target.value)} className={inputClass} />
          </div>
          <div>
            <FieldLabel>Rota de formação</FieldLabel>
            <Input value={form.finalRoute || ''} onChange={e => update('finalRoute', e.target.value)} className={inputClass} />
          </div>
        </div>
        <div className="space-y-2">
          {MAP_PERIODS.map(period => (
            <div key={period} className="rounded-xl bg-white/[0.02] border border-white/5 p-3 space-y-2">
              <span className="text-xs font-bold text-amber-400">{period}</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-white/30 block mb-1">O que vou fazer?</span>
                  <Input value={form[`map_${period}_what`] || ''} onChange={e => update(`map_${period}_what`, e.target.value)} className={`${inputClass} h-8 text-sm`} />
                </div>
                <div>
                  <span className="text-[10px] text-white/30 block mb-1">Como medir?</span>
                  <Input value={form[`map_${period}_measure`] || ''} onChange={e => update(`map_${period}_measure`, e.target.value)} className={`${inputClass} h-8 text-sm`} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </GameCard>

      <GameCard title="3 Ações Prioritárias (90 dias)" emoji="🎯">
        {[1, 2, 3].map(i => (
          <div key={i} className="rounded-xl bg-white/[0.03] border border-white/5 p-4 space-y-3">
            <h4 className="text-sm font-bold text-amber-300">Ação {i}</h4>
            <div>
              <FieldLabel>O quê?</FieldLabel>
              <Input value={form[`action${i}_what`] || ''} onChange={e => update(`action${i}_what`, e.target.value)} className={inputClass} />
            </div>
            <div>
              <FieldLabel>Como?</FieldLabel>
              <Input value={form[`action${i}_how`] || ''} onChange={e => update(`action${i}_how`, e.target.value)} className={inputClass} />
            </div>
            <div>
              <FieldLabel>Até quando?</FieldLabel>
              <Input value={form[`action${i}_when`] || ''} onChange={e => update(`action${i}_when`, e.target.value)} className={inputClass} />
            </div>
          </div>
        ))}
      </GameCard>

      {/* Future letter */}
      <div className="rounded-2xl bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-amber-500/10 border border-purple-500/20 overflow-hidden">
        <div className="px-5 py-4 border-b border-purple-500/10">
          <h3 className="text-base font-bold text-white flex items-center gap-2">💌 Carta para o meu EU do Futuro</h3>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Data de hoje</FieldLabel>
              <Input value={new Date().toLocaleDateString('pt-BR')} readOnly className={`${inputClass} opacity-50`} />
            </div>
            <div>
              <FieldLabel>Data para ler novamente</FieldLabel>
              <Input value={form.futureReadDate || ''} onChange={e => update('futureReadDate', e.target.value)}
                className={inputClass} placeholder="Ex: março de 2031" />
            </div>
          </div>
          <div>
            <FieldLabel>Querido(a) EU do futuro...</FieldLabel>
            <Textarea
              value={form.futureLetter || ''}
              onChange={e => update('futureLetter', e.target.value)}
              className={`${inputClass} min-h-[200px] text-base leading-relaxed`}
              placeholder={`Hoje eu escolhi...\nEu espero que você esteja...\nMeu maior medo agora é...\nMeu maior sonho é...\n\nCom carinho,\n[Seu nome]`}
            />
          </div>
        </div>
      </div>

      {/* Final commitment */}
      <div className="rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 overflow-hidden">
        <div className="px-5 py-4 border-b border-emerald-500/10">
          <h3 className="text-base font-bold text-white flex items-center gap-2">✅ Meu Compromisso Final</h3>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-sm text-white/50">Eu me comprometo a:</p>
          <div className="space-y-3">
            {COMMITMENTS.map((c, i) => {
              const checked = form[`commitment_${i}`] || false;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => update(`commitment_${i}`, !checked)}
                  className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all ${
                    checked
                      ? 'bg-emerald-500/20 border border-emerald-500/30'
                      : 'bg-white/[0.02] border border-white/5 hover:bg-white/5'
                  }`}
                >
                  <div className={`h-5 w-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                    checked ? 'bg-emerald-500 border-emerald-500' : 'border-white/20'
                  }`}>
                    {checked && <span className="text-white text-xs">✓</span>}
                  </div>
                  <span className={`text-sm ${checked ? 'text-emerald-300' : 'text-white/60'}`}>{c}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-4">
            <FieldLabel>Assinatura</FieldLabel>
            <Input value={form.finalSignature || ''} onChange={e => update('finalSignature', e.target.value)}
              placeholder="Seu nome completo" className={`${inputClass} text-lg font-medium`} />
          </div>
        </div>
      </div>
    </div>
  );
}
