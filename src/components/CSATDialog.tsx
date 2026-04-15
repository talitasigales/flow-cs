import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CSATDialogProps {
  open: boolean;
  question: string;
  onSubmit: (rating: number, comment: string) => void;
  onDismiss: () => void;
}

export function CSATDialog({ open, question, onSubmit, onDismiss }: CSATDialogProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (rating === 0) return;
    setSubmitted(true);
    onSubmit(rating, comment);
    setTimeout(() => {
      setSubmitted(false);
      setRating(0);
      setComment('');
    }, 300);
  };

  const ratingLabels = ['', 'Muito ruim', 'Ruim', 'Regular', 'Bom', 'Excelente'];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onDismiss()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">📊 Pesquisa de Satisfação</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Sua opinião nos ajuda a melhorar!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-sm font-medium">{question}</p>

          {/* Star rating */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={cn(
                      'h-8 w-8 transition-colors',
                      (hoveredRating || rating) >= star
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground/30'
                    )}
                  />
                </button>
              ))}
            </div>
            {(hoveredRating || rating) > 0 && (
              <span className="text-xs text-muted-foreground">
                {ratingLabels[hoveredRating || rating]}
              </span>
            )}
          </div>

          {/* Comment */}
          <Textarea
            placeholder="Deixe um comentário (opcional)..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            className="resize-none"
          />

          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={onDismiss}>
              Pular
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={rating === 0}
              className="gradient-primary"
            >
              Enviar Avaliação
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
