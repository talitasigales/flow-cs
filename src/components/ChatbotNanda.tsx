import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { X, Send, Loader2, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useNandaChat } from '@/hooks/useNandaChat';
import nandaAvatar from '@/assets/nanda-avatar.png';
import ReactMarkdown from 'react-markdown';

export const ChatbotNanda = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, input, setInput, isLoading, isLoadingHistory, handleSend, clearHistory } = useNandaChat(user?.id);

  // Preload avatar image
  useEffect(() => {
    const img = new Image();
    img.src = nandaAvatar;
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const onSend = async () => {
    try {
      await handleSend();
    } catch (error: any) {
      toast({
        title: 'Erro ao enviar mensagem',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (!user || isHidden) return null;

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsHidden(true)}
          className="fixed bottom-[6.5rem] right-5 h-7 w-7 rounded-full bg-muted/90 backdrop-blur-sm border border-border/50 shadow-md z-50 flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors"
          aria-label="Fechar Nanda"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}

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

      {isOpen && (
        <Card className="fixed bottom-24 right-6 w-96 h-[500px] shadow-2xl z-50 gradient-card border-border/50 flex flex-col">
          <CardHeader className="border-b border-border/50 flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="flex items-center gap-2">
              <img src={nandaAvatar} alt="Nanda" className="h-12 w-12 rounded-full object-cover" loading="eager" />
              Nanda - Assistente PDA
            </CardTitle>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={clearHistory} title="Limpar histórico">
              <Trash2 className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {isLoadingHistory ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <img src={nandaAvatar} alt="Nanda" className="h-12 w-12 rounded-full object-cover mt-1 flex-shrink-0" loading="eager" />
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}
                  >
                    <div className="text-sm prose prose-sm dark:prose-invert prose-p:my-1 prose-headings:my-2 max-w-none">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex gap-2 justify-start">
                <img src={nandaAvatar} alt="Nanda" className="h-12 w-12 rounded-full object-cover mt-1 flex-shrink-0" loading="eager" />
                <div className="bg-muted rounded-lg p-3">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </CardContent>
          <div className="p-4 border-t border-border/50">
            <div className="flex gap-2">
              <Input
                placeholder="Digite sua pergunta..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isLoading && onSend()}
                disabled={isLoading}
              />
              <Button onClick={onSend} size="icon" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </>
  );
};
