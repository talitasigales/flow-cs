import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle, Clock, ExternalLink, Lock, MapPin, Play, Trophy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface Schedule {
  id: string;
  title: string;
  schedule_date: string;
  start_time: string | null;
  end_time: string | null;
  module_id: string | null;
  order_number: number | null;
}

interface JourneyTimelineProps {
  schedules: Schedule[];
  videoConferenceUrl?: string | null;
  specialist?: string | null;
}

export function JourneyTimeline({ schedules, videoConferenceUrl, specialist }: JourneyTimelineProps) {
  if (schedules.length === 0) return null;

  const today = new Date().toISOString().split('T')[0];
  const completedCount = schedules.filter(s => s.schedule_date < today).length;
  const todayIdx = schedules.findIndex(s => s.schedule_date === today);
  const progressPercent = Math.round((completedCount / schedules.length) * 100);
  const allDone = completedCount === schedules.length;

  return (
    <div className="space-y-4">
      {/* Progress header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{completedCount} de {schedules.length} encontros realizados</span>
          <span className={cn("font-semibold", allDone && "text-primary")}>{progressPercent}%</span>
        </div>
        <Progress value={progressPercent} className="h-2.5" />
        {allDone && (
          <div className="flex items-center gap-2 text-xs text-primary font-medium animate-in fade-in slide-in-from-bottom-2 duration-500">
            <Trophy className="w-4 h-4" />
            Jornada concluída! Parabéns!
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Connector line - split into completed and remaining */}
        <div className="absolute left-[19px] top-6 bottom-6 w-0.5 bg-border" />
        {completedCount > 0 && (
          <div
            className="absolute left-[19px] top-6 w-0.5 bg-primary transition-all duration-700 ease-out"
            style={{
              height: `calc(${((completedCount + (todayIdx >= 0 ? 0.5 : 0)) / schedules.length) * 100}% - 24px)`,
            }}
          />
        )}

        <div className="space-y-1">
          {schedules.map((s, idx) => {
            const isPast = s.schedule_date < today;
            const isToday = s.schedule_date === today;
            const isFuture = s.schedule_date > today;

            return (
              <div
                key={s.id}
                className={cn(
                  "relative flex items-start gap-4 p-3 rounded-lg transition-all",
                  isToday && "bg-primary/10 ring-1 ring-primary/30 shadow-sm",
                  isPast && "opacity-70",
                )}
              >
                {/* Dot */}
                <div className={cn(
                  "relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500",
                  isPast && "bg-primary border-primary text-primary-foreground shadow-sm",
                  isToday && "bg-primary border-primary text-primary-foreground ring-4 ring-primary/20 animate-pulse",
                  isFuture && "bg-muted border-border text-muted-foreground",
                )}>
                  {isPast ? (
                    <CheckCircle className="w-4.5 h-4.5" />
                  ) : isToday ? (
                    <Play className="w-4 h-4" />
                  ) : (
                    <span className="text-xs font-bold">{idx + 1}</span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={cn(
                      "text-sm font-semibold leading-tight",
                      isPast && "text-primary"
                    )}>
                      {s.title}
                    </p>
                    {isToday && (
                      <Badge className="text-[10px] px-1.5 py-0 h-4 animate-in fade-in">Hoje</Badge>
                    )}
                    {isPast && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-primary/10 text-primary border-0">
                        <CheckCircle className="w-2.5 h-2.5 mr-0.5" /> Concluído
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {format(new Date(s.schedule_date + 'T12:00:00'), "dd 'de' MMM", { locale: ptBR })}
                    </span>
                    {s.start_time && s.end_time && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {s.start_time.slice(0, 5)} – {s.end_time.slice(0, 5)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action */}
                {isToday && videoConferenceUrl && (
                  <Button size="sm" asChild className="shrink-0 gap-1.5 mt-1">
                    <a href={videoConferenceUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-3.5 h-3.5" />
                      Entrar na aula
                    </a>
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {specialist && (
        <p className="text-xs text-muted-foreground pt-1">
          Especialista: <span className="font-medium text-foreground">{specialist}</span>
        </p>
      )}
    </div>
  );
}
