import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { profileA, profileB } = await req.json();
    
    if (!profileA || !profileB) {
      return new Response(
        JSON.stringify({ error: 'Dois perfis são necessários para análise' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Configuração de ambiente incompleta');
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch knowledge base content
    const { data: knowledgeData, error: knowledgeError } = await supabase
      .from('knowledge_base')
      .select('*')
      .order('created_at', { ascending: false });

    if (knowledgeError) {
      console.error('Error fetching knowledge base:', knowledgeError);
    }

    // Build context from knowledge base
    const knowledgeContext = knowledgeData?.map(item => 
      `${item.title}:\n${item.content}`
    ).join('\n\n') || '';

    // Calculate deltas
    const dimensions = ['r', 'e', 'p', 'n', 'a', 'tomada_decisoes', 'intensidade_perfil', 'energia', 'equilibrio_energia', 'modificacao_perfil'];
    const deltas = dimensions.map(dim => {
      const valueA = profileA[dim] || 0;
      const valueB = profileB[dim] || 0;
      const diff = valueB - valueA;
      return {
        dimension: dim,
        valueA,
        valueB,
        change: diff,
        percentChange: valueA !== 0 ? Math.round((diff / valueA) * 100) : 0
      };
    });

    // Prepare prompt for AI analysis
    const systemPrompt = `Você é a Nanda, uma especialista em análise comportamental PDA (Personal Development Assessment). 
Use o conhecimento abaixo para fundamentar suas análises:

${knowledgeContext}

Forneça uma análise profissional, estruturada e rica em insights sobre a evolução do perfil comportamental.`;

    const userPrompt = `Analise a evolução do perfil PDA entre ${profileA.year} e ${profileB.year}:

**Ano ${profileA.year}:**
- R (Risco): ${profileA.r}
- E (Extroversão): ${profileA.e}
- P (Paciência): ${profileA.p}
- N (Normas): ${profileA.n}
- A (Autocontrole): ${profileA.a}
- Tomada de Decisões: ${profileA.tomada_decisoes}
- Intensidade do Perfil: ${profileA.intensidade_perfil}
- Energia: ${profileA.energia}
- Equilíbrio de Energia: ${profileA.equilibrio_energia}
- Modificação de Perfil: ${profileA.modificacao_perfil}

**Ano ${profileB.year}:**
- R (Risco): ${profileB.r}
- E (Extroversão): ${profileB.e}
- P (Paciência): ${profileB.p}
- N (Normas): ${profileB.n}
- A (Autocontrole): ${profileB.a}
- Tomada de Decisões: ${profileB.tomada_decisoes}
- Intensidade do Perfil: ${profileB.intensidade_perfil}
- Energia: ${profileB.energia}
- Equilíbrio de Energia: ${profileB.equilibrio_energia}
- Modificação de Perfil: ${profileB.modificacao_perfil}

**Principais Mudanças:**
${deltas.filter(d => Math.abs(d.change) >= 5).map(d => 
  `- ${d.dimension}: ${d.valueA} → ${d.valueB} (${d.change > 0 ? '+' : ''}${d.change} pontos, ${d.percentChange > 0 ? '+' : ''}${d.percentChange}%)`
).join('\n')}

Forneça uma análise estruturada em seções:

1. **Resumo Executivo**: Uma visão geral das mudanças mais significativas (2-3 parágrafos)

2. **Análise REPNA Detalhada**: Para cada dimensão com mudança significativa, explique:
   - O que a mudança significa
   - Possíveis causas ou contextos
   - Implicações práticas no ambiente profissional

3. **Insights Comportamentais**: Padrões emergentes, tendências e correlações entre as dimensões

4. **Recomendações**: Sugestões práticas baseadas na evolução observada

Use markdown para formatação e seja específico nos insights.`;

    // Call Lovable AI
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI gateway error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente em alguns instantes.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos insuficientes. Adicione créditos ao seu workspace Lovable AI.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error('Erro ao gerar análise');
    }

    const aiData = await aiResponse.json();
    const analysis = aiData.choices?.[0]?.message?.content;

    if (!analysis) {
      throw new Error('Nenhuma análise foi gerada');
    }

    return new Response(
      JSON.stringify({ 
        analysis,
        deltas,
        yearA: profileA.year,
        yearB: profileB.year
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-profile function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro ao analisar perfil' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
