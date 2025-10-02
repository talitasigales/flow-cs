import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { TrendingUp, Target, Users, BarChart } from 'lucide-react';
import heroBackground from '@/assets/hero-background.jpg';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <img
          src={heroBackground}
          alt="Background"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/80 to-background/95" />
        
        <div className="relative z-10 container mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <TrendingUp className="h-12 w-12 text-primary" />
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold gradient-text">
              Plataforma de Sucesso Contínuo
            </h1>
          </div>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Sua jornada de evolução profissional através do PDA Assessment
          </p>

          <Button
            size="lg"
            className="gradient-primary text-lg px-8 py-6 glow-effect"
            onClick={() => navigate('/auth')}
          >
            Começar Agora
          </Button>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mt-16 max-w-5xl mx-auto">
            <div className="glass-morphism p-6 rounded-xl">
              <Target className="h-10 w-10 text-primary mb-4 mx-auto" />
              <h3 className="text-lg font-semibold mb-2">6 Módulos Estruturados</h3>
              <p className="text-sm text-muted-foreground">
                Trilha completa de aprendizado guiado
              </p>
            </div>
            
            <div className="glass-morphism p-6 rounded-xl">
              <BarChart className="h-10 w-10 text-secondary mb-4 mx-auto" />
              <h3 className="text-lg font-semibold mb-2">4 Recursos Exclusivos</h3>
              <p className="text-sm text-muted-foreground">
                Ferramentas práticas para aplicação do PDA
              </p>
            </div>
            
            <div className="glass-morphism p-6 rounded-xl">
              <Users className="h-10 w-10 text-accent mb-4 mx-auto" />
              <h3 className="text-lg font-semibold mb-2">Suporte Contínuo</h3>
              <p className="text-sm text-muted-foreground">
                Assistente Nanda disponível 24/7
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
