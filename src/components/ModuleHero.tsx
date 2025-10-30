import { Button } from '@/components/ui/button';
import { Play, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Module {
  id: string;
  title: string;
  description: string;
  thumbnail_url?: string;
  duration_minutes?: number;
  category?: string;
}

interface UserProgress {
  module_id: string;
  completed: boolean;
  video_watched: boolean;
}

interface ModuleHeroProps {
  module: Module;
  progress?: UserProgress;
}

export function ModuleHero({ module, progress }: ModuleHeroProps) {
  const navigate = useNavigate();
  const isCompleted = progress?.completed;
  const progressPercent = progress?.video_watched ? 65 : 0;

  return (
    <div className="relative h-[45vh] min-h-[350px] w-full overflow-hidden rounded-xl">
      {/* Background Image with Gradient Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: module.thumbnail_url 
            ? `url(${module.thumbnail_url})` 
            : 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-glow)) 100%)',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative h-full flex items-end pb-8 px-12">
        <div className="max-w-2xl space-y-3">
          {/* Category Badge */}
          {module.category && (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-morphism text-sm font-medium">
              {module.category}
            </div>
          )}

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold gradient-text leading-tight">
            {module.title}
          </h1>

          {/* Description */}
          <p className="text-base text-muted-foreground max-w-xl">
            {module.description || 'Descrição não disponível'}
          </p>

          {/* Meta Info */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {module.duration_minutes && (
              <span>{module.duration_minutes} minutos</span>
            )}
            {isCompleted && (
              <span className="flex items-center gap-1 text-primary">
                <CheckCircle2 className="h-4 w-4" />
                Concluído
              </span>
            )}
          </div>

          {/* Progress Bar (if in progress) */}
          {progressPercent > 0 && !isCompleted && (
            <div className="w-full max-w-md space-y-2">
              <div className="h-1 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {progressPercent}% assistido
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-4 pt-2">
            <Button 
              size="default"
              className="gap-2 px-6"
              onClick={() => navigate(`/module/${module.id}`)}
            >
              <Play className="h-4 w-4" />
              {isCompleted ? 'Assistir Novamente' : progressPercent > 0 ? 'Continuar' : 'Começar'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
