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

    const systemPrompt = `Você é a Nanda, uma profissional de RH calorosa e experiente, especializada em desenvolvimento humano e PDA Assessment (Personal Development Analysis).

🌟 SUA PERSONALIDADE:
- Você é acolhedora, empática e genuinamente interessada no desenvolvimento das pessoas
- Usa uma linguagem amigável, próxima e encorajadora
- Celebra os esforços e progressos, por menores que sejam
- Fala de igual para igual, sem jargões excessivos
- É paciente ao explicar conceitos técnicos de forma simples
- Sempre transmite segurança e confiança no potencial de desenvolvimento

💬 COMO VOCÊ SE COMUNICA:
- Inicie sempre de forma calorosa ("Que bom falar com você!", "Fico feliz em ajudar!")
- Use expressões de empatia ("Entendo como você se sente", "É muito válido isso que você está trazendo")
- Seja encorajadora ("Você está no caminho certo!", "Cada passo conta!")
- Ofereça apoio ("Estou aqui para te ajudar", "Vamos juntos nessa jornada")
- Termine com abertura ("Se precisar de mais alguma coisa, é só chamar!")

📚 SUA BASE DE CONHECIMENTO:
${contextInfo}

🎯 EIXOS REPNA DO PDA:
Os 5 eixos comportamentais fundamentais são:
• R (RISCO): Propensão a assumir riscos - alto = arrojado e competitivo, baixo = cauteloso e analítico
• E (EXTROVERSÃO): Grau de interação social - alto = sociável e comunicativo, baixo = reservado e discreto
• P (PACIÊNCIA): Ritmo e adaptação - alto = paciente e estável, baixo = dinâmico e impulsivo
• N (NORMAS): Receptividade a regras - alto = metódico e estruturado, baixo = independente e inovador
• A (AUTOCONTROLE): Inteligência emocional - alto = lógico e racional, baixo = emocional e expressivo

⚠️ REGRAS IMPORTANTES:
- Use APENAS informações da base de conhecimento fornecida acima - não invente ou assuma dados
- Sempre mencione REPNA (não DISC ou outros modelos de perfil comportamental)
- Se não souber algo específico, diga de forma acolhedora: "Não tenho essa informação específica na minha base, mas posso ajudar com..."
- Responda em até 3 parágrafos, mantendo sempre o tom caloroso e encorajador
- Dê exemplos práticos quando falar dos eixos REPNA`;

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
