import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import heroBackground from '@/assets/hero-background.jpg';
import grouLogo from '@/assets/grou-logo-verde.webp';
export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  
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
    }, 3000); // Troca a cada 3 segundos

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const {
          data,
          error
        } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;

        // Check if user needs to change password
        if (data.user) {
          const {
            data: profile
          } = await supabase.from('profiles').select('password_changed').eq('id', data.user.id).single();
          if (profile && profile.password_changed === false) {
            toast.info('Por segurança, você precisará trocar sua senha provisória.');
          }
        }
        toast.success('Login realizado com sucesso!');
        navigate('/dashboard');
      } else {
        // For signup, use email prefix as password
        const provisionalPassword = email.split('@')[0];
        const {
          error
        } = await supabase.auth.signUp({
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
                {isLogin ? 'Bem-vindo de volta' : 'Criar conta'}
              </CardTitle>
              <CardDescription>
                {isLogin ? 'Entre com seu email e senha' : 'Cadastre-se para começar sua jornada'}
              </CardDescription>
            </CardHeader>
          <CardContent>
            <form onSubmit={handleAuth} className="space-y-4">
              {!isLogin && <div className="space-y-2">
                  <Label htmlFor="fullName">Nome completo</Label>
                  <Input id="fullName" type="text" placeholder="Seu nome" value={fullName} onChange={e => setFullName(e.target.value)} required={!isLogin} disabled={loading} />
                </div>}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required disabled={loading} />
              </div>

              {isLogin && <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input id="password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required={isLogin} disabled={loading} />
                </div>}

              <Button type="submit" className="w-full gradient-primary" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLogin ? 'Entrar' : 'Cadastrar'}
              </Button>

              <div className="text-center text-sm">
                <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-primary hover:underline" disabled={loading}>
                  {isLogin ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Faça login'}
                </button>
              </div>
            </form>
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
          <p className="text-xl mb-8 max-w-md text-center">Acompanhe sua jornada de sucesso com a Grou através de uma trilha estruturada em 6 módulos essenciais para aprofundar sua utilização do PDA Assessment.</p>
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