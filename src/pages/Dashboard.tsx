import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle, Play, FileText, Calendar, TrendingUp, Grid3x3 } from 'lucide-react';
import { toast } from 'sonner';

interface Module {
  id: string;
  title: string;
  description: string;
  module_order: number;
  video_url: string;
  materials: any;
}

interface UserProgress {
  module_id: string;
  completed: boolean;
  video_watched: boolean;
}

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [modules, setModules] = useState<Module[]>([]);
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);

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
      const { data: modulesData, error: modulesError } = await supabase
        .from('modules')
        .select('*')
        .order('module_order');

      if (modulesError) throw modulesError;

      const { data: progressData, error: progressError } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user?.id);

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
    return progress.find((p) => p.module_id === moduleId);
  };

  const calculateOverallProgress = () => {
    if (modules.length === 0) return 0;
    const completedCount = progress.filter((p) => p.completed).length;
    return Math.round((completedCount / modules.length) * 100);
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/50 backdrop-blur">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold gradient-text">
                Plataforma de Sucesso Contínuo
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => navigate('/matriz-9box')}
              >
                <Grid3x3 className="mr-2 h-4 w-4" />
                Matriz 9Box
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/profile-evolution')}
              >
                <TrendingUp className="mr-2 h-4 w-4" />
                Evolução de Perfil
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/resources')}
              >
                <FileText className="mr-2 h-4 w-4" />
                Recursos
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/profile')}
              >
                Perfil
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">
            Bem-vindo à sua jornada! 🚀
          </h2>
          <p className="text-muted-foreground">
            Continue evoluindo através da nossa trilha de sucesso
          </p>
        </div>

        {/* Overall Progress */}
        <Card className="mb-8 gradient-card border-border/50">
          <CardHeader>
            <CardTitle>Progresso Geral</CardTitle>
            <CardDescription>
              Você completou {progress.filter((p) => p.completed).length} de{' '}
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

        {/* Modules Grid */}
        <div className="space-y-4">
          <h3 className="text-2xl font-bold mb-4">Trilha de Sucesso</h3>
          <div className="grid gap-4">
            {modules.map((module) => {
              const moduleProgress = getModuleProgress(module.id);
              const isCompleted = moduleProgress?.completed;
              const isWatched = moduleProgress?.video_watched;

              return (
                <Card
                  key={module.id}
                  className={`gradient-card border-border/50 hover:border-primary/50 transition-all cursor-pointer ${
                    isCompleted ? 'border-success/50' : ''
                  }`}
                  onClick={() => navigate(`/module/${module.id}`)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        {isCompleted ? (
                          <CheckCircle2 className="h-8 w-8 text-success" />
                        ) : (
                          <Circle className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-xl font-semibold">
                            {module.module_order}
                          </h4>
                        </div>
                        <p className="text-muted-foreground mb-4">
                          {module.description}
                        </p>
                        <div className="flex items-center gap-4 text-sm">
                          {isWatched && (
                            <span className="flex items-center gap-1 text-primary">
                              <Play className="h-4 w-4" />
                              Vídeo assistido
                            </span>
                          )}
                          <Button size="sm" variant="outline">
                            Acessar módulo
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
