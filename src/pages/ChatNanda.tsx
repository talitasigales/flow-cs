import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import nandaAvatar from '@/assets/nanda-avatar.png';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatNanda() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Olá! Sou a Nanda, sua assistente especialista em PDA (Personal Development Assessment). Posso ajudá-lo com análises comportamentais, interpretação de perfis REPNA, evolução de competências e muito mais. Como posso ajudá-lo hoje?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

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

      if (error) {
        console.error('Supabase error:', error);
        const errorMessage = (error as any)?.context?.body?.error || error.message;
        throw new Error(errorMessage);
      }

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
      
      let errorDescription = error.message || 'Tente novamente em alguns instantes.';
      
      if (errorDescription.includes('non-2xx status code')) {
        errorDescription = 'Erro ao se comunicar com o servidor. Tente novamente.';
      }
      
      toast.error(errorDescription);
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/50 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              <div className="flex items-center gap-3">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={nandaAvatar} alt="Nanda" />
                  <AvatarFallback>N</AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-2xl font-bold gradient-text">
                    Chat com Nanda
                  </h1>
                  <p className="text-sm text-muted-foreground">Assistente Especialista em PDA</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-5xl">
        <Card className="gradient-card border-border/50 h-[calc(100vh-200px)] flex flex-col">
          <CardHeader className="border-b border-border/50">
            <CardTitle className="flex items-center gap-2">
              <Avatar className="h-12 w-12">
                <AvatarImage src={nandaAvatar} alt="Nanda" />
                <AvatarFallback>N</AvatarFallback>
              </Avatar>
              Conversa com a Nanda
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <Avatar className="h-14 w-14 mt-1 flex-shrink-0">
                    <AvatarImage src={nandaAvatar} alt="Nanda" />
                    <AvatarFallback>N</AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`max-w-[80%] rounded-lg p-4 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                </div>
                {message.role === 'user' && (
                  <Avatar className="h-10 w-10 mt-1 flex-shrink-0">
                    <AvatarFallback>{user?.email?.[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <Avatar className="h-14 w-14 mt-1 flex-shrink-0">
                  <AvatarImage src={nandaAvatar} alt="Nanda" />
                  <AvatarFallback>N</AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-lg p-4">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              </div>
            )}
          </CardContent>
          <div className="p-6 border-t border-border/50">
            <div className="flex gap-3">
              <Input
                placeholder="Digite sua pergunta sobre PDA, perfis comportamentais, análises..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSend()}
                disabled={isLoading}
                className="flex-1"
              />
              <Button onClick={handleSend} disabled={isLoading} className="gradient-primary">
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
