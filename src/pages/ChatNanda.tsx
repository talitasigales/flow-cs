import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, Send, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNandaChat } from '@/hooks/useNandaChat';
import nandaAvatar from '@/assets/nanda-avatar.png';
import ReactMarkdown from 'react-markdown';

export default function ChatNanda() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, input, setInput, isLoading, isLoadingHistory, handleSend, clearHistory } = useNandaChat(user?.id);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const onSend = async () => {
    try {
      await handleSend();
    } catch (error: any) {
      let errorDescription = error.message || 'Tente novamente em alguns instantes.';
      toast.error(errorDescription);
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
                  <h1 className="text-2xl font-bold gradient-text">Chat com Nanda</h1>
                  <p className="text-sm text-muted-foreground">Assistente Especialista em PDA</p>
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={clearHistory}>
              <Trash2 className="mr-2 h-4 w-4" />
              Limpar histórico
            </Button>
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
            {isLoadingHistory ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <Avatar className="h-14 w-14 mt-1 flex-shrink-0">
                      <AvatarImage src={nandaAvatar} alt="Nanda" />
                      <AvatarFallback>N</AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg p-4 ${
                      message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}
                  >
                    <div className="text-sm leading-relaxed prose prose-sm dark:prose-invert prose-p:my-1 prose-headings:my-2 max-w-none">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  </div>
                  {message.role === 'user' && (
                    <Avatar className="h-10 w-10 mt-1 flex-shrink-0">
                      <AvatarFallback>{user?.email?.[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))
            )}
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
            <div ref={messagesEndRef} />
          </CardContent>
          <div className="p-6 border-t border-border/50">
            <div className="flex gap-3">
              <Input
                placeholder="Digite sua pergunta sobre PDA, perfis comportamentais, análises..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isLoading && onSend()}
                disabled={isLoading}
                className="flex-1"
              />
              <Button onClick={onSend} disabled={isLoading} className="gradient-primary">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
