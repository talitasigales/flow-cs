import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export default function ChatConversation() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [otherUser, setOtherUser] = useState<{ full_name: string | null; avatar_url: string | null } | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user || !conversationId) return;
    // Get other participant
    (async () => {
      const { data: participants } = await (supabase as any)
        .from('chat_participants')
        .select('user_id')
        .eq('conversation_id', conversationId)
        .neq('user_id', user.id);

      if (participants?.[0]) {
        const { data: profile } = await (supabase as any)
          .from('public_profiles')
          .select('full_name, avatar_url')
          .eq('user_id', participants[0].user_id)
          .single();
        setOtherUser(profile);
      }
    })();
  }, [user, conversationId]);

  if (authLoading || !user || !conversationId) return null;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="border-b px-4 py-3 flex items-center gap-3 shrink-0">
            <Button variant="ghost" size="icon" onClick={() => navigate('/messages')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Avatar className="h-8 w-8">
              {otherUser?.avatar_url && <AvatarImage src={otherUser.avatar_url} />}
              <AvatarFallback>{otherUser?.full_name?.charAt(0) || '?'}</AvatarFallback>
            </Avatar>
            <span className="font-semibold text-sm">{otherUser?.full_name || 'Carregando...'}</span>
          </div>
          {/* Chat */}
          <div className="flex-1 overflow-hidden">
            <ChatWindow conversationId={conversationId} />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
