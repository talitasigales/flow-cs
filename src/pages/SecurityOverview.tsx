import { Shield, Lock, Eye, Users, FileCheck, CheckCircle, Server, KeyRound, ScrollText, Globe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const securityFeatures = [
  {
    icon: Lock,
    title: 'Criptografia',
    description: 'Dados criptografados em trânsito (TLS 1.3) e em repouso (AES-256). Senhas protegidas com bcrypt.',
    badge: 'Ativo',
  },
  {
    icon: KeyRound,
    title: 'Autenticação Segura',
    description: 'JWT tokens com expiração automática, troca obrigatória de senha no primeiro acesso e rate limiting contra brute force.',
    badge: 'Ativo',
  },
  {
    icon: Users,
    title: 'Controle de Acesso (RBAC)',
    description: 'Row Level Security em todas as tabelas. Cada usuário acessa exclusivamente seus dados. Roles em tabela dedicada.',
    badge: 'Ativo',
  },
  {
    icon: ScrollText,
    title: 'Auditoria Completa',
    description: 'Logs imutáveis automáticos em ~30 tabelas capturam todas as operações com diff detalhado de alterações.',
    badge: 'Ativo',
  },
  {
    icon: FileCheck,
    title: 'Conformidade LGPD',
    description: 'Consentimento explícito, direito de exclusão, portabilidade em PDF, política de retenção e minimização de dados.',
    badge: 'Conforme',
  },
  {
    icon: Server,
    title: 'Backup & Recuperação',
    description: 'Backups automáticos diários com Point-in-Time Recovery. RTO < 4h, RPO < 1h em infraestrutura AWS.',
    badge: 'Ativo',
  },
];

const standards = [
  { name: 'LGPD', description: 'Lei 13.709/2018' },
  { name: 'OWASP Top 10', description: 'Mitigação completa' },
  { name: 'ISO 27001', description: 'Práticas inspiradas' },
  { name: 'GDPR', description: 'Referência europeia' },
];

const checklistItems = [
  { task: 'Revisão de permissões e acessos', freq: 'Mensal' },
  { task: 'Atualização de dependências', freq: 'Semanal' },
  { task: 'Scan de vulnerabilidades', freq: 'Trimestral' },
  { task: 'Rotação de credenciais', freq: 'Trimestral' },
  { task: 'Revisão de logs de auditoria', freq: 'Mensal' },
  { task: 'Teste de backup e restauração', freq: 'Semestral' },
  { task: 'Treinamento de segurança', freq: 'Anual' },
];

const SecurityOverview = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(220,40%,10%)] via-[hsl(220,40%,13%)] to-[hsl(220,35%,18%)]" />
        <div className="relative max-w-6xl mx-auto px-6 py-16 md:py-24 text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20">
              <Shield className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            Segurança & Governança de Dados
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-8">
            Proteção de nível enterprise para os dados de desenvolvimento profissional da sua organização.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {standards.map((s) => (
              <Badge key={s.name} variant="outline" className="text-sm py-1.5 px-4 border-primary/30 text-primary">
                <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                {s.name}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-6xl mx-auto px-6 -mt-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {securityFeatures.map((feature) => (
            <Card key={feature.title} className="border-border/50 bg-card/80 backdrop-blur hover:border-primary/30 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <Badge variant="secondary" className="text-xs bg-[hsl(var(--success)/0.15)] text-[hsl(var(--success))] border-0">
                    {feature.badge}
                  </Badge>
                </div>
                <CardTitle className="text-base text-foreground">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Standards */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-foreground mb-8 text-center">Padrões de Segurança</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {standards.map((s) => (
            <Card key={s.name} className="text-center border-border/50 bg-card/60">
              <CardContent className="pt-6">
                <Globe className="h-8 w-8 text-primary mx-auto mb-3" />
                <h3 className="font-bold text-foreground">{s.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{s.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Separator className="max-w-4xl mx-auto" />

      {/* Checklist */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-foreground mb-2 text-center">Checklist de Segurança Contínua</h2>
        <p className="text-muted-foreground text-center mb-8">Atividades recorrentes para manutenção do nível de segurança</p>
        <div className="space-y-3">
          {checklistItems.map((item) => (
            <div key={item.task} className="flex items-center justify-between p-4 rounded-lg bg-card/60 border border-border/50">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="text-sm text-foreground">{item.task}</span>
              </div>
              <Badge variant="outline" className="text-xs">{item.freq}</Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-8 px-6">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Grou — Plataforma de Sucesso do Cliente. Todos os direitos reservados.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Para documentação técnica detalhada, entre em contato com nossa equipe.
        </p>
      </div>
    </div>
  );
};

export default SecurityOverview;
