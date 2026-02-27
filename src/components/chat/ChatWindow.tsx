import { useEffect, useRef, useState, useCallback } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageBubble } from './MessageBubble';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender_name?: string;
}

interface ChatWindowProps {
  conversationId: string;
}

export function ChatWindow({ conversationId }: ChatWindowProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const profilesRef = useRef<Record<string, string>>({});

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = useCallback(async () => {
    const { data } = await (supabase as any)
      .from('chat_messages')
      .select('id, sender_id, content, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (!data) { setLoading(false); return; }

    // Fetch sender profiles
    const senderIds: string[] = Array.from(new Set(data.map((m: any) => String(m.sender_id))));
    const unknownIds = senderIds.filter((id: string) => !profilesRef.current[id]);
    if (unknownIds.length > 0) {
      const { data: profiles } = await (supabase as any)
        .from('public_profiles')
        .select('user_id, full_name')
        .in('user_id', unknownIds);
      (profiles || []).forEach((p: any) => {
        profilesRef.current[p.user_id] = p.full_name || 'Usuário';
      });
    }

    const enriched: Message[] = data.map((m: any) => ({
      ...m,
      sender_name: profilesRef.current[m.sender_id] || 'Usuário',
    }));

    setMessages(enriched);
    setLoading(false);
  }, [conversationId]);

  useEffect(() => {
    fetchMessages();

    // Mark as read
    if (user) {
      (supabase as any)
        .from('chat_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id)
        .then(() => {});
    }

    // Realtime subscription
    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload: any) => {
          const msg = payload.new;
          if (!profilesRef.current[msg.sender_id]) {
            const { data: profile } = await (supabase as any)
              .from('public_profiles')
              .select('full_name')
              .eq('user_id', msg.sender_id)
              .single();
            profilesRef.current[msg.sender_id] = profile?.full_name || 'Usuário';
          }
          setMessages(prev => [...prev, {
            id: msg.id,
            sender_id: msg.sender_id,
            content: msg.content,
            created_at: msg.created_at,
            sender_name: profilesRef.current[msg.sender_id],
          }]);
          // Mark as read
          if (user && msg.sender_id !== user.id) {
            (supabase as any)
              .from('chat_participants')
              .update({ last_read_at: new Date().toISOString() })
              .eq('conversation_id', conversationId)
              .eq('user_id', user.id)
              .then(() => {});
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, user, fetchMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !user || sending) return;
    setSending(true);
    const content = newMessage.trim();
    setNewMessage('');

    await (supabase as any)
      .from('chat_messages')
      .insert({ conversation_id: conversationId, sender_id: user.id, content });

    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading) {
    return <div className="flex-1 flex items-center justify-center text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-8">Nenhuma mensagem ainda. Diga olá! 👋</p>
        )}
        {messages.map(msg => (
          <MessageBubble
            key={msg.id}
            content={msg.content}
            createdAt={msg.created_at}
            isMine={msg.sender_id === user?.id}
            senderName={msg.sender_name}
          />
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="border-t p-3 flex gap-2">
        <Textarea
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Digite sua mensagem..."
          className="min-h-[44px] max-h-32 resize-none"
          rows={1}
        />
        <Button onClick={handleSend} disabled={!newMessage.trim() || sending} size="icon" className="shrink-0">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
