import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Shield } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import heroBackground from '@/assets/hero-background.jpg';
import grouLogo from '@/assets/grou-logo-laranja.png';

type AuthMode = 'login' | 'signup' | 'forgot-password';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [company, setCompany] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [mode, setMode] = useState<AuthMode>('login');
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotCooldown, setForgotCooldown] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const features = [
    'Ferramentas gratuitas',
    '6 módulos na trilha de sucesso',
    'Biblioteca com materiais de apoio',
    'IA especialista no PDA',
    'Matriz 9Box gratuita',
    'Evolução Comparativa de Perfis PDA'
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (forgotCooldown <= 0) return;
    const t = setTimeout(() => setForgotCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [forgotCooldown]);

  useEffect(() => {
    if (!user) return;
    navigate('/dashboard');
  }, [user, navigate]);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Digite seu email');
      return;
    }
    setForgotLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('request-password-reset', {
        body: { email },
      });
      if (error) throw error;

      if (data?.success && data?.actionLink) {
        toast.success('Redirecionando para redefinição de senha...');
        // Redirect directly to the Supabase recovery link
        // This establishes the recovery session and redirects to /reset-password
        window.location.href = data.actionLink;
      } else {
        toast.error(data?.message || 'Email não encontrado. Verifique e tente novamente.');
      }
    } catch (error: any) {
      toast.error('Erro ao solicitar redefinição de senha. Tente novamente.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !company || !jobTitle) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    if (password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    setLoading(true);
    try {
      const response = await supabase.functions.invoke('register-user', {
        body: { email, password, full_name: fullName, company, job_title: jobTitle },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Erro ao criar conta');
      }

      const data = response.data;
      if (data?.error) {
        throw new Error(data.error);
      }

      toast.success('Conta criada com sucesso! Faça login.');
      setMode('login');
      setPassword('');
      setFullName('');
      setCompany('');
      setJobTitle('');
    } catch (error: any) {
      console.error('Signup error:', error);
      toast.error(error.message || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      if (data.user) {
        const { data: profile } = await supabase.from('profiles').select('password_changed').eq('user_id', data.user.id).single();
        if (profile && profile.password_changed === false) {
          toast.info('Por segurança, você precisará trocar sua senha provisória.');
        }
      }
      toast.success('Login realizado com sucesso!');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Auth error:', error);
      if (error.message?.includes('Invalid login credentials')) {
        toast.error('Email ou senha incorretos.');
      } else if (error.message?.includes('rate limit') || error.status === 429) {
        toast.error('Muitas tentativas em pouco tempo. Aguarde alguns minutos antes de tentar novamente.', { duration: 6000 });
      } else {
        toast.error(error.message || 'Erro ao autenticar');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderForm = () => {
    if (mode === 'forgot-password') {
      return (
        <form onSubmit={handleForgotPassword} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reset-email">Email</Label>
            <Input id="reset-email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={forgotLoading} />
          </div>
          <Button type="submit" className="w-full gradient-primary" disabled={forgotLoading || forgotCooldown > 0}>
            {forgotLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {forgotCooldown > 0 ? `Aguarde ${forgotCooldown}s` : 'Enviar Link de Redefinição'}
          </Button>
          <Button type="button" variant="ghost" className="w-full" onClick={() => setMode('login')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao Login
          </Button>
        </form>
      );
    }

    if (mode === 'signup') {
      return (
        <form onSubmit={handleSignup} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Nome Completo *</Label>
            <Input id="fullName" placeholder="Seu nome completo" value={fullName} onChange={(e) => setFullName(e.target.value)} required disabled={loading} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-email">Email *</Label>
            <Input id="signup-email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-password">Senha *</Label>
            <Input id="signup-password" type="password" placeholder="Mínimo 6 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company">Empresa *</Label>
            <Input id="company" placeholder="Nome da empresa" value={company} onChange={(e) => setCompany(e.target.value)} required disabled={loading} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="jobTitle">Cargo *</Label>
            <Input id="jobTitle" placeholder="Seu cargo" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} required disabled={loading} />
          </div>
          <Button type="submit" className="w-full gradient-primary" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Criar Conta
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Já tem conta?{' '}
            <button type="button" onClick={() => setMode('login')} className="text-primary hover:underline">
              Faça login
            </button>
          </p>
        </form>
      );
    }

    return (
      <form onSubmit={handleAuth} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required disabled={loading} />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Senha</Label>
            <button type="button" onClick={() => setMode('forgot-password')} className="text-xs text-primary hover:underline" disabled={loading}>
              Esqueceu a senha?
            </button>
          </div>
          <Input id="password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required disabled={loading} />
        </div>
        <Button type="submit" className="w-full gradient-primary" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Entrar
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Não tem conta?{' '}
          <button type="button" onClick={() => setMode('signup')} className="text-primary hover:underline">
            Cadastre-se
          </button>
        </p>
      </form>
    );
  };

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-6">
          <div className="flex flex-col items-center gap-4">
            <img src={grouLogo} alt="Grou Logo" className="h-[6.25rem] w-auto" />
            <h2 className="text-3xl font-bold gradient-text">Plataforma de Sucesso do Cliente</h2>
          </div>
          
          <Card className="gradient-card border-border/50">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl">
                {mode === 'login' && 'Bem-vindo de volta'}
                {mode === 'signup' && 'Criar conta'}
                {mode === 'forgot-password' && 'Redefinir senha'}
              </CardTitle>
              <CardDescription>
                {mode === 'login' && 'Entre com seu email e senha'}
                {mode === 'signup' && 'Preencha seus dados para criar sua conta'}
                {mode === 'forgot-password' && 'Digite seu email para receber o link de redefinição'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderForm()}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        <img src={heroBackground} alt="Background" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-secondary/80" />
        <div className="relative z-10 flex flex-col items-center justify-center text-center p-12 text-white w-full">
          <h1 className="text-5xl font-bold mb-6 text-center">Evolua Continuamente</h1>
          <p className="text-xl mb-8 max-w-md text-center">Impulsione sua jornada de sucesso com a Grou através de uma trilha estruturada em 6 módulos essenciais para aprofundar sua utilização do PDA Assessment.</p>
          <div className="space-y-6 w-full max-w-2xl mx-auto">
            <div className="relative h-24 flex items-center justify-center">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className={`absolute w-full glass-morphism p-8 rounded-lg text-center transition-all duration-700 shadow-2xl ${
                    index === currentSlide 
                      ? 'opacity-100 scale-100 translate-y-0' 
                      : 'opacity-0 scale-95 translate-y-4 pointer-events-none'
                  }`}
                  style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}
                >
                  <p className="text-xl font-semibold">{feature}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2 justify-center">
              {features.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentSlide 
                      ? 'w-8 bg-white' 
                      : 'w-2 bg-white/50 hover:bg-white/75'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
