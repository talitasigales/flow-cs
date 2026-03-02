import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const stopwords = new Set(['como', 'para', 'quais', 'qual', 'está', 'esse', 'essa', 'todos', 'todo', 'toda', 'todas', 'mais', 'muito', 'sobre', 'pode', 'cada', 'onde', 'aqui', 'pela', 'pelo', 'seus', 'suas', 'são', 'que', 'dos', 'das', 'com', 'uma', 'por', 'não', 'nos', 'nas', 'entre', 'também', 'ainda', 'quando', 'desde', 'após', 'antes', 'depois', 'durante', 'fazer', 'feito', 'sido', 'será', 'deve', 'devo', 'tenho', 'temos', 'vocês', 'eles', 'elas', 'meus', 'minha', 'este', 'esta', 'estes', 'estas', 'esse', 'essa', 'esses', 'essas', 'aquele', 'aquela', 'lista', 'liste', 'exatamente']);

function extractQuestionWords(text: string): string[] {
  return text.toLowerCase()
    .replace(/[?!.,;:'"()]/g, '')
    .split(/\s+/)
    .filter((w: string) => w.length > 3 && !stopwords.has(w));
}

function scoreDoc(doc: any, questionWords: string[]): number {
  const kwSet = new Set(doc.keywords || []);
  let score = 0;
  for (const w of questionWords) {
    if (kwSet.has(w)) score += 3;
  }
  // Bonus for title match
  const titleLower = (doc.title || '').toLowerCase();
  for (const w of questionWords) {
    if (titleLower.includes(w)) score += 2;
  }
  return score;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.39.3');
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const userQuestion = messages[messages.length - 1]?.content || '';
    const questionWords = extractQuestionWords(userQuestion);

    // Strategy 1: Keywords overlap
    let keywordDocs: any[] = [];
    if (questionWords.length > 0) {
      const { data } = await supabase
        .from('knowledge_base')
        .select('title, content, category, keywords')
        .overlaps('keywords', questionWords)
        .limit(10);
      keywordDocs = data || [];
    }

    // Strategy 2: ILIKE search
    let ilikeDocs: any[] = [];
    const keyTerms = questionWords.slice(0, 5);
    for (const term of keyTerms) {
      if (ilikeDocs.length >= 8) break;
      const { data } = await supabase
        .from('knowledge_base')
        .select('title, content, category, keywords')
        .or(`title.ilike.%${term}%,content.ilike.%${term}%`)
        .limit(5);
      if (data) {
        for (const doc of data) {
          if (!ilikeDocs.find(d => d.title === doc.title)) ilikeDocs.push(doc);
        }
      }
    }

    // Strategy 3: Full-text search
    const { data: ftsDocs } = await supabase
      .from('knowledge_base')
      .select('title, content, category, keywords')
      .textSearch('content', userQuestion, { type: 'websearch', config: 'portuguese' })
      .limit(5);

    console.log('Busca:', { questionWords: questionWords.slice(0, 5), kw: keywordDocs.length, ilike: ilikeDocs.length, fts: ftsDocs?.length || 0 });

    // Deduplicate
    const allDocs = new Map();
    for (const doc of [...keywordDocs, ...ilikeDocs, ...(ftsDocs || [])]) {
      if (!allDocs.has(doc.title)) allDocs.set(doc.title, doc);
    }

    // If few results, load fallback
    if (allDocs.size < 3) {
      const { data } = await supabase
        .from('knowledge_base')
        .select('title, content, category, keywords')
        .order('category')
        .limit(20);
      if (data) {
        for (const doc of data) {
          if (!allDocs.has(doc.title)) allDocs.set(doc.title, doc);
        }
      }
    }

    // Rank by relevance and apply context size limit
    let ranked = Array.from(allDocs.values())
      .map(doc => ({ ...doc, _score: scoreDoc(doc, questionWords) }))
      .sort((a, b) => b._score - a._score);

    const MAX_CONTEXT_CHARS = 30000;
    let totalChars = 0;
    const selectedDocs: any[] = [];
    for (const doc of ranked) {
      if (totalChars + doc.content.length > MAX_CONTEXT_CHARS && selectedDocs.length >= 3) break;
      selectedDocs.push(doc);
      totalChars += doc.content.length;
    }

    let contextInfo = '';
    if (selectedDocs.length > 0) {
      contextInfo = '\n\n📚 CONTEXTO DA BASE DE CONHECIMENTO:\n' +
        selectedDocs.map(doc => {
          const kwInfo = doc.keywords?.length ? ` (palavras-chave: ${doc.keywords.join(', ')})` : '';
          return `[${doc.category}] ${doc.title}${kwInfo}:\n${doc.content}`;
        }).join('\n\n');
      console.log('Contexto:', selectedDocs.length, 'docs,', totalChars, 'chars');
    }

    const systemPrompt = `Você é a Nanda, uma profissional de RH experiente e competente, especializada em desenvolvimento humano e PDA Assessment (Personal Development Analysis).

🌟 SUA PERSONALIDADE:
- Você é profissional, cordial e objetiva
- Tem interesse genuíno no desenvolvimento das pessoas, mas sem exageros de afetividade
- Fala de igual para igual, com clareza e sem jargões excessivos
- É paciente ao explicar conceitos técnicos de forma simples
- Transmite segurança e competência técnica

💬 COMO VOCÊ SE COMUNICA:
- SEU NOME é Nanda. Você NUNCA deve chamar o usuário de "Nanda" - esse é SEU nome, não o nome do usuário
- Ao se dirigir ao usuário, use apenas "você" - NUNCA use "amigo(a)", "querido(a)", "parceiro(a)" ou termos carinhosos
- Seja cordial mas profissional ("Boa pergunta.", "Vamos lá.")
- NUNCA repita saudações como "Olá" se já houver mensagens anteriores na conversa - vá direto ao ponto
- Evite excesso de entusiasmo, emojis desnecessários ou expressões exageradamente acolhedoras
- Seja direta e informativa nas respostas
- Termine de forma simples ("Se tiver mais dúvidas, estou à disposição.")

📚 SUA BASE DE CONHECIMENTO:
${contextInfo}

🎯 EIXOS REPNA DO PDA:
Os 5 eixos comportamentais fundamentais são avaliados em uma escala de 0 a 100:
• Valores de 0 a 33 = Comportamento BAIXO
• Valores de 34 a 67 = Comportamento SITUACIONAL (adapta-se conforme o contexto)
• Valores de 68 a 100 = Comportamento ALTO

• R (RISCO): Propensão a assumir riscos
  - Alto (68-100): arrojado e competitivo
  - Situacional (34-67): equilibra ousadia e cautela conforme a situação
  - Baixo (0-33): cauteloso e analítico

• E (EXTROVERSÃO): Grau de interação social
  - Alto (68-100): sociável e comunicativo
  - Situacional (34-67): adapta entre extroversão e introversão
  - Baixo (0-33): reservado e discreto

• P (PACIÊNCIA): Ritmo e adaptação
  - Alto (68-100): paciente e estável
  - Situacional (34-67): ajusta o ritmo conforme a demanda
  - Baixo (0-33): dinâmico e impulsivo

• N (NORMAS): Receptividade a regras
  - Alto (68-100): metódico e estruturado
  - Situacional (34-67): flexível entre seguir ou adaptar regras
  - Baixo (0-33): independente e inovador

• A (AUTOCONTROLE): Inteligência emocional
  - Alto (68-100): lógico e racional
  - Situacional (34-67): equilibra razão e emoção
  - Baixo (0-33): emocional e expressivo

⚠️ REGRAS IMPORTANTES:
- Use as informações da base de conhecimento fornecida acima para responder, mas NUNCA mencione "base de conhecimento", "minha base" ou qualquer referência ao fato de que você consulta uma base. Responda como se o conhecimento fosse seu naturalmente. Se não souber algo, diga simplesmente: "Não tenho essa informação, mas posso ajudar com..."
- Sempre mencione REPNA (não DISC ou outros modelos de perfil comportamental)
- Responda em até 3 parágrafos, mantendo um tom profissional e cordial
- Dê exemplos práticos quando falar dos eixos REPNA
- Se o usuário pedir para falar com um humano, com alguém do time, com suporte, com CS, ou sugerir que precisa de contato humano, responda EXATAMENTE assim: "Para falar com nosso time, você pode utilizar os contatos disponíveis no menu lateral da plataforma. Lá você encontra o WhatsApp e o e-mail do nosso time de Customer Success." NÃO mencione outros contatos, e-mails ou telefones que possam estar na base de conhecimento - use APENAS essa orientação sobre o menu lateral.
- Se o usuário disser que esqueceu a senha, não consegue entrar, ou algo relacionado a recuperação de senha, oriente-o a acessar https://hrtech.pdaprofile.com/ e clicar em "Esqueceu sua senha?". Complemente explicando que ele receberá um e-mail da PDA International (noreply@pdainternational.net) com um link para redefinição de senha, e que esse link tem validade de 48 horas. Se não receber o e-mail nesse prazo, sugira verificar a caixa de spam e, se necessário, entrar em contato com o time pelo menu lateral da plataforma.
- REGRA CRÍTICA SOBRE EIXOS EM 50: Quando TODOS os eixos do perfil ADAPTADO estão em 50 (ou muito próximos de 50), isso indica que o perfil adaptado está INVÁLIDO. NÃO diga que a pessoa é "situacional em tudo" — isso é uma interpretação incorreta. O correto é explicar que o perfil adaptado está inválido, que a pessoa pode estar em um período de transição ou mudanças, e que a análise deve focar no perfil NATURAL. Essa é uma regra fundamental do PDA Assessment.`;
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        temperature: 0.3,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente em alguns instantes.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Créditos insuficientes. Por favor, adicione créditos no workspace.' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('Erro ao se comunicar com o gateway de IA');
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Error in nanda-chat function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
