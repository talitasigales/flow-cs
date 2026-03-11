import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Encounter4FormProps {
  data: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
}

const PRESSURE_TYPES = [
  { key: 'familiar', label: 'Pressão 1 (Familiar)', icon: '👨‍👩‍👦' },
  { key: 'social', label: 'Pressão 2 (Social)', icon: '👥' },
  { key: 'financial', label: 'Pressão 3 (Financeira/Tempo)', icon: '💰' },
];

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
      {/* Family conversation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">💬 Parte 1: Conversa com a Família</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Como foi apresentar seu plano para a família?</Label>
            <Textarea value={form.familyReaction || ''} onChange={e => update('familyReaction', e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label>Eles apoiaram? Tiveram resistências?</Label>
            <Textarea value={form.familySupport || ''} onChange={e => update('familySupport', e.target.value)} className="mt-1" />
          </div>
        </CardContent>
      </Card>

      {/* Pressures */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">😤 Parte 2: Mapeamento de Pressões</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {PRESSURE_TYPES.map(p => (
            <div key={p.key} className="rounded-lg border p-4 space-y-2">
              <h4 className="font-semibold text-sm">{p.icon} {p.label}</h4>
              <div>
                <Label>Descrição</Label>
                <Input value={form[`pressure_${p.key}_desc`] || ''} onChange={e => update(`pressure_${p.key}_desc`, e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Como isso me afeta?</Label>
                <Input value={form[`pressure_${p.key}_effect`] || ''} onChange={e => update(`pressure_${p.key}_effect`, e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>O que EU posso controlar?</Label>
                <Input value={form[`pressure_${p.key}_control`] || ''} onChange={e => update(`pressure_${p.key}_control`, e.target.value)} className="mt-1" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Fears */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">😰 Meus 3 Maiores Medos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[0, 1, 2].map(i => (
            <Input key={i} value={form[`fear_${i}`] || ''} onChange={e => update(`fear_${i}`, e.target.value)} placeholder={`Medo ${i + 1}`} />
          ))}
        </CardContent>
      </Card>

      {/* Cognitive restructuring */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">🧠 Parte 3: Reestruturação Cognitiva</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>💭 Pensamento sabotador (aquela voz negativa na sua cabeça)</Label>
            <Textarea value={form.saboteurThought || ''} onChange={e => update('saboteurThought', e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label>É verdade isso? Tem evidência real?</Label>
            <Textarea value={form.challengeThought || ''} onChange={e => update('challengeThought', e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label>💡 Pensamento alternativo (mais realista)</Label>
            <Textarea value={form.alternativeThought || ''} onChange={e => update('alternativeThought', e.target.value)} className="mt-1" />
          </div>
        </CardContent>
      </Card>

      {/* Tools */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">🛠️ Parte 4: Ferramentas de Regulação Emocional</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Respiração 4-7-8: Vou praticar ____ vezes por semana</Label>
            <Input type="number" value={form.breathingFrequency || ''} onChange={e => update('breathingFrequency', e.target.value)} className="mt-1 w-24" />
          </div>
          <div>
            <Label>🤝 Rede de Apoio (quem pode me ajudar?)</Label>
            {[0, 1, 2].map(i => (
              <Input key={i} value={form[`support_${i}`] || ''} onChange={e => update(`support_${i}`, e.target.value)} placeholder={`Pessoa ${i + 1}`} className="mt-1" />
            ))}
          </div>
          <div>
            <Label>✨ Frase Motivacional (para ler quando bater o medo)</Label>
            <Input value={form.motivationalPhrase || ''} onChange={e => update('motivationalPhrase', e.target.value)} className="mt-1 text-lg font-medium" placeholder="Sua frase de força..." />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
