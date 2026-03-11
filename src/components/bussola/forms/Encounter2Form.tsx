import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

interface Encounter2FormProps {
  data: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
}

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
    const comps = [...(form.competencies || Array(10).fill({ name: '', current: 0, needed: 0, priority: '' }))];
    comps[index] = { ...comps[index], [field]: value };
    // Calculate gap
    if (field === 'current' || field === 'needed') {
      comps[index].gap = (comps[index].needed || 0) - (comps[index].current || 0);
    }
    update('competencies', comps);
  };

  const competencies = form.competencies || Array(10).fill(null).map(() => ({ name: '', current: 0, needed: 0, gap: 0, priority: '' }));

  return (
    <div className="space-y-6">
      {/* Interview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">🎤 Parte 1: Entrevista com Profissional</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Nome do profissional</Label>
            <Input value={form.interviewName || ''} onChange={e => update('interviewName', e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label>Profissão</Label>
            <Input value={form.interviewProfession || ''} onChange={e => update('interviewProfession', e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label>Principal aprendizado</Label>
            <Textarea value={form.interviewLearning || ''} onChange={e => update('interviewLearning', e.target.value)} className="mt-1" />
          </div>
        </CardContent>
      </Card>

      {/* Gap Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">📊 Parte 2: Gap Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Carreira escolhida</Label>
            <Input value={form.chosenCareer || ''} onChange={e => update('chosenCareer', e.target.value)} className="mt-1" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border">
              <thead>
                <tr className="bg-muted/50">
                  <th className="border p-2 text-left">#</th>
                  <th className="border p-2 text-left">Competência</th>
                  <th className="border p-2 text-center">Atual</th>
                  <th className="border p-2 text-center">Necessário</th>
                  <th className="border p-2 text-center">GAP</th>
                  <th className="border p-2 text-center">Prioridade</th>
                </tr>
              </thead>
              <tbody>
                {competencies.map((comp: any, i: number) => (
                  <tr key={i}>
                    <td className="border p-2 text-center text-muted-foreground">{i + 1}</td>
                    <td className="border p-2">
                      <Input
                        value={comp.name || ''}
                        onChange={e => updateCompetency(i, 'name', e.target.value)}
                        placeholder={`Competência ${i + 1}`}
                        className="h-8"
                      />
                    </td>
                    <td className="border p-2 w-20">
                      <Input
                        type="number" min={0} max={10}
                        value={comp.current || 0}
                        onChange={e => updateCompetency(i, 'current', Number(e.target.value))}
                        className="h-8 text-center"
                      />
                    </td>
                    <td className="border p-2 w-20">
                      <Input
                        type="number" min={0} max={10}
                        value={comp.needed || 0}
                        onChange={e => updateCompetency(i, 'needed', Number(e.target.value))}
                        className="h-8 text-center"
                      />
                    </td>
                    <td className="border p-2 text-center font-bold w-16">
                      <span className={comp.gap > 3 ? 'text-destructive' : comp.gap > 0 ? 'text-amber-600' : 'text-green-600'}>
                        {comp.gap || 0}
                      </span>
                    </td>
                    <td className="border p-2 w-24">
                      <Select value={comp.priority || ''} onValueChange={v => updateCompetency(i, 'priority', v)}>
                        <SelectTrigger className="h-8"><SelectValue placeholder="-" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A">A (Alta)</SelectItem>
                          <SelectItem value="M">M (Média)</SelectItem>
                          <SelectItem value="B">B (Baixa)</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <Label>🎯 Top 3 Gaps Prioritários</Label>
            {[0, 1, 2].map(i => (
              <Input key={i} value={form[`topGap_${i}`] || ''} onChange={e => update(`topGap_${i}`, e.target.value)} placeholder={`Gap ${i + 1}`} className="mt-1" />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Development Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">📋 Parte 3: Plano de Desenvolvimento (90 dias)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map(gap => (
            <div key={gap} className="rounded-lg border p-4 space-y-2">
              <h4 className="font-semibold text-sm">Gap {gap}: {form[`topGap_${gap - 1}`] || '...'}</h4>
              <div>
                <Label>Como desenvolver?</Label>
                <Input value={form[`gap${gap}_how`] || ''} onChange={e => update(`gap${gap}_how`, e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Onde?</Label>
                <Input value={form[`gap${gap}_where`] || ''} onChange={e => update(`gap${gap}_where`, e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Até quando?</Label>
                <Input value={form[`gap${gap}_when`] || ''} onChange={e => update(`gap${gap}_when`, e.target.value)} className="mt-1" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Commitment */}
      <Card className="border-primary/20">
        <CardContent className="pt-6">
          <p className="text-sm text-center">
            ✍️ Eu me comprometo a dedicar e desenvolver essas 3 competências nos próximos 90 dias.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
