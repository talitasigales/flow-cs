import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface MessageBubbleProps {
  content: string;
  createdAt: string;
  isMine: boolean;
  senderName?: string;
}

export function MessageBubble({ content, createdAt, isMine, senderName }: MessageBubbleProps) {
  return (
    <div className={cn('flex flex-col max-w-[75%] gap-1', isMine ? 'ml-auto items-end' : 'items-start')}>
      {!isMine && senderName && (
        <span className="text-xs text-muted-foreground font-medium px-1">{senderName}</span>
      )}
      <div
        className={cn(
          'rounded-2xl px-4 py-2 text-sm break-words',
          isMine
            ? 'bg-primary text-primary-foreground rounded-br-md'
            : 'bg-muted rounded-bl-md'
        )}
      >
        <p className="whitespace-pre-wrap">{content}</p>
      </div>
      <span className="text-[10px] text-muted-foreground px-1">
        {formatDistanceToNow(new Date(createdAt), { addSuffix: true, locale: ptBR })}
      </span>
    </div>
  );
}
