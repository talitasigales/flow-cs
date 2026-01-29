import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Copy, Check } from 'lucide-react';
import heroBackground from '@/assets/hero-background.jpg';
import grouLogo from '@/assets/grou-logo-verde.webp';

type AuthMode = 'login' | 'signup' | 'forgot-password';

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <Button size="icon" variant="outline" onClick={copy} type="button">
      {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
    </Button>
  );
};

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [mode, setMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [generatedPassword, setGeneratedPassword] = useState('');
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
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Por favor, insira seu email.');
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('reset-password', {
        body: { email }
      });
      
      if (error) throw error;
      if (data.error) {
        if (data.error === 'Usuário não encontrado') {
          toast.error('Email não encontrado. Verifique se digitou corretamente.');
        } else {
          throw new Error(data.error);
        }
        return;
      }
      
      setGeneratedPassword(data.provisionalPassword);
      toast.success('Nova senha gerada com sucesso!');
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast.error(error.message || 'Erro ao gerar nova senha.');
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;

        if (data.user) {
          const { data: profile } = await (supabase as any).from('profiles').select('password_changed').eq('id', data.user.id).single();
          if (profile && profile.password_changed === false) {
            toast.info('Por segurança, você precisará trocar sua senha provisória.');
          }
        }
        toast.success('Login realizado com sucesso!');
        navigate('/dashboard');
      } else if (mode === 'signup') {
        const provisionalPassword = email.split('@')[0];
        const { error } = await supabase.auth.signUp({
          email,
          password: provisionalPassword,
          options: {
            data: {
              full_name: fullName
            },
            emailRedirectTo: `${window.location.origin}/dashboard`
          }
        });
        if (error) throw error;
        toast.success('Cadastro realizado! Verifique seu email.');
        toast.info(`Sua senha provisória é: ${provisionalPassword}`);
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      if (error.message?.includes('already registered')) {
        toast.error('Este email já está cadastrado. Faça login.');
      } else if (error.message?.includes('Invalid login credentials')) {
        toast.error('Email ou senha incorretos.');
      } else {
        toast.error(error.message || 'Erro ao autenticar');
      }
    } finally {
      setLoading(false);
    }
  };
  return <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-6">
          {/* Logo and Title above the card */}
          <div className="flex flex-col items-center gap-4">
            <img src={grouLogo} alt="Grou Logo" className="h-20 w-auto" />
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
                {mode === 'signup' && 'Cadastre-se para começar sua jornada'}
                {mode === 'forgot-password' && !generatedPassword && 'Insira seu email para gerar uma nova senha'}
                {mode === 'forgot-password' && generatedPassword && 'Sua nova senha foi gerada com sucesso'}
              </CardDescription>
            </CardHeader>
          <CardContent>
            {mode === 'forgot-password' ? (
              generatedPassword ? (
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <Label className="text-sm text-muted-foreground">Sua nova senha provisória:</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <code className="flex-1 p-3 bg-background rounded border text-lg font-mono text-center">
                        {generatedPassword}
                      </code>
                      <CopyButton text={generatedPassword} />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    ⚠️ Anote esta senha! Você precisará trocá-la no próximo login.
                  </p>
                  <Button 
                    type="button" 
                    className="w-full gradient-primary" 
                    onClick={() => {
                      setMode('login');
                      setGeneratedPassword('');
                      setPassword('');
                    }}
                  >
                    Ir para o Login
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="seu@email.com" 
                      value={email} 
                      onChange={e => setEmail(e.target.value)} 
                      required 
                      disabled={loading} 
                    />
                  </div>

                  <Button type="submit" className="w-full gradient-primary" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Gerar Nova Senha
                  </Button>

                  <div className="text-center text-sm">
                    <button 
                      type="button" 
                      onClick={() => setMode('login')} 
                      className="text-primary hover:underline inline-flex items-center gap-1" 
                      disabled={loading}
                    >
                      <ArrowLeft className="h-3 w-3" />
                      Voltar ao login
                    </button>
                  </div>
                </form>
              )
            ) : (
              <form onSubmit={handleAuth} className="space-y-4">
                {mode === 'signup' && (
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Nome completo</Label>
                    <Input 
                      id="fullName" 
                      type="text" 
                      placeholder="Seu nome" 
                      value={fullName} 
                      onChange={e => setFullName(e.target.value)} 
                      required 
                      disabled={loading} 
                    />
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="seu@email.com" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    required 
                    disabled={loading} 
                  />
                </div>

                {mode === 'login' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Senha</Label>
                      <button 
                        type="button" 
                        onClick={() => setMode('forgot-password')} 
                        className="text-xs text-primary hover:underline"
                        disabled={loading}
                      >
                        Esqueceu a senha?
                      </button>
                    </div>
                    <Input 
                      id="password" 
                      type="password" 
                      placeholder="••••••••" 
                      value={password} 
                      onChange={e => setPassword(e.target.value)} 
                      required 
                      disabled={loading} 
                    />
                  </div>
                )}

                <Button type="submit" className="w-full gradient-primary" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {mode === 'login' ? 'Entrar' : 'Cadastrar'}
                </Button>

                <div className="text-center text-sm">
                  <button 
                    type="button" 
                    onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} 
                    className="text-primary hover:underline" 
                    disabled={loading}
                  >
                    {mode === 'login' ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Faça login'}
                  </button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
        </div>
      </div>

      {/* Right side - Hero */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        <img src={heroBackground} alt="Background" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-secondary/80" />
        <div className="relative z-10 flex flex-col items-center justify-center text-center p-12 text-white w-full">
          <h1 className="text-5xl font-bold mb-6 text-center">
            Evolua Continuamente
          </h1>
          <p className="text-xl mb-8 max-w-md text-center">Impulsione sua jornada de sucesso com a Grou através de uma trilha estruturada em 6 módulos essenciais para aprofundar sua utilização do PDA Assessment.</p>
          <div className="space-y-6 w-full max-w-2xl mx-auto">
            {/* Feature Slider */}
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
            
            {/* Slider Indicators */}
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
    </div>;
}