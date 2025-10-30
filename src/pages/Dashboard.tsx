import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { TrendingUp, Grid3x3, LogOut, MessageCircle, Users, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { ChangePasswordDialog } from '@/components/ChangePasswordDialog';
import { usePasswordCheck } from '@/hooks/usePasswordCheck';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { ModuleHero } from '@/components/ModuleHero';
import { ModuleCarousel } from '@/components/ModuleCarousel';
import grouLogo from '@/assets/grou-logo.webp';
interface Module {
  id: string;
  title: string;
  description: string;
  module_order: number;
  video_url: string;
  materials: any;
  thumbnail_url?: string;
  category?: string;
  duration_minutes?: number;
  difficulty?: string;
}
interface UserProgress {
  module_id: string;
  completed: boolean;
  video_watched: boolean;
}
export default function Dashboard() {
  const {
    user,
    loading: authLoading
  } = useAuth();
  const navigate = useNavigate();
  const [modules, setModules] = useState<Module[]>([]);
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useIsAdmin();
  const {
    needsPasswordChange,
    loading: passwordCheckLoading,
    refetch
  } = usePasswordCheck();
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);
  useEffect(() => {
    if (user) {
      fetchModulesAndProgress();
    }
  }, [user]);
  const fetchModulesAndProgress = async () => {
    try {
      const {
        data: modulesData,
        error: modulesError
      } = await supabase.from('modules').select('*').order('module_order');
      if (modulesError) throw modulesError;
      const {
        data: progressData,
        error: progressError
      } = await supabase.from('user_progress').select('*').eq('user_id', user?.id);
      if (progressError) throw progressError;
      setModules(modulesData || []);
      setProgress(progressData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };
  const getModuleProgress = (moduleId: string) => {
    return progress.find(p => p.module_id === moduleId);
  };
  const calculateOverallProgress = () => {
    if (modules.length === 0) return 0;
    const completedCount = progress.filter(p => p.completed).length;
    return Math.round(completedCount / modules.length * 100);
  };

  // Categorize modules for different carousels
  const continueWatching = modules.filter(module => {
    const prog = getModuleProgress(module.id);
    return prog?.video_watched && !prog?.completed;
  });

  const recommended = modules.filter(module => {
    const prog = getModuleProgress(module.id);
    return !prog?.completed;
  });

  const completed = modules.filter(module => {
    const prog = getModuleProgress(module.id);
    return prog?.completed;
  });

  // Get module for hero section (last accessed or first incomplete)
  const heroModule = continueWatching[0] || recommended[0] || modules[0];

  // Group by category
  const modulesByCategory = modules.reduce((acc, module) => {
    const category = module.category || 'Fundamentos';
    if (!acc[category]) acc[category] = [];
    acc[category].push(module);
    return acc;
  }, {} as Record<string, Module[]>);

  const handleLogout = async () => {
    try {
      const {
        error
      } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/auth');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Erro ao sair');
    }
  };
  if (authLoading || loading || passwordCheckLoading) {
    return <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>;
  }
  if (needsPasswordChange) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
        <ChangePasswordDialog onPasswordChanged={refetch} />
      </div>;
  }
  return <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/50 backdrop-blur">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={grouLogo} alt="Grou Logo" className="h-8" />
              <h1 className="gradient-text font-bold text-2xl">Plataforma de Sucesso do Cliente</h1>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => navigate('/chat-nanda')}>
                <MessageCircle className="mr-2 h-4 w-4" />
                Fale com a Nanda, especialista PDA
              </Button>
              <Button variant="outline" onClick={() => navigate('/matriz-9box')}>
                <Grid3x3 className="mr-2 h-4 w-4" />
                Matriz 9Box
              </Button>
              <Button variant="outline" onClick={() => navigate('/profile-evolution')}>
                <TrendingUp className="mr-2 h-4 w-4" />
                Evolução de Perfil PDA
              </Button>
              {isAdmin && (
                <>
                  <Button variant="outline" onClick={() => navigate('/admin/users')}>
                    <Users className="mr-2 h-4 w-4" />
                    Gerenciar Usuários
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/admin/logs')}>
                    <FileText className="mr-2 h-4 w-4" />
                    Logs
                  </Button>
                </>
              )}
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Hero Section */}
        {heroModule && (
          <ModuleHero 
            module={heroModule} 
            progress={getModuleProgress(heroModule.id)}
          />
        )}

        {/* Overall Progress */}
        <Card className="gradient-card border-border/50">
          <CardHeader>
            <CardTitle>SEU PROGRESSO</CardTitle>
            <CardDescription>
              Você completou {progress.filter(p => p.completed).length} de{' '}
              {modules.length} módulos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Progress value={calculateOverallProgress()} className="h-3" />
              <p className="text-sm text-muted-foreground text-right">
                {calculateOverallProgress()}% completo
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Continue Watching */}
        {continueWatching.length > 0 && (
          <ModuleCarousel 
            title="Continue Assistindo" 
            modules={continueWatching}
            progressData={progress}
          />
        )}

        {/* Recommended */}
        {recommended.length > 0 && (
          <ModuleCarousel 
            title="Recomendados para Você" 
            modules={recommended}
            progressData={progress}
          />
        )}

        {/* By Category */}
        {Object.entries(modulesByCategory).map(([category, categoryModules]) => (
          <ModuleCarousel 
            key={category}
            title={category} 
            modules={categoryModules}
            progressData={progress}
          />
        ))}

        {/* Completed */}
        {completed.length > 0 && (
          <ModuleCarousel 
            title="Módulos Concluídos" 
            modules={completed}
            progressData={progress}
          />
        )}
      </div>
    </div>;
}