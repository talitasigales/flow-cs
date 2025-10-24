import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AIAnalysisProps {
  profileA: any;
  profileB: any;
}

interface ParsedAnalysis {
  intro: string;
  sections: {
    title: string;
    content: string;
    subsections?: { title: string; content: string }[];
  }[];
}

const parseMarkdown = (markdown: string): ParsedAnalysis => {
  const lines = markdown.split('\n');
  const sections: ParsedAnalysis['sections'] = [];
  let intro = '';
  let currentSection: any = null;
  let currentSubsection: any = null;
  let isIntro = true;

  for (const line of lines) {
    if (line.startsWith('## ')) {
      isIntro = false;
      if (currentSection) sections.push(currentSection);
      currentSection = { title: line.replace('## ', '').trim(), content: '', subsections: [] };
      currentSubsection = null;
    } else if (line.startsWith('### ')) {
      if (currentSubsection && currentSection) {
        currentSection.subsections.push(currentSubsection);
      }
      currentSubsection = { title: line.replace('### ', '').trim(), content: '' };
    } else if (line.trim()) {
      if (isIntro) {
        intro += line + '\n';
      } else if (currentSubsection) {
        currentSubsection.content += line + '\n';
      } else if (currentSection) {
        currentSection.content += line + '\n';
      }
    }
  }

  if (currentSubsection && currentSection) {
    currentSection.subsections.push(currentSubsection);
  }
  if (currentSection) sections.push(currentSection);

  return { intro: intro.trim(), sections };
};

const renderContent = (content: string) => {
  return content.split('\n').map((line, idx) => {
    // Highlight bold text
    const boldRegex = /\*\*(.*?)\*\*/g;
    const parts = line.split(boldRegex);
    
    if (line.startsWith('*   **')) {
      return (
        <div key={idx} className="ml-4 mb-3 flex gap-2">
          <span className="text-primary mt-1">•</span>
          <div className="flex-1">
            {parts.map((part, i) => 
              i % 2 === 1 ? <strong key={i} className="text-foreground">{part}</strong> : <span key={i}>{part}</span>
            )}
          </div>
        </div>
      );
    }

    if (parts.length > 1) {
      return (
        <p key={idx} className="mb-2 leading-relaxed">
          {parts.map((part, i) => 
            i % 2 === 1 ? <strong key={i} className="text-foreground">{part}</strong> : <span key={i}>{part}</span>
          )}
        </p>
      );
    }

    return line ? <p key={idx} className="mb-2 leading-relaxed">{line}</p> : null;
  });
};

export function AIAnalysis({ profileA, profileB }: AIAnalysisProps) {
  const [analysis, setAnalysis] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [parsedAnalysis, setParsedAnalysis] = useState<ParsedAnalysis | null>(null);

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
      setParsedAnalysis(parseMarkdown(data.analysis));
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

  if (!parsedAnalysis) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <Badge variant="secondary">Análise gerada pela Nanda</Badge>
        </div>
        <Button variant="outline" size="sm" onClick={generateAnalysis} disabled={loading}>
          Gerar Nova Análise
        </Button>
      </div>

      {/* Intro */}
      {parsedAnalysis.intro && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">
              {renderContent(parsedAnalysis.intro)}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sections as Accordion */}
      <Accordion type="single" collapsible className="space-y-4">
        {parsedAnalysis.sections.map((section, idx) => (
          <AccordionItem key={idx} value={`section-${idx}`} className="border rounded-lg bg-card">
            <AccordionTrigger className="px-6 py-4 hover:no-underline">
              <div className="flex items-center gap-3 text-left">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-primary">{idx + 1}</span>
                </div>
                <h3 className="font-semibold text-lg">{section.title}</h3>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="space-y-4">
                {section.content && (
                  <div className="text-sm text-muted-foreground">
                    {renderContent(section.content)}
                  </div>
                )}

                {section.subsections && section.subsections.length > 0 && (
                  <div className="space-y-3">
                    {section.subsections.map((subsection, subIdx) => (
                      <Card key={subIdx} className="border-border/50">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-start gap-2">
                            <span className="text-primary mt-0.5">→</span>
                            <span>{subsection.title}</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground">
                          {renderContent(subsection.content)}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
