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

    // Buscar contexto relevante na base de conhecimento
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.39.3');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const userQuestion = messages[messages.length - 1]?.content || '';
    
    // Buscar usando full-text search em português
    const { data: knowledgeDocs, error: searchError } = await supabase
      .from('knowledge_base')
      .select('title, content, category')
      .textSearch('content', userQuestion, {
        type: 'websearch',
        config: 'portuguese'
      })
      .limit(3);

    console.log('Busca na base:', { userQuestion, found: knowledgeDocs?.length || 0 });
    
    if (searchError) {
      console.error('Erro na busca:', searchError);
    }

    let contextInfo = '';
    if (knowledgeDocs && knowledgeDocs.length > 0) {
      contextInfo = '\n\n📚 CONTEXTO DA BASE DE CONHECIMENTO:\n' + 
        knowledgeDocs.map(doc => `[${doc.category}] ${doc.title}:\n${doc.content}`).join('\n\n');
      console.log('Documentos encontrados:', knowledgeDocs.map(d => d.title));
    } else {
      console.log('Nenhum documento encontrado, buscando todos...');
      // Fallback: se não encontrar nada, buscar todos os documentos
      const { data: allDocs } = await supabase
        .from('knowledge_base')
        .select('title, content, category')
        .limit(4);
      
      if (allDocs && allDocs.length > 0) {
        contextInfo = '\n\n📚 CONTEXTO DA BASE DE CONHECIMENTO:\n' + 
          allDocs.map(doc => `[${doc.category}] ${doc.title}:\n${doc.content}`).join('\n\n');
      }
    }

    const systemPrompt = `Você é a Nanda, uma assistente virtual especializada em PDA Assessment (Personal Development Analysis).

INSTRUÇÃO CRÍTICA: Use APENAS as informações da BASE DE CONHECIMENTO abaixo para responder. Não invente ou assuma informações que não estejam no contexto fornecido.
${contextInfo}

COMO RESPONDER:
- Use os dados da base de conhecimento acima como fonte primária
- Responda de forma clara, didática e objetiva
- Dê exemplos práticos quando relevante
- Seja cordial e encorajadora
- Se a informação não estiver na base, diga "não tenho essa informação específica, mas posso explicar sobre..."
- Máximo 3 parágrafos por resposta

TÓPICOS PRINCIPAIS DO PDA:
• EIXOS DISC: Dominância (D), Influência (I), Estabilidade (S), Conformidade (C)
• INDICADORES: Intensidade, Equilíbrio de Energia, Consistência, Autocontrole
• APLICAÇÕES: Recrutamento, Desenvolvimento, Construção de Cargos, Times`;

    console.log('Enviando para Gemini com contexto:', contextInfo.length > 0 ? 'SIM' : 'NÃO');

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
        temperature: 0.7,
        max_tokens: 800,
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
