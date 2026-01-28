import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { CheckCircle2, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface Module {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
}

interface UserProgress {
  module_id: string;
  completed: boolean | null;
}

interface ModuleCarouselProps {
  title: string;
  modules: Module[];
  progressData: UserProgress[];
}

export function ModuleCarousel({ title, modules, progressData }: ModuleCarouselProps) {
  const navigate = useNavigate();

  const getProgress = (moduleId: string) => {
    return progressData.find(p => p.module_id === moduleId);
  };

  if (modules.length === 0) return null;

  return (
    <div className="space-y-4 mb-12">
      <h2 className="text-2xl font-bold px-2">{title}</h2>
      
      <Carousel
        opts={{
          align: "start",
          loop: false,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-4">
          {modules.map((module) => {
            const progress = getProgress(module.id);
            const isCompleted = progress?.completed;

            return (
              <CarouselItem key={module.id} className="pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5">
                <Card 
                  className={cn(
                    "group relative overflow-hidden cursor-pointer border-border/50 transition-all duration-300",
                    "hover:scale-105 hover:shadow-2xl hover:shadow-primary/20 hover:border-primary/50",
                    isCompleted && "border-primary/30"
                  )}
                  onClick={() => navigate(`/module/${module.id}`)}
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video overflow-hidden bg-muted">
                    {module.thumbnail_url ? (
                      <img 
                        src={module.thumbnail_url} 
                        alt={module.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary-glow/20 flex items-center justify-center">
                        <Play className="h-12 w-12 text-primary/50" />
                      </div>
                    )}
                    
                    {/* Overlay on Hover */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <Button size="icon" variant="secondary" className="rounded-full h-12 w-12">
                        <Play className="h-6 w-6" />
                      </Button>
                    </div>

                    {/* Completion Badge */}
                    {isCompleted && (
                      <div className="absolute top-2 right-2 bg-primary/90 backdrop-blur rounded-full p-1.5">
                        <CheckCircle2 className="h-4 w-4 text-primary-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Card Content */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold group-hover:text-primary transition-colors flex-1">
                        {module.title}
                      </h3>
                      <Button
                        size="icon"
                        variant="ghost"
                        className={cn(
                          "h-8 w-8 shrink-0 transition-colors",
                          isCompleted && "text-primary hover:text-primary"
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('Toggle completion for module:', module.id);
                        }}
                      >
                        <CheckCircle2 className={cn(
                          "h-5 w-5",
                          isCompleted ? "fill-current" : "stroke-current"
                        )} />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {module.description || 'Descrição não disponível'}
                    </p>
                  </div>
                </Card>
              </CarouselItem>
            );
          })}
        </CarouselContent>
        <CarouselPrevious className="hidden md:flex -left-4" />
        <CarouselNext className="hidden md:flex -right-4" />
      </Carousel>
    </div>
  );
}
