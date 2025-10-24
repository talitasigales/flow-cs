import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle, Play, TrendingUp, Grid3x3, LogOut, Check, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { ChangePasswordDialog } from '@/components/ChangePasswordDialog';
import { usePasswordCheck } from '@/hooks/usePasswordCheck';
import grouLogo from '@/assets/grou-logo.webp';
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
  const {
    user,
    loading: authLoading
  } = useAuth();
  const navigate = useNavigate();
  const [modules, setModules] = useState<Module[]>([]);
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);
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
  const toggleModuleCompletion = async (moduleId: string, currentStatus: boolean, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent card click navigation
    
    try {
      const moduleProgress = getModuleProgress(moduleId);
      
      if (moduleProgress) {
        // Update existing progress
        const { error } = await supabase
          .from('user_progress')
          .update({ 
            completed: !currentStatus,
            completed_at: !currentStatus ? new Date().toISOString() : null
          })
          .eq('user_id', user?.id)
          .eq('module_id', moduleId);
          
        if (error) throw error;
      } else {
        // Create new progress record
        const { error } = await supabase
          .from('user_progress')
          .insert({
            user_id: user?.id,
            module_id: moduleId,
            completed: true,
            completed_at: new Date().toISOString()
          });
          
        if (error) throw error;
      }
      
      // Refresh data
      await fetchModulesAndProgress();
      toast.success(!currentStatus ? 'Módulo marcado como concluído!' : 'Módulo desmarcado');
    } catch (error) {
      console.error('Error updating progress:', error);
      toast.error('Erro ao atualizar progresso');
    }
  };

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
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Bem-vindo à sua jornada de Sucesso do Cliente! 🚀</h2>
          <p className="text-muted-foreground">Continue evoluindo através da nossa trilha de sucesso e atinja o potencial máximo do PDA Assessment na sua empresa.</p>
        </div>

        {/* Overall Progress */}
        <Card className="mb-8 gradient-card border-border/50">
          <CardHeader>
            <CardTitle>PROGRESSO GERAL</CardTitle>
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

        {/* Modules Grid */}
        <div className="space-y-4">
          <h3 className="text-2xl font-bold mb-4">Trilha de Sucesso</h3>
          <div className="grid gap-4">
            {modules.map(module => {
            const moduleProgress = getModuleProgress(module.id);
            const isCompleted = moduleProgress?.completed;
            const isWatched = moduleProgress?.video_watched;
            return <Card key={module.id} className={`gradient-card border-border/50 hover:border-primary/50 transition-all cursor-pointer ${isCompleted ? 'border-primary/50 bg-primary/5' : ''}`} onClick={() => navigate(`/module/${module.id}`)}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        {isCompleted ? (
                          <div className="relative">
                            <CheckCircle2 className="h-8 w-8 text-primary animate-in zoom-in duration-500" />
                            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" style={{ animationDuration: '2s' }} />
                          </div>
                        ) : (
                          <Circle className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-xl font-semibold">
                            {module.title}
                          </h4>
                        </div>
                        <p className="text-muted-foreground mb-4">
                          {module.description || 'Descrição não disponível'}
                        </p>
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4 text-sm">
                            {isWatched && <span className="flex items-center gap-1 text-primary">
                                <Play className="h-4 w-4" />
                                Vídeo assistido
                              </span>}
                            <Button size="sm" variant="outline">
                              {isCompleted ? 'REVISAR' : 'COMEÇAR'}
                            </Button>
                          </div>
                          <Button
                            size="sm"
                            variant={isCompleted ? "default" : "outline"}
                            className={isCompleted ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""}
                            onClick={(e) => toggleModuleCompletion(module.id, !!isCompleted, e)}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            {isCompleted ? 'Concluído' : 'Marcar como concluído'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>;
          })}
          </div>
        </div>
      </div>
    </div>;
}