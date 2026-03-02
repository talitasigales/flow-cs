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

function splitIntoChunks(text: string, maxChunkSize = 2000): string[] {
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

function countSignificantWords(text: string): number {
  return text.toLowerCase()
    .replace(/[^a-záàâãéèêíïóôõöúüçñ\s]/gi, '')
    .split(/\s+/)
    .filter((w: string) => w.length > 3 && !PT_STOPWORDS.has(w))
    .length;
}

async function extractPdfWithVisionAPI(pdfBytes: Uint8Array): Promise<string> {
  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!apiKey) {
    throw new Error('LOVABLE_API_KEY não configurada para fallback de extração');
  }

  // Check size limit (~15MB base64 ≈ ~11MB binary)
  if (pdfBytes.length > 15 * 1024 * 1024) {
    throw new Error('PDF muito grande para extração via IA (limite ~15MB)');
  }

  // Convert to base64
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < pdfBytes.length; i += chunkSize) {
    const chunk = pdfBytes.subarray(i, i + chunkSize);
    for (let j = 0; j < chunk.length; j++) {
      binary += String.fromCharCode(chunk[j]);
    }
  }
  const base64Pdf = btoa(binary);

  console.log(`[Vision Fallback] Sending PDF (${(pdfBytes.length / 1024).toFixed(0)}KB) to AI for text extraction...`);

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        {
          role: 'system',
          content: 'Você é um assistente especializado em extração de texto de documentos PDF. Extraia TODO o texto do documento fornecido, preservando a estrutura de parágrafos e seções. Retorne APENAS o texto extraído, sem comentários adicionais, sem markdown, sem formatação extra. Preserve títulos, subtítulos, listas e parágrafos como texto puro separado por quebras de linha.'
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extraia todo o conteúdo de texto deste documento PDF. Inclua absolutamente todo o texto visível, página por página. Não resuma, não omita nada.'
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:application/pdf;base64,${base64Pdf}`
              }
            }
          ]
        }
      ],
      max_tokens: 16000,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('[Vision Fallback] API error:', response.status, errText);
    throw new Error(`Erro na API de extração: ${response.status}`);
  }

  const data = await response.json();
  const extractedText = data.choices?.[0]?.message?.content || '';
  
  console.log(`[Vision Fallback] Extracted ${extractedText.length} chars, ${countSignificantWords(extractedText)} significant words`);
  
  return extractedText;
}

async function extractTextFromPDF(pdfData: ArrayBuffer): Promise<{ text: string; method: string }> {
  let nativeText = '';
  
  // Try pdfjs-dist first
  try {
    const pdfjsLib = await import('npm:pdfjs-dist@4.0.379/legacy/build/pdf.mjs');
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(pdfData), useSystemFonts: true });
    const pdf = await loadingTask.promise;
    const textParts: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .filter((item: any) => item.str !== undefined)
        .map((item: any) => item.str)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (pageText) textParts.push(pageText);
    }
    nativeText = textParts.join('\n\n');
    console.log(`[pdfjs] Extracted ${nativeText.length} chars, ${countSignificantWords(nativeText)} significant words from ${pdf.numPages} pages`);
  } catch (e) {
    console.error('[pdfjs] extraction failed:', e);
  }

  // Check quality of native extraction
  const sigWords = countSignificantWords(nativeText);
  const isGoodExtraction = nativeText.trim().length >= 500 && sigWords >= 100;

  if (isGoodExtraction) {
    console.log('[PDF] Using native pdfjs extraction (good quality)');
    return { text: nativeText, method: 'pdfjs' };
  }

  // Fallback to AI vision
  console.log(`[PDF] Native extraction poor (${nativeText.length} chars, ${sigWords} words). Trying AI vision fallback...`);
  
  try {
    const visionText = await extractPdfWithVisionAPI(new Uint8Array(pdfData));
    if (visionText.trim().length > nativeText.trim().length) {
      console.log(`[PDF] Using AI vision extraction (${visionText.length} chars vs native ${nativeText.length} chars)`);
      return { text: visionText, method: 'ai-vision' };
    }
  } catch (e) {
    console.error('[Vision Fallback] Failed:', e);
  }

  // If vision also failed, use whatever we have
  if (nativeText.trim().length > 50) {
    console.log('[PDF] Falling back to native extraction (vision failed)');
    return { text: nativeText, method: 'pdfjs-fallback' };
  }

  throw new Error('Não foi possível extrair texto do PDF. Verifique se o documento contém texto selecionável.');
}

async function extractTextFromDOCX(data: ArrayBuffer): Promise<string> {
  try {
    const JSZip = (await import('npm:jszip@3.10.1')).default;
    const zip = await JSZip.loadAsync(data);
    const docXml = zip.file('word/document.xml');
    if (!docXml) throw new Error('document.xml not found in DOCX');
    const xmlContent = await docXml.async('text');
    const parts = xmlContent.split(/<\/w:p>/);
    const paragraphs: string[] = [];
    for (const part of parts) {
      const texts = part.match(/<w:t[^>]*>([^<]*)<\/w:t>/g);
      if (texts) {
        const paraText = texts
          .map((t: string) => t.replace(/<w:t[^>]*>/, '').replace(/<\/w:t>/, ''))
          .join('');
        if (paraText.trim()) paragraphs.push(paraText.trim());
      }
    }
    return paragraphs.join('\n\n');
  } catch (e) {
    console.error('DOCX extraction failed:', e);
    throw new Error('Não foi possível extrair texto do DOCX.');
  }
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

    const { filePath, fileName, category } = await req.json();
    if (!filePath || !fileName) {
      return new Response(JSON.stringify({ error: 'filePath e fileName são obrigatórios' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: fileData, error: downloadError } = await supabase.storage.from('knowledge-files').download(filePath);
    if (downloadError || !fileData) {
      return new Response(JSON.stringify({ error: 'Erro ao baixar arquivo: ' + (downloadError?.message || 'arquivo não encontrado') }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const ext = fileName.toLowerCase().split('.').pop();
    let extractedText = '';
    let extractionMethod = 'direct';

    if (ext === 'pdf') {
      const arrayBuffer = await fileData.arrayBuffer();
      const result = await extractTextFromPDF(arrayBuffer);
      extractedText = result.text;
      extractionMethod = result.method;
    } else if (ext === 'docx' || ext === 'doc') {
      const arrayBuffer = await fileData.arrayBuffer();
      extractedText = await extractTextFromDOCX(arrayBuffer);
    } else if (ext === 'txt' || ext === 'md' || ext === 'csv') {
      extractedText = await fileData.text();
    } else if (ext === 'json') {
      const jsonText = await fileData.text();
      try { extractedText = JSON.stringify(JSON.parse(jsonText), null, 2); } catch { extractedText = jsonText; }
    } else {
      extractedText = await fileData.text();
    }

    if (!extractedText.trim()) {
      return new Response(JSON.stringify({ error: 'Não foi possível extrair texto do arquivo.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const title = fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    const finalCategory = category || 'Importado';

    const chunks = splitIntoChunks(extractedText, 15000);
    console.log(`Splitting "${title}" into ${chunks.length} chunks (method: ${extractionMethod}, total: ${extractedText.length} chars)`);

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

    await supabase.storage.from('knowledge-files').remove([filePath]);

    return new Response(
      JSON.stringify({
        success: true,
        entry: inserted?.[0],
        totalChunks: chunks.length,
        extractedLength: extractedText.length,
        extractionMethod,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in parse-knowledge-file:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
