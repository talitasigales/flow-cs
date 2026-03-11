import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { DecisionMatrix } from '@/components/bussola/DecisionMatrix';

interface Encounter1FormProps {
  data: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
}

const INTELLIGENCES = [
  { key: 'linguistic', label: 'Linguística (ler, escrever, comunicar)' },
  { key: 'logical', label: 'Lógico-matemática (números, análise, raciocínio)' },
  { key: 'spatial', label: 'Espacial (design, arquitetura, criatividade visual)' },
  { key: 'kinesthetic', label: 'Corporal-cinestésica (movimentos, esportes, habilidades manuais)' },
  { key: 'musical', label: 'Musical (ritmo, sons, instrumentos)' },
  { key: 'interpersonal', label: 'Interpessoal (entender pessoas, trabalhar em equipe)' },
  { key: 'intrapersonal', label: 'Intrapessoal (autoconhecimento, reflexão)' },
  { key: 'naturalist', label: 'Naturalista (natureza, animais, meio ambiente)' },
];

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
      {/* Part 1: TOV Results */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">🧭 Parte 1: Resultados do meu TOV</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>✨ Meus pontos fortes</Label>
            {[0, 1, 2].map(i => (
              <Input
                key={i}
                value={form[`strength_${i}`] || ''}
                onChange={e => update(`strength_${i}`, e.target.value)}
                placeholder={`Ponto forte ${i + 1}`}
                className="mt-1"
              />
            ))}
          </div>

          <div>
            <Label>🔧 Áreas para desenvolver</Label>
            {[0, 1].map(i => (
              <Input
                key={i}
                value={form[`develop_${i}`] || ''}
                onChange={e => update(`develop_${i}`, e.target.value)}
                placeholder={`Área para desenvolver ${i + 1}`}
                className="mt-1"
              />
            ))}
          </div>

          <div>
            <Label className="mb-2 block">🧠 Inteligências Múltiplas (marque as 3 principais)</Label>
            <div className="space-y-2">
              {INTELLIGENCES.map(intel => (
                <div key={intel.key} className="flex items-center space-x-2">
                  <Checkbox
                    id={intel.key}
                    checked={form.intelligences?.[intel.key] || false}
                    onCheckedChange={checked => updateIntelligence(intel.key, !!checked)}
                  />
                  <label htmlFor={intel.key} className="text-sm cursor-pointer">{intel.label}</label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label>📌 Áreas de interesse (Top 3)</Label>
            {[0, 1, 2].map(i => (
              <Input
                key={i}
                value={form[`interest_${i}`] || ''}
                onChange={e => update(`interest_${i}`, e.target.value)}
                placeholder={`${i + 1}º interesse`}
                className="mt-1"
              />
            ))}
          </div>

          <div>
            <Label>💼 Carreiras sugeridas pelo TOV (5 opções)</Label>
            {[0, 1, 2, 3, 4].map(i => (
              <Input
                key={i}
                value={form[`career_suggestion_${i}`] || ''}
                onChange={e => update(`career_suggestion_${i}`, e.target.value)}
                placeholder={`Carreira ${i + 1}`}
                className="mt-1"
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Part 2: Decision Matrix */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">📊 Parte 2: Matriz de Decisão</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Avalie as 3 carreiras usando critérios que importam pra VOCÊ. As pontuações são calculadas automaticamente.
          </p>
          <DecisionMatrix
            value={form.decisionMatrix}
            onChange={val => update('decisionMatrix', val)}
          />
        </CardContent>
      </Card>

      {/* Reflection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">💭 Reflexão</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>O resultado faz sentido para você?</Label>
            <Textarea
              value={form.reflection_makes_sense || ''}
              onChange={e => update('reflection_makes_sense', e.target.value)}
              placeholder="Escreva sua reflexão..."
              className="mt-1"
            />
          </div>
          <div>
            <Label>Você escolhe a 1ª colocada como SUA carreira?</Label>
            <Textarea
              value={form.reflection_choice || ''}
              onChange={e => update('reflection_choice', e.target.value)}
              placeholder="Sim/Não e por quê..."
              className="mt-1"
            />
          </div>
          <div>
            <Label>Pesquisa sobre a carreira escolhida</Label>
            <Textarea
              value={form.career_research || ''}
              onChange={e => update('career_research', e.target.value)}
              placeholder="O que faz no dia a dia? Tempo de formação? Salário médio? O que mais gostou?"
              rows={4}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
