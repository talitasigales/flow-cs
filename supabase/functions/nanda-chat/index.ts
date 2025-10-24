import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Extrair keywords da pergunta do usuário
    const userQuestion = messages[messages.length - 1]?.content || '';
    const keywords = userQuestion.toLowerCase()
      .split(/\s+/)
      .filter((word: string) => word.length > 3)
      .slice(0, 5);

    // Buscar contexto relevante na base de conhecimento
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.39.3');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: knowledgeDocs } = await supabase
      .from('knowledge_base')
      .select('title, content, category')
      .or(`keywords.cs.{${keywords.join(',')}},content.ilike.%${keywords[0]}%`)
      .limit(3);

    let contextInfo = '';
    if (knowledgeDocs && knowledgeDocs.length > 0) {
      contextInfo = '\n\n📚 CONTEXTO DA BASE DE CONHECIMENTO:\n' + 
        knowledgeDocs.map(doc => `[${doc.category}] ${doc.title}:\n${doc.content}`).join('\n\n');
    }

    const systemPrompt = `Você é a Nanda, uma assistente virtual especializada em PDA Assessment (Personal Development Analysis).

SOBRE PDA ASSESSMENT:
O PDA Assessment é uma ferramenta de avaliação comportamental que analisa quatro eixos principais:
1. DOMINÂNCIA (D): Força, determinação, competitividade, assertividade
2. INFLUÊNCIA (I): Sociabilidade, comunicação, entusiasmo, persuasão
3. ESTABILIDADE (S): Paciência, colaboração, consistência, diplomacia
4. CONFORMIDADE (C): Precisão, análise, qualidade, metodologia

MATRIZ 9BOX:
A Matriz 9Box é uma ferramenta de avaliação de desempenho e potencial que cruza:
- Eixo X: Aderência ao Cargo (baixa, média, alta)
- Eixo Y: Performance (baixa, média, alta)
Criando 9 quadrantes para classificar colaboradores e definir planos de desenvolvimento.

CONSTRUÇÃO DE CARGOS:
O sistema permite criar descrições completas de cargos incluindo:
- Competências técnicas necessárias
- Competências comportamentais (baseadas no PDA)
- Requisitos e responsabilidades
- Perfil comportamental ideal para o cargo

EVOLUÇÃO DE PERFIL:
Permite análise comparativa de perfis PDA ao longo dos anos para identificar:
- Mudanças comportamentais
- Desenvolvimento pessoal
- Tendências e padrões de evolução

MÓDULOS DA TRILHA:
1. Introdução ao PDA - Fundamentos
2. Autoconhecimento - Perfil comportamental
3. Aplicação Prática - Uso no dia a dia
4. Análise de Perfis - Técnicas avançadas
5. Gestão de Pessoas - Liderança com PDA
6. Estratégias Avançadas - Domínio completo

SUA FUNÇÃO:
- Responda dúvidas sobre PDA de forma clara e didática
- Ajude usuários a interpretar seus perfis comportamentais
- Explique como usar as ferramentas da plataforma
- Dê exemplos práticos de aplicação do PDA
- Seja cordial, paciente e encorajadora
- Use linguagem acessível, evite jargões excessivos

IMPORTANTE:
- Sempre contextualize as respostas com exemplos do PDA
- Incentive o uso das ferramentas da plataforma
- Se não souber algo, seja honesta e sugira onde buscar a informação
- Mantenha respostas concisas mas completas (máximo 3 parágrafos por resposta)
${contextInfo}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente em alguns instantes.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos insuficientes. Por favor, adicione créditos no workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('Erro ao se comunicar com o gateway de IA');
    }

    const data = await response.json();
    
    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in nanda-chat function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
