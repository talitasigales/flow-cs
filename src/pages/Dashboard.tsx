import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ChangePasswordDialog } from '@/components/ChangePasswordDialog';
import { usePasswordCheck } from '@/hooks/usePasswordCheck';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { ModuleHero } from '@/components/ModuleHero';
import { ModuleCarousel } from '@/components/ModuleCarousel';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';

interface Module {
  id: string;
  title: string;
  description: string | null;
  order_number: number;
  video_url: string | null;
  thumbnail_url: string | null;
}

interface UserProgress {
  module_id: string;
  completed: boolean | null;
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
    markPasswordChanged
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
      } = await supabase.from('modules').select('*').order('order_number');
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

  // Get modules not started
  const notStartedModules = modules.filter(module => {
    const prog = getModuleProgress(module.id);
    return !prog?.completed;
  });

  // Get completed modules
  const completedModules = modules.filter(module => {
    const prog = getModuleProgress(module.id);
    return prog?.completed;
  });

  // Get module for hero section (first incomplete or first module)
  const heroModule = notStartedModules[0] || modules[0];

  if (authLoading || loading || passwordCheckLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (needsPasswordChange) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <ChangePasswordDialog onPasswordChanged={markPasswordChanged} />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto px-6 py-8 space-y-8">
            {/* Overall Progress - Modern Tech Design */}
            <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-card/80 via-card/60 to-primary/5 backdrop-blur-xl">
              {/* Animated background effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary-glow/10 animate-pulse opacity-50" />
              
              <div className="relative p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold gradient-text mb-2">Progresso Geral</h2>
                    <p className="text-sm text-muted-foreground">
                      {progress.filter(p => p.completed).length} de {modules.length} módulos concluídos
                    </p>
                  </div>
                  
                  {/* Circular Progress Indicator */}
                  <div className="relative w-24 h-24">
                    <svg className="transform -rotate-90 w-24 h-24">
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        stroke="currentColor"
                        strokeWidth="6"
                        fill="transparent"
                        className="text-muted/20"
                      />
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        stroke="url(#gradient)"
                        strokeWidth="6"
                        fill="transparent"
                        strokeDasharray={`${2 * Math.PI * 40}`}
                        strokeDashoffset={`${2 * Math.PI * 40 * (1 - calculateOverallProgress() / 100)}`}
                        className="transition-all duration-1000 ease-out"
                        strokeLinecap="round"
                      />
                      <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="hsl(var(--primary))" />
                          <stop offset="100%" stopColor="hsl(var(--primary-glow))" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xl font-bold gradient-text">{calculateOverallProgress()}%</span>
                    </div>
                  </div>
                </div>

                {/* Progress Bar with Glow Effect */}
                <div className="relative">
                  <div className="h-2 bg-muted/20 rounded-full overflow-hidden backdrop-blur">
                    <div 
                      className="h-full bg-gradient-to-r from-primary via-primary-glow to-primary rounded-full transition-all duration-1000 ease-out relative"
                      style={{ width: `${calculateOverallProgress()}%` }}
                    >
                      <div className="absolute inset-0 bg-white/20 animate-pulse" />
                    </div>
                  </div>
                  
                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-4 mt-6">
                    <div className="glass-morphism p-4 rounded-lg border border-primary/10">
                      <p className="text-xs text-muted-foreground mb-1">Concluídos</p>
                      <p className="text-2xl font-bold text-primary">{progress.filter(p => p.completed).length}</p>
                    </div>
                    <div className="glass-morphism p-4 rounded-lg border border-primary/10">
                      <p className="text-xs text-muted-foreground mb-1">Pendentes</p>
                      <p className="text-2xl font-bold text-primary-glow">{notStartedModules.length}</p>
                    </div>
                    <div className="glass-morphism p-4 rounded-lg border border-primary/10">
                      <p className="text-xs text-muted-foreground mb-1">Total</p>
                      <p className="text-2xl font-bold">{modules.length}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Hero Section */}
            {heroModule && (
              <ModuleHero 
                module={heroModule} 
                progress={getModuleProgress(heroModule.id)}
              />
            )}

            {/* Available Modules */}
            {notStartedModules.length > 0 && (
              <ModuleCarousel 
                title="Módulos Disponíveis" 
                modules={notStartedModules}
                progressData={progress}
              />
            )}

            {/* Completed */}
            {completedModules.length > 0 && (
              <ModuleCarousel 
                title="Módulos Concluídos" 
                modules={completedModules}
                progressData={progress}
              />
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
