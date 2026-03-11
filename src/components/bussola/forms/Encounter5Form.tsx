import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

interface Encounter5FormProps {
  data: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
}

const MAP_PERIODS = [
  'Até Mar/2026', 'Até Jun/2026', 'Até Set/2026',
  'Até Dez/2026', 'Até Mar/2027', 'Até Jun/2027',
];

const COMMITMENTS = [
  'Seguir o plano que construí nesses 5 encontros',
  'Rever meu plano a cada 6 meses',
  'Pedir ajuda quando precisar',
  'Confiar no meu processo (mesmo quando der medo)',
  'Lembrar que MUDAR DE IDEIA está OK',
];

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
      {/* Journey review */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">🔄 Parte 1: Revisão da Jornada</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>O que eu aprendi sobre mim nesses 5 encontros?</Label>
            <Textarea value={form.journeyLearnings || ''} onChange={e => update('journeyLearnings', e.target.value)} className="mt-1" rows={3} />
          </div>
          <div>
            <Label>O que mudou desde o Encontro 1?</Label>
            <Textarea value={form.whatChanged || ''} onChange={e => update('whatChanged', e.target.value)} className="mt-1" rows={3} />
          </div>
        </CardContent>
      </Card>

      {/* Map 2026-2027 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">🗓️ Parte 2: Meu Mapa 2026-2027</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Carreira escolhida</Label>
              <Input value={form.finalCareer || ''} onChange={e => update('finalCareer', e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Rota de formação</Label>
              <Input value={form.finalRoute || ''} onChange={e => update('finalRoute', e.target.value)} className="mt-1" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border">
              <thead>
                <tr className="bg-muted/50">
                  <th className="border p-2 text-left">Quando?</th>
                  <th className="border p-2 text-left">O que vou fazer?</th>
                  <th className="border p-2 text-left">Como medir progresso?</th>
                </tr>
              </thead>
              <tbody>
                {MAP_PERIODS.map(period => (
                  <tr key={period}>
                    <td className="border p-2 font-medium whitespace-nowrap">{period}</td>
                    <td className="border p-2">
                      <Input value={form[`map_${period}_what`] || ''} onChange={e => update(`map_${period}_what`, e.target.value)} className="h-8" />
                    </td>
                    <td className="border p-2">
                      <Input value={form[`map_${period}_measure`] || ''} onChange={e => update(`map_${period}_measure`, e.target.value)} className="h-8" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Priority actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">🎯 Parte 3: 3 Ações Prioritárias (próximos 90 dias)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-lg border p-4 space-y-2">
              <h4 className="font-semibold text-sm">Ação {i}</h4>
              <div>
                <Label>O quê?</Label>
                <Input value={form[`action${i}_what`] || ''} onChange={e => update(`action${i}_what`, e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Como?</Label>
                <Input value={form[`action${i}_how`] || ''} onChange={e => update(`action${i}_how`, e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Até quando?</Label>
                <Input value={form[`action${i}_when`] || ''} onChange={e => update(`action${i}_when`, e.target.value)} className="mt-1" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Future letter */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-lg">💌 Parte 4: Carta para o meu EU do Futuro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Data de hoje</Label>
              <Input value={new Date().toLocaleDateString('pt-BR')} readOnly className="mt-1 bg-muted/50" />
            </div>
            <div>
              <Label>Data para ler novamente (daqui a 5 anos)</Label>
              <Input value={form.futureReadDate || ''} onChange={e => update('futureReadDate', e.target.value)} className="mt-1" placeholder="Ex: março de 2031" />
            </div>
          </div>
          <div>
            <Label>Querido(a) EU do futuro...</Label>
            <Textarea
              value={form.futureLetter || ''}
              onChange={e => update('futureLetter', e.target.value)}
              className="mt-1 min-h-[200px] text-base leading-relaxed"
              placeholder={`Hoje eu escolhi...\nEu espero que você esteja...\nMeu maior medo agora é...\nMeu maior sonho é...\nSe você estiver lendo isso daqui a 5 anos, lembre-se de...\n\nCom carinho,\n[Seu nome]`}
            />
          </div>
        </CardContent>
      </Card>

      {/* Final commitment */}
      <Card className="border-green-300 bg-green-50/50">
        <CardHeader>
          <CardTitle className="text-lg">✅ Parte 5: Meu Compromisso Final</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm">Eu me comprometo a:</p>
          <div className="space-y-2">
            {COMMITMENTS.map((c, i) => (
              <div key={i} className="flex items-center space-x-2">
                <Checkbox
                  id={`commit_${i}`}
                  checked={form[`commitment_${i}`] || false}
                  onCheckedChange={checked => update(`commitment_${i}`, !!checked)}
                />
                <label htmlFor={`commit_${i}`} className="text-sm cursor-pointer">{c}</label>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <Label>Assinatura</Label>
            <Input value={form.finalSignature || ''} onChange={e => update('finalSignature', e.target.value)} placeholder="Seu nome completo" className="mt-1 text-lg font-medium" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
