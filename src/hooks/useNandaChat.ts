import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const WELCOME_MESSAGE: Message = {
  role: 'assistant',
  content: 'Olá! Sou a Nanda, especialista em desenvolvimento humano e PDA.\n\nPosso ajudar você com:\n\n• Entender os eixos comportamentais REPNA\n• Orientar sobre criação e acompanhamento de PDIs\n• Esclarecer dúvidas sobre perfis comportamentais\n• Dar dicas de desenvolvimento baseadas nos modelos PDA\n\nComo posso ajudar?',
};

export function useNandaChat(userId: string | undefined) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const hasLoaded = useRef(false);

  // Load history from DB
  useEffect(() => {
    if (!userId || hasLoaded.current) return;
    hasLoaded.current = true;

    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('nanda_messages' as any)
          .select('role, content')
          .eq('user_id', userId)
          .order('created_at', { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          setMessages(data.map((m: any) => ({ role: m.role, content: m.content })));
        } else {
          // First time: show welcome and persist it
          setMessages([WELCOME_MESSAGE]);
          await supabase.from('nanda_messages' as any).insert({
            user_id: userId,
            role: WELCOME_MESSAGE.role,
            content: WELCOME_MESSAGE.content,
          } as any);
        }
      } catch (err) {
        console.error('Error loading nanda history:', err);
        setMessages([WELCOME_MESSAGE]);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    load();
  }, [userId]);

  const saveMessage = async (msg: Message) => {
    if (!userId) return;
    try {
      await supabase.from('nanda_messages' as any).insert({
        user_id: userId,
        role: msg.role,
        content: msg.content,
      } as any);
    } catch (err) {
      console.error('Error saving nanda message:', err);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    // Save user message
    await saveMessage(userMessage);

    try {
      // Send only last 30 messages for context window
      const contextMessages = updatedMessages.slice(-30);

      const { data, error } = await supabase.functions.invoke('nanda-chat', {
        body: { messages: contextMessages },
      });

      if (error) {
        const errorMessage = (error as any)?.context?.body?.error || error.message;
        throw new Error(errorMessage);
      }

      if (data?.error) throw new Error(data.error);

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.choices[0].message.content,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      await saveMessage(assistantMessage);
    } catch (error: any) {
      console.error('Chat error:', error);
      let errorDescription = error.message || 'Tente novamente em alguns instantes.';
      if (errorDescription.includes('non-2xx status code')) {
        errorDescription = 'Erro ao se comunicar com o servidor. Tente novamente.';
      }
      throw new Error(errorDescription);
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = async () => {
    if (!userId) return;
    try {
      await supabase.from('nanda_messages' as any).delete().eq('user_id', userId);
      setMessages([WELCOME_MESSAGE]);
      await saveMessage(WELCOME_MESSAGE);
    } catch (err) {
      console.error('Error clearing history:', err);
    }
  };

  return { messages, input, setInput, isLoading, isLoadingHistory, handleSend, clearHistory };
}
