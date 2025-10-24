import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

interface AIAnalysisProps {
  profileA: any;
  profileB: any;
}

export function AIAnalysis({ profileA, profileB }: AIAnalysisProps) {
  const [analysis, setAnalysis] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const generateAnalysis = async () => {
    if (!profileA?.analysis_result || !profileB?.analysis_result) {
      toast.error('Dados dos perfis incompletos');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-profile', {
        body: {
          profileA: {
            year: profileA.year,
            ...profileA.analysis_result,
          },
          profileB: {
            year: profileB.year,
            ...profileB.analysis_result,
          },
        },
      });

      if (error) {
        console.error('Error invoking function:', error);
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setAnalysis(data.analysis);
      toast.success('Análise gerada com sucesso!');
    } catch (error) {
      console.error('Error generating analysis:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao gerar análise');
    } finally {
      setLoading(false);
    }
  };

  if (!analysis && !loading) {
    return (
      <div className="text-center py-12">
        <Sparkles className="h-12 w-12 mx-auto mb-4 text-primary" />
        <h3 className="text-lg font-semibold mb-2">
          Análise Inteligente com Base de Conhecimento PDA
        </h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Gere uma análise profissional detalhada da evolução do perfil comportamental
          usando a base de conhecimento da Nanda
        </p>
        <Button onClick={generateAnalysis} className="gap-2">
          <Sparkles className="h-4 w-4" />
          Gerar Análise com IA
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="h-12 w-12 mx-auto mb-4 text-primary animate-spin" />
        <p className="text-muted-foreground">
          Analisando perfil com base de conhecimento PDA...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4" />
          Análise gerada pela Nanda
        </div>
        <Button variant="outline" size="sm" onClick={generateAnalysis} disabled={loading}>
          Gerar Nova Análise
        </Button>
      </div>
      <div className="prose prose-sm dark:prose-invert max-w-none">
        <ReactMarkdown>{analysis}</ReactMarkdown>
      </div>
    </div>
  );
}
