import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Encounter3FormProps {
  data: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
}

const ROUTES = [
  { key: 'A', label: 'Graduação Tradicional (ENEM/Vestibular)', fields: ['course', 'institution', 'duration', 'cost', 'viability'] },
  { key: 'B', label: 'Técnico + Graduação', fields: ['techCourse', 'techDuration', 'afterTech', 'cost', 'viability'] },
  { key: 'C', label: 'Graduação Alternativa (EAD/Exterior/Noturno)', fields: ['description', 'duration', 'cost', 'viability'] },
  { key: 'D', label: 'Curso Livre + Empreendedorismo', fields: ['description', 'courses', 'investment', 'viability'] },
];

const ROADMAP_YEARS = [2026, 2027, 2028, 2029, 2030, 2031, 2032];

const COMPARISON_CRITERIA = [
  'Tempo Total',
  'Custo Total',
  'Viável Financeiramente?',
  'Posso trabalhar enquanto estudo?',
  'Mercado valoriza?',
];

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
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">🗺️ Parte 1: 4 Rotas de Formação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <Label>Carreira escolhida</Label>
            <Input value={form.chosenCareer || ''} onChange={e => update('chosenCareer', e.target.value)} className="mt-1" />
          </div>
        </CardContent>
      </Card>

      {/* Route cards */}
      {ROUTES.map(route => (
        <Card key={route.key}>
          <CardHeader>
            <CardTitle className="text-base">Rota {route.key}: {route.label}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {route.fields.map(field => (
              <div key={field}>
                <Label className="capitalize">{field === 'viability' ? 'Viabilidade (1-10)' : field.replace(/([A-Z])/g, ' $1')}</Label>
                <Input
                  value={form[`route${route.key}_${field}`] || ''}
                  onChange={e => update(`route${route.key}_${field}`, e.target.value)}
                  type={field === 'viability' ? 'number' : 'text'}
                  min={field === 'viability' ? 1 : undefined}
                  max={field === 'viability' ? 10 : undefined}
                  className="mt-1"
                />
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {/* Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">📊 Comparativo das 4 Rotas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border">
              <thead>
                <tr className="bg-muted/50">
                  <th className="border p-2 text-left">Critério</th>
                  {['A', 'B', 'C', 'D'].map(r => (
                    <th key={r} className="border p-2 text-center">Rota {r}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARISON_CRITERIA.map(crit => (
                  <tr key={crit}>
                    <td className="border p-2 font-medium">{crit}</td>
                    {['A', 'B', 'C', 'D'].map(r => (
                      <td key={r} className="border p-2">
                        <Input
                          value={form[`comp_${crit}_${r}`] || ''}
                          onChange={e => update(`comp_${crit}_${r}`, e.target.value)}
                          className="h-8"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Chosen route */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg">🎯 Rota Escolhida</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <Label>Rota escolhida</Label>
            <Input value={form.chosenRoute || ''} onChange={e => update('chosenRoute', e.target.value)} className="mt-1" placeholder="Rota A, B, C ou D" />
          </div>
          <div>
            <Label>Por quê?</Label>
            <Textarea value={form.chosenRouteWhy || ''} onChange={e => update('chosenRouteWhy', e.target.value)} className="mt-1" />
          </div>
        </CardContent>
      </Card>

      {/* Roadmap */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">🗓️ Parte 2: Roadmap até os 25 anos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <Label>Minha idade hoje</Label>
            <Input type="number" value={form.currentAge || ''} onChange={e => update('currentAge', e.target.value)} className="mt-1 w-24" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border">
              <thead>
                <tr className="bg-muted/50">
                  <th className="border p-2">Idade</th>
                  <th className="border p-2">Ano</th>
                  <th className="border p-2">O que vou fazer?</th>
                </tr>
              </thead>
              <tbody>
                {ROADMAP_YEARS.map((year, i) => {
                  const age = form.currentAge ? Number(form.currentAge) + i : '';
                  return (
                    <tr key={year}>
                      <td className="border p-2 text-center w-16">{age}</td>
                      <td className="border p-2 text-center w-16">{year}</td>
                      <td className="border p-2">
                        <Input
                          value={form[`roadmap_${year}`] || ''}
                          onChange={e => update(`roadmap_${year}`, e.target.value)}
                          className="h-8"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Plan B */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">🔄 Meu Plano B</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={form.planB || ''}
            onChange={e => update('planB', e.target.value)}
            placeholder="Se a rota principal não der certo, o que eu faço?"
            rows={3}
          />
        </CardContent>
      </Card>
    </div>
  );
}
