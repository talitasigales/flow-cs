import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MessageSquare } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Conversation {
  id: string;
  updated_at: string;
  other_user: {
    user_id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  last_message: string | null;
  unread_count: number;
}

export function ConversationList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchConversations();
  }, [user]);

  const fetchConversations = async () => {
    if (!user) return;
    setLoading(true);

    // Get all conversations the user participates in
    const { data: participations } = await (supabase as any)
      .from('chat_participants')
      .select('conversation_id, last_read_at')
      .eq('user_id', user.id);

    if (!participations || participations.length === 0) {
      setConversations([]);
      setLoading(false);
      return;
    }

    const convIds = participations.map((p: any) => p.conversation_id);
    const lastReadMap: Record<string, string> = {};
    participations.forEach((p: any) => { lastReadMap[p.conversation_id] = p.last_read_at; });

    // Get conversations
    const { data: convs } = await (supabase as any)
      .from('chat_conversations')
      .select('id, updated_at')
      .in('id', convIds)
      .order('updated_at', { ascending: false });

    if (!convs) { setConversations([]); setLoading(false); return; }

    // Get other participants
    const { data: allParticipants } = await (supabase as any)
      .from('chat_participants')
      .select('conversation_id, user_id')
      .in('conversation_id', convIds)
      .neq('user_id', user.id);

    const otherUserIds = [...new Set((allParticipants || []).map((p: any) => p.user_id))];
    let profilesMap: Record<string, any> = {};
    if (otherUserIds.length > 0) {
      const { data: profiles } = await (supabase as any)
        .from('public_profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', otherUserIds);
      (profiles || []).forEach((p: any) => { profilesMap[p.user_id] = p; });
    }

    // Get last message per conversation
    const enriched: Conversation[] = [];
    for (const conv of convs) {
      const { data: lastMsg } = await (supabase as any)
        .from('chat_messages')
        .select('content, created_at')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: false })
        .limit(1);

      // Count unread
      const { count } = await (supabase as any)
        .from('chat_messages')
        .select('id', { count: 'exact', head: true })
        .eq('conversation_id', conv.id)
        .gt('created_at', lastReadMap[conv.id] || '1970-01-01')
        .neq('sender_id', user.id);

      const otherParticipant = (allParticipants || []).find((p: any) => p.conversation_id === conv.id);
      const otherProfile = otherParticipant ? profilesMap[otherParticipant.user_id] : null;

      enriched.push({
        id: conv.id,
        updated_at: conv.updated_at,
        other_user: otherProfile || (otherParticipant ? { user_id: otherParticipant.user_id, full_name: 'Usuário', avatar_url: null } : null),
        last_message: lastMsg?.[0]?.content || null,
        unread_count: count || 0,
      });
    }

    setConversations(enriched);
    setLoading(false);
  };

  if (loading) {
    return <div className="p-6 text-center text-muted-foreground">Carregando conversas...</div>;
  }

  if (conversations.length === 0) {
    return (
      <div className="p-8 text-center space-y-3">
        <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50" />
        <p className="text-muted-foreground">Nenhuma conversa ainda</p>
        <p className="text-xs text-muted-foreground">Envie uma mensagem a partir de um post na comunidade!</p>
      </div>
    );
  }

  return (
    <div className="divide-y">
      {conversations.map(conv => (
        <button
          key={conv.id}
          onClick={() => navigate(`/messages/${conv.id}`)}
          className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors text-left"
        >
          <Avatar className="h-10 w-10 shrink-0">
            {conv.other_user?.avatar_url && <AvatarImage src={conv.other_user.avatar_url} />}
            <AvatarFallback>{conv.other_user?.full_name?.charAt(0) || '?'}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm truncate">{conv.other_user?.full_name || 'Usuário'}</span>
              <span className="text-[10px] text-muted-foreground shrink-0">
                {formatDistanceToNow(new Date(conv.updated_at), { addSuffix: true, locale: ptBR })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground truncate">{conv.last_message || 'Sem mensagens'}</p>
              {conv.unread_count > 0 && (
                <Badge className="ml-2 shrink-0 h-5 min-w-5 flex items-center justify-center rounded-full text-[10px]">
                  {conv.unread_count}
                </Badge>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
