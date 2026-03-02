import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import nandaAvatar from '@/assets/nanda-avatar.png';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const ChatbotNanda = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '👋 Olá! Que bom ter você aqui!\n\nSou a Nanda, sua parceira de desenvolvimento humano especializada em PDA e PDI. 💚\n\nPosso ajudar você com:\n• Entender os eixos comportamentais REPNA\n• Orientar sobre criação e acompanhamento de PDIs\n• Esclarecer dúvidas sobre perfis comportamentais\n• Dar dicas de desenvolvimento baseadas nos modelos PDA\n\nComo posso ajudar você hoje?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Preload avatar image
  useEffect(() => {
    const img = new Image();
    img.src = nandaAvatar;
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('nanda-chat', {
        body: { messages: [...messages, userMessage] }
      });

      // Check for Supabase error with response data
      if (error) {
        console.error('Supabase error:', error);
        // Try to extract error message from the response
        const errorMessage = (error as any)?.context?.body?.error || error.message;
        throw new Error(errorMessage);
      }

      // Check for error in the response data
      if (data?.error) {
        throw new Error(data.error);
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.choices[0].message.content,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Chat error:', error);
      
      // Handle specific error messages
      let errorDescription = error.message || 'Tente novamente em alguns instantes.';
      
      // If it's the generic Supabase error, try to get more details
      if (errorDescription.includes('non-2xx status code')) {
        errorDescription = 'Erro ao se comunicar com o servidor. Tente novamente.';
      }
      
      toast({
        title: 'Erro ao enviar mensagem',
        description: errorDescription,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Não renderizar se o usuário não estiver autenticado
  if (!user) {
    return null;
  }

  return (
    <>
      {/* Floating Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 h-24 w-24 rounded-full shadow-lg gradient-primary z-50 p-0 overflow-hidden"
        size="icon"
      >
        {isOpen ? (
          <X className="h-10 w-10" />
        ) : (
          <img src={nandaAvatar} alt="Nanda" className="h-24 w-24 object-cover rounded-full" loading="eager" />
        )}
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-24 right-6 w-96 h-[500px] shadow-2xl z-50 gradient-card border-border/50 flex flex-col">
          <CardHeader className="border-b border-border/50">
            <CardTitle className="flex items-center gap-2">
              <img src={nandaAvatar} alt="Nanda" className="h-12 w-12 rounded-full object-cover" loading="eager" />
              Nanda - Assistente PDA
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-2 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <img src={nandaAvatar} alt="Nanda" className="h-12 w-12 rounded-full object-cover mt-1 flex-shrink-0" loading="eager" />
                )}
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                </div>
              </div>
            ))}
          </CardContent>
          <div className="p-4 border-t border-border/50">
            <div className="flex gap-2">
              <Input
                placeholder="Digite sua pergunta..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSend()}
                disabled={isLoading}
              />
              <Button onClick={handleSend} size="icon" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </>
  );
};
