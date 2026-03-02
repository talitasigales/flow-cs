import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const PT_STOPWORDS = new Set([
  'como', 'para', 'quais', 'qual', 'está', 'esse', 'essa', 'todos', 'todo', 'toda', 'todas',
  'mais', 'muito', 'sobre', 'pode', 'cada', 'onde', 'aqui', 'pela', 'pelo', 'seus', 'suas',
  'são', 'que', 'dos', 'das', 'com', 'uma', 'por', 'não', 'nos', 'nas', 'entre', 'também',
  'ainda', 'quando', 'desde', 'após', 'antes', 'depois', 'durante', 'fazer', 'feito', 'sido',
  'será', 'deve', 'devo', 'tenho', 'temos', 'vocês', 'eles', 'elas', 'meus', 'minha', 'este',
  'esta', 'estes', 'estas', 'esses', 'essas', 'aquele', 'aquela', 'lista', 'liste', 'exatamente',
  'outras', 'outros', 'outro', 'outra', 'assim', 'mesmo', 'mesma', 'forma', 'modo', 'tipo',
  'então', 'porém', 'contudo', 'porquê', 'porque', 'sendo', 'tendo', 'foram', 'seria', 'podem',
  'dessa', 'desse', 'nesse', 'nessa', 'numa', 'dela', 'dele', 'isso', 'isto', 'aquilo',
  'apenas', 'caso', 'exemplo', 'parte', 'pois', 'seja', 'sejam', 'suas', 'seus', 'tanto',
]);

function generateKeywords(text: string): string[] {
  const words = text.toLowerCase()
    .replace(/[^a-záàâãéèêíïóôõöúüçñ\s]/gi, '')
    .split(/\s+/)
    .filter((w: string) => w.length > 3 && !PT_STOPWORDS.has(w));

  const freq: Record<string, number> = {};
  for (const w of words) {
    freq[w] = (freq[w] || 0) + 1;
  }

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([word]) => word);
}

function splitIntoChunks(text: string, maxChunkSize = 15000): string[] {
  const paragraphs = text.split(/\n\n+/);
  const chunks: string[] = [];
  let current = '';

  for (const para of paragraphs) {
    if (current.length + para.length + 2 > maxChunkSize && current.length > 0) {
      chunks.push(current.trim());
      current = para;
    } else {
      current += (current ? '\n\n' : '') + para;
    }
  }
  if (current.trim()) {
    chunks.push(current.trim());
  }

  const finalChunks: string[] = [];
  for (const chunk of chunks) {
    if (chunk.length <= maxChunkSize * 1.5) {
      finalChunks.push(chunk);
    } else {
      const sentences = chunk.split(/(?<=[.!?])\s+/);
      let sub = '';
      for (const s of sentences) {
        if (sub.length + s.length + 1 > maxChunkSize && sub.length > 0) {
          finalChunks.push(sub.trim());
          sub = s;
        } else {
          sub += (sub ? ' ' : '') + s;
        }
      }
      if (sub.trim()) finalChunks.push(sub.trim());
    }
  }

  return finalChunks;
}

function extractTextFromHtml(html: string): string {
  // Remove script and style tags with content
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  text = text.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '');
  text = text.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '');
  text = text.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '');
  
  // Convert common block elements to newlines
  text = text.replace(/<\/(p|div|h[1-6]|li|tr|br|blockquote)>/gi, '\n');
  text = text.replace(/<br\s*\/?>/gi, '\n');
  
  // Remove all remaining HTML tags
  text = text.replace(/<[^>]+>/g, ' ');
  
  // Decode common HTML entities
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  text = text.replace(/&mdash;/g, '—');
  text = text.replace(/&ndash;/g, '–');
  text = text.replace(/&#\d+;/g, '');
  
  // Clean up whitespace
  text = text.replace(/[ \t]+/g, ' ');
  text = text.replace(/\n\s*\n/g, '\n\n');
  text = text.trim();
  
  return text;
}

function extractTitleFromHtml(html: string): string | null {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (match) return match[1].trim();
  const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  if (h1Match) return h1Match[1].trim();
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.39.3');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userData.user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Acesso negado. Apenas administradores.' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { url, title: customTitle, category } = await req.json();
    if (!url) {
      return new Response(JSON.stringify({ error: 'URL é obrigatória' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Validate URL
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    try {
      new URL(formattedUrl);
    } catch {
      return new Response(JSON.stringify({ error: 'URL inválida' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log('Fetching URL:', formattedUrl);

    const response = await fetch(formattedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; KnowledgeBot/1.0)',
        'Accept': 'text/html,application/xhtml+xml,text/plain,*/*',
      },
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ error: `Erro ao acessar a URL: HTTP ${response.status}` }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const contentType = response.headers.get('content-type') || '';
    const rawContent = await response.text();

    let extractedText = '';
    let pageTitle = '';

    if (contentType.includes('text/html') || rawContent.trim().startsWith('<')) {
      pageTitle = extractTitleFromHtml(rawContent) || '';
      extractedText = extractTextFromHtml(rawContent);
    } else {
      // Plain text or other text format
      extractedText = rawContent;
    }

    if (!extractedText || extractedText.trim().length < 50) {
      return new Response(JSON.stringify({ error: 'Não foi possível extrair conteúdo suficiente da URL.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const title = customTitle?.trim() || pageTitle || new URL(formattedUrl).hostname;
    const finalCategory = category || 'Importado';

    const chunks = splitIntoChunks(extractedText, 15000);
    console.log(`Splitting "${title}" into ${chunks.length} chunks from URL`);

    const entries = chunks.map((chunk: string, i: number) => ({
      title: chunks.length > 1 ? `${title} - Parte ${i + 1}` : title,
      category: finalCategory,
      content: chunk,
      keywords: generateKeywords(chunk),
    }));

    const { data: inserted, error: insertError } = await supabase
      .from('knowledge_base')
      .insert(entries)
      .select();

    if (insertError) {
      console.error('Insert error:', insertError);
      return new Response(JSON.stringify({ error: 'Erro ao salvar na base: ' + insertError.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(
      JSON.stringify({
        success: true,
        entry: inserted?.[0],
        totalChunks: chunks.length,
        extractedLength: extractedText.length,
        pageTitle: pageTitle || null,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in import-knowledge-url:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
