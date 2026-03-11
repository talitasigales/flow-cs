import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Rocket, PartyPopper, Sparkles } from 'lucide-react';

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
      <div className="rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 p-8 text-center space-y-4">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
            <PartyPopper className="h-8 w-8 text-white" />
          </div>
        </div>
        <h3 className="text-xl font-black text-white">Compromisso Assinado! 🎉</h3>
        <p className="text-sm text-white/60">
          <strong className="text-emerald-300">{data.name || name}</strong>, sua jornada já começou.
        </p>
        <p className="text-xs text-white/40">Volte à jornada e acesse a Fase 1.</p>
        <div className="flex items-center justify-center gap-1.5 text-amber-400">
          <Sparkles className="h-4 w-4" />
          <span className="text-sm font-bold">+50 XP conquistados!</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome card */}
      <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <Rocket className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-xl font-black text-white">Bem-vindo(a) à sua Jornada!</h3>
          </div>
          
          <p className="text-sm text-white/50">
            Este é seu roteiro para transformar autoconhecimento em decisões conscientes sobre sua carreira.
          </p>

          <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-3">
            <h4 className="font-bold text-white/90 flex items-center gap-2">
              <span>🎮</span> Como funciona:
            </h4>
            <p className="text-sm text-white/50">5 encontros individuais de 1h com um(a) psicólogo(a):</p>
            <div className="space-y-2">
              {[
                { phase: '1', text: 'Entender quem você é + escolher carreira', color: 'text-violet-400' },
                { phase: '2', text: 'Mapear suas competências', color: 'text-cyan-400' },
                { phase: '3', text: 'Desenhar os caminhos possíveis', color: 'text-emerald-400' },
                { phase: '4', text: 'Lidar com pressão, medo e incerteza', color: 'text-rose-400' },
                { phase: '5', text: 'Criar plano de ação para os próximos anos', color: 'text-amber-400' },
              ].map(item => (
                <div key={item.phase} className="flex items-center gap-3">
                  <span className={`text-xs font-black ${item.color} bg-white/5 rounded-lg px-2 py-1 min-w-[32px] text-center`}>
                    {item.phase}
                  </span>
                  <span className="text-sm text-white/60">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-3">
            <h4 className="font-bold text-white/90 flex items-center gap-2">
              <span>💎</span> 3 Regras de Ouro:
            </h4>
            <div className="space-y-2 text-sm text-white/60">
              <p>1. Não existe resposta certa ou errada — este é o SEU caminho</p>
              <p>2. Você pode mudar de ideia — e está tudo bem</p>
              <p>3. Peça ajuda sempre que precisar — seu/sua psicólogo(a) está aqui pra isso</p>
            </div>
          </div>
        </div>
      </div>

      {/* Commitment card */}
      <div className="rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/5 border border-purple-500/20 overflow-hidden">
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <span>✍️</span> Meu Compromisso
          </h3>
          <p className="text-sm text-white/50">
            Eu me comprometo a participar ativamente desta Jornada, fazer os pré-trabalhos 
            e construir meu futuro com consciência.
          </p>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-white/40 uppercase tracking-wider">Seu nome completo (assinatura)</label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Digite seu nome completo"
              className="text-lg font-medium bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-purple-400/50 focus:ring-purple-400/20"
            />
          </div>
          <p className="text-xs text-white/30">
            📅 Data: {new Date().toLocaleDateString('pt-BR')}
          </p>
          <Button 
            onClick={handleSign} 
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold text-base h-12 rounded-xl"
            size="lg"
          >
            🚀 Assinar e Começar a Jornada
          </Button>
        </div>
      </div>
    </div>
  );
}
