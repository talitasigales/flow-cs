import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';

interface Props {
  programId: string;
}

export function ProgramWelcomePopup({ programId }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [welcome, setWelcome] = useState<any>(null);

  useEffect(() => {
    if (!user || !programId) return;

    const check = async () => {
      // Check if dismissed
      const { data: dismissed } = await (supabase as any)
        .from('program_welcome_dismissed')
        .select('id')
        .eq('user_id', user.id)
        .eq('program_id', programId)
        .maybeSingle();

      if (dismissed) return;

      // Check if welcome message exists
      const { data: msg } = await (supabase as any)
        .from('program_welcome_messages')
        .select('*')
        .eq('program_id', programId)
        .eq('active', true)
        .maybeSingle();

      if (msg) {
        setWelcome(msg);
        setOpen(true);
      }
    };

    check();
  }, [user, programId]);

  const handleDismiss = async () => {
    setOpen(false);
    if (user) {
      await (supabase as any)
        .from('program_welcome_dismissed')
        .insert({ user_id: user.id, program_id: programId });
    }
  };

  if (!welcome) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleDismiss(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            {welcome.title || 'Bem-vindo!'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {welcome.message_type === 'video' && welcome.video_url ? (
            <video
              src={welcome.video_url}
              controls
              autoPlay
              className="w-full rounded-lg"
            />
          ) : (
            <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {welcome.content}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <Button onClick={handleDismiss}>Entendi</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
