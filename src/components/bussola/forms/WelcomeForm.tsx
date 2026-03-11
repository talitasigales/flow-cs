import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface WelcomeFormProps {
  data: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
  onSubmit: (data: Record<string, any>) => void;
}

export function WelcomeForm({ data, onChange, onSubmit }: WelcomeFormProps) {
  const [name, setName] = useState(data.name || '');
  const [signed, setSigned] = useState(data.signed || false);

  useEffect(() => {
    if (data.name) setName(data.name);
    if (data.signed) setSigned(data.signed);
  }, [data.name, data.signed]);

  const handleSign = () => {
    if (!name.trim()) {
      toast.error('Digite seu nome para assinar o compromisso');
      return;
    }
    const updated = { name: name.trim(), signed: true, signedAt: new Date().toISOString() };
    setSigned(true);
    onSubmit(updated);
    toast.success('Compromisso assinado! Sua jornada começa agora 🚀');
  };

  if (signed) {
    return (
      <Card className="border-green-200 bg-green-50/50">
        <CardContent className="pt-6 text-center space-y-3">
          <div className="text-5xl">✅</div>
          <h3 className="text-xl font-bold text-green-800">Compromisso Assinado!</h3>
          <p className="text-sm text-green-700">
            <strong>{data.name || name}</strong>, sua jornada já começou.
          </p>
          <p className="text-xs text-green-600">Volte à jornada e acesse o Encontro 1.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">🌟 Bem-vindo(a) à sua Jornada!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Este é seu roteiro para transformar autoconhecimento em decisões conscientes sobre sua carreira.
          </p>

          <div className="rounded-lg bg-muted/50 p-4 space-y-3">
            <h4 className="font-semibold">📅 Como funciona:</h4>
            <p className="text-sm">A Jornada Bússola tem 5 encontros de 1 hora com um(a) psicólogo(a) especializado(a):</p>
            <div className="space-y-1 text-sm">
              <p><strong>Encontro 1:</strong> Entender quem você é + escolher carreira</p>
              <p><strong>Encontro 2:</strong> Mapear suas competências</p>
              <p><strong>Encontro 3:</strong> Desenhar os caminhos possíveis</p>
              <p><strong>Encontro 4:</strong> Lidar com pressão, medo e incerteza</p>
              <p><strong>Encontro 5:</strong> Criar plano de ação para os próximos anos</p>
            </div>
          </div>

          <div className="rounded-lg bg-muted/50 p-4 space-y-2">
            <h4 className="font-semibold">✅ 3 Regras de Ouro:</h4>
            <ol className="list-decimal ml-4 text-sm space-y-1">
              <li>Não existe resposta certa ou errada — este é o SEU caminho</li>
              <li>Você pode mudar de ideia — e está tudo bem</li>
              <li>Peça ajuda sempre que precisar — seu/sua psicólogo(a) está aqui para isso</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle className="text-lg">📝 Meu Compromisso</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm">
            Eu me comprometo a participar ativamente desta Jornada, fazer os pré-trabalhos 
            e construir meu futuro com consciência.
          </p>
          <div className="space-y-2">
            <Label htmlFor="sign-name">Seu nome completo (assinatura)</Label>
            <Input
              id="sign-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Digite seu nome completo"
              className="text-lg font-medium"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Data: {new Date().toLocaleDateString('pt-BR')}
          </p>
          <Button onClick={handleSign} className="w-full" size="lg">
            ✍️ Assinar Compromisso
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
