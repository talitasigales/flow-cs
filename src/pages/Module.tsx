import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, ArrowRight, CheckCircle2, Download, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { ModuleMaterials } from '@/components/ModuleMaterials';

// Função para converter URLs do YouTube para formato embed
const getYouTubeEmbedUrl = (url: string): string => {
  if (!url) return '';
  
  // Se já estiver no formato embed, retorna como está
  if (url.includes('youtube.com/embed/')) {
    return url;
  }
  
  // Extrai o ID do vídeo de diferentes formatos de URL do YouTube
  let videoId = '';
  
  // Formato: https://www.youtube.com/watch?v=VIDEO_ID
  const watchMatch = url.match(/[?&]v=([^&#]+)/);
  if (watchMatch) {
    videoId = watchMatch[1];
  }
  
  // Formato: https://youtu.be/VIDEO_ID
  const shortMatch = url.match(/youtu\.be\/([^?&#]+)/);
  if (shortMatch) {
    videoId = shortMatch[1];
  }
  
  // Se encontrou um ID de vídeo, retorna a URL embed
  if (videoId) {
    return `https://www.youtube.com/embed/${videoId}`;
  }
  
  // Se não for YouTube, retorna a URL original
  return url;
};

interface Module {
  id: string;
  title: string;
  description: string | null;
  order_number: number;
  video_url: string | null;
}

interface UserProgress {
  id?: string;
  module_id: string;
  completed: boolean | null;
  completed_at?: string | null;
}

export default function Module() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [module, setModule] = useState<Module | null>(null);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [allModules, setAllModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && moduleId) {
      fetchModuleData();
    }
  }, [user, moduleId]);

  const fetchModuleData = async () => {
    try {
      // Fetch all modules for navigation
      const { data: modulesData, error: modulesError } = await supabase
        .from('modules')
        .select('*')
        .order('order_number');
      if (modulesError) throw modulesError;
      setAllModules(modulesData || []);

      // Fetch current module
      const { data: moduleData, error: moduleError } = await supabase
        .from('modules')
        .select('*')
        .eq('id', moduleId)
        .single();
      if (moduleError) throw moduleError;
      setModule(moduleData);

      // Log module access
      await supabase.rpc('log_user_action', {
        _action: 'MODULE_ACCESS',
        _table_name: 'modules',
        _record_id: moduleData.id,
        _new_data: { module_title: moduleData.title, module_order: moduleData.order_number },
      }).then(({ error }) => {
        if (error) console.error('Failed to log MODULE_ACCESS:', error);
      });
      // Fetch user progress
      const { data: progressData, error: progressError } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user?.id)
        .eq('module_id', moduleId)
        .maybeSingle();
      if (progressError) throw progressError;
      
      if (progressData) {
        setProgress(progressData);
      } else {
        // Create initial progress record
        const { data: newProgress, error: createError } = await supabase
          .from('user_progress')
          .insert({
            user_id: user?.id,
            module_id: moduleId,
            completed: false
          })
          .select()
          .single();
        if (createError) throw createError;
        setProgress(newProgress);
      }
    } catch (error) {
      console.error('Error fetching module data:', error);
      toast.error('Erro ao carregar módulo');
    } finally {
      setLoading(false);
    }
  };

  const updateProgress = async (updates: Partial<UserProgress>) => {
    if (!progress || !user) return;
    try {
      const { error } = await supabase
        .from('user_progress')
        .update(updates)
        .eq('id', progress.id);
      if (error) throw error;
      setProgress({ ...progress, ...updates });
      toast.success('Progresso atualizado!');
    } catch (error) {
      console.error('Error updating progress:', error);
      toast.error('Erro ao atualizar progresso');
    }
  };

  const markModuleComplete = async () => {
    await updateProgress({
      completed: true,
      completed_at: new Date().toISOString()
    });
    // Log the completion for admin audit trail
    if (module) {
      const { error } = await supabase.rpc('log_user_action', {
        _action: 'MODULE_COMPLETED',
        _table_name: 'modules',
        _record_id: module.id,
        _new_data: { module_title: module.title, module_order: module.order_number },
      });
      if (error) console.error('Failed to log MODULE_COMPLETED:', error);
    }
  };

  const getCurrentModuleIndex = () => {
    return allModules.findIndex(m => m.id === moduleId);
  };

  const navigateToModule = (direction: 'prev' | 'next') => {
    const currentIndex = getCurrentModuleIndex();
    const targetIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex >= 0 && targetIndex < allModules.length) {
      navigate(`/module/${allModules[targetIndex].id}`);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!module) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Módulo não encontrado</h2>
          <Button onClick={() => navigate('/dashboard')}>Voltar ao Dashboard</Button>
        </div>
      </div>
    );
  }

  const currentIndex = getCurrentModuleIndex();
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < allModules.length - 1;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/50 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Módulo {module.order_number} de {allModules.length}
              </span>
              <Progress value={(module.order_number / allModules.length) * 100} className="w-24" />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-6xl">
        {/* Module Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold gradient-text mb-2">
                {module.title}
              </h1>
              <p className="text-lg text-muted-foreground">
                {module.description || 'Descrição não disponível'}
              </p>
            </div>
            {progress?.completed && (
              <div className="flex items-center gap-2 text-success">
                <CheckCircle2 className="h-6 w-6" />
                <span className="font-semibold">Completo</span>
              </div>
            )}
          </div>
        </div>

        {/* Video Section */}
        <Card className="mb-8 gradient-card border-border/50">
          <CardHeader>
            <CardTitle>Vídeo do Módulo</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="aspect-video bg-muted rounded-lg mb-4 overflow-hidden relative"
              onFocus={() => {
                if (module.video_url) {
                  supabase.rpc('log_user_action', {
                    _action: 'VIDEO_PLAY',
                    _table_name: 'modules',
                    _record_id: module.id,
                    _new_data: { module_title: module.title, video_url: module.video_url },
                  });
                }
              }}
            >
              {module.video_url ? (
                <iframe
                  src={getYouTubeEmbedUrl(module.video_url)}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">Vídeo em breve</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Module Materials Library */}
        <div className="mb-8">
          <ModuleMaterials moduleId={moduleId!} />
        </div>

        {/* Complete Module Section */}
        {!progress?.completed && (
          <Card className="mb-8 border-primary/50 bg-primary/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Finalizou?</h3>
                  <p className="text-sm text-muted-foreground">
                    Marque como completo para continuar sua jornada
                  </p>
                </div>
                <Button onClick={markModuleComplete} size="lg" className="gradient-primary">
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                  Marcar como Completo
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Separator className="my-8" />

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => navigateToModule('prev')} disabled={!hasPrevious}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Módulo anterior
          </Button>
          <Button onClick={() => navigate('/dashboard')} variant="ghost">
            Ver Todos os Módulos
          </Button>
          <Button variant="outline" onClick={() => navigateToModule('next')} disabled={!hasNext}>
            Próximo módulo
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
