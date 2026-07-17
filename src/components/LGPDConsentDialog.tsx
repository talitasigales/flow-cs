import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Shield, Lock, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import grouLogo from '@/assets/grou-logo-branco.png.asset.json';

interface LGPDConsentDialogProps {
  userId: string;
  onAccepted: () => void;
}

export function LGPDConsentDialog({ userId, onAccepted }: LGPDConsentDialogProps) {
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    if (!accepted) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ lgpd_accepted: true, lgpd_accepted_at: new Date().toISOString() })
        .eq('user_id', userId);

      if (error) throw error;
      toast.success('Termos aceitos com sucesso!');
      onAccepted();
    } catch (error) {
      console.error('Error accepting LGPD:', error);
      toast.error('Erro ao salvar aceite. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-primary/20 bg-card/95 backdrop-blur-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 border-b border-primary/10">
          <div className="flex items-center gap-4">
            <img src={grouLogo.url} alt="Grou" className="h-10" />
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Termo de Consentimento
              </h1>
              <p className="text-sm text-muted-foreground">
                Lei Geral de Proteção de Dados (LGPD)
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="h-[400px] p-6">
          <div className="space-y-4 text-sm text-muted-foreground leading-relaxed pr-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
              <Lock className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <p className="font-medium text-foreground">
                Seus dados são protegidos e tratados com total confidencialidade conforme a Lei nº 13.709/2018 (LGPD).
              </p>
            </div>

            <h2 className="text-base font-semibold text-foreground pt-2">1. Dados Coletados</h2>
            <p>
              A plataforma Grou coleta e armazena os seguintes dados pessoais e sensíveis para fins de desenvolvimento profissional:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Nome completo e e-mail corporativo</li>
              <li>Dados de perfil comportamental (REPNA: Riscos, Extroversão, Paciência, Normas, Autocontrole)</li>
              <li>Avaliações de desempenho e potencial (Matriz 9Box)</li>
              <li>Planos de Desenvolvimento Individual (PDI) e seus check-ins</li>
              <li>Resultados de análises de perfil e evolução profissional</li>
              <li>Dados de construção de perfil de cargo</li>
              <li>Progresso em módulos de capacitação</li>
            </ul>

            <h2 className="text-base font-semibold text-foreground pt-2">2. Finalidade do Tratamento</h2>
            <p>Os dados são utilizados exclusivamente para:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Gestão e acompanhamento do desenvolvimento profissional</li>
              <li>Análise e evolução de perfil comportamental</li>
              <li>Elaboração e monitoramento de planos de desenvolvimento individual</li>
              <li>Geração de insights e recomendações personalizadas via inteligência artificial</li>
              <li>Avaliação de desempenho e potencial no contexto organizacional</li>
            </ul>

            <h2 className="text-base font-semibold text-foreground pt-2">3. Segurança da Informação</h2>
            <p>
              Adotamos medidas técnicas e organizacionais para proteger seus dados:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Criptografia em trânsito e em repouso</li>
              <li>Controle de acesso baseado em autenticação individual</li>
              <li>Isolamento de dados: cada usuário acessa apenas seus próprios dados</li>
              <li>Políticas de segurança a nível de banco de dados (Row Level Security)</li>
              <li>Registros de auditoria para rastreabilidade de ações</li>
            </ul>

            <h2 className="text-base font-semibold text-foreground pt-2">4. Compartilhamento de Dados</h2>
            <p>
              Seus dados <strong className="text-foreground">não são compartilhados</strong> com terceiros, exceto quando estritamente necessário 
              para o funcionamento da plataforma (ex.: serviços de infraestrutura em nuvem com contratos de confidencialidade).
            </p>

            <h2 className="text-base font-semibold text-foreground pt-2">5. Direitos do Titular</h2>
            <p>Conforme a LGPD, você tem direito a:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Acessar seus dados pessoais a qualquer momento</li>
              <li>Solicitar correção de dados incompletos ou desatualizados</li>
              <li>Solicitar a exclusão de seus dados pessoais</li>
              <li>Revogar este consentimento a qualquer momento</li>
              <li>Solicitar portabilidade dos seus dados</li>
            </ul>

            <h2 className="text-base font-semibold text-foreground pt-2">6. Retenção dos Dados</h2>
            <p>
              Os dados serão mantidos enquanto houver relação ativa com a plataforma. Após o término, 
              os dados serão eliminados ou anonimizados conforme as obrigações legais aplicáveis.
            </p>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border mt-4">
              <FileText className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-xs">
                Para exercer seus direitos ou esclarecer dúvidas sobre o tratamento de dados, 
                entre em contato com o Encarregado de Proteção de Dados (DPO) da organização responsável.
              </p>
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-6 border-t border-primary/10 space-y-4">
          <div className="flex items-start gap-3">
            <Checkbox
              id="lgpd-accept"
              checked={accepted}
              onCheckedChange={(checked) => setAccepted(checked === true)}
              className="mt-0.5"
            />
            <label htmlFor="lgpd-accept" className="text-sm cursor-pointer leading-relaxed">
              Li e concordo com os termos acima. Autorizo o tratamento dos meus dados pessoais e sensíveis 
              conforme descrito neste termo, em conformidade com a LGPD (Lei nº 13.709/2018).
            </label>
          </div>

          <Button
            onClick={handleAccept}
            disabled={!accepted || loading}
            className="w-full"
            size="lg"
          >
            {loading ? 'Salvando...' : 'Aceitar e Continuar'}
          </Button>
        </div>
      </div>
    </div>
  );
}
