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
import grouLogo from '@/assets/grou-logo.webp';
export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
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
          <div className="flex items-center gap-3 justify-center">
            <img src={grouLogo} alt="Grou Logo" className="h-12 w-12" />
            <h2 className="text-xl font-bold gradient-text">Plataforma de Sucesso do Cliente</h2>
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
        <div className="relative z-10 flex flex-col items-center justify-center text-center p-12 text-white">
          <h1 className="text-5xl font-bold mb-6">
            Evolua Continuamente
          </h1>
          <p className="text-xl mb-8 max-w-md">Acompanhe sua jornada de sucesso com a Grou através de uma trilha estruturada em 6 módulos essenciais</p>
          <div className="grid grid-cols-2 gap-6 max-w-lg">
            <div className="glass-morphism p-4 rounded-lg">
              <p className="text-3xl font-bold">6</p>
              <p className="text-sm">módulos</p>
            </div>
            <div className="glass-morphism p-4 rounded-lg">
              <p className="text-3xl font-bold">+4</p>
              <p className="text-sm">recursos</p>
            </div>
          </div>
        </div>
      </div>
    </div>;
}