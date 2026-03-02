import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

async function extractTextFromPDF(pdfData: ArrayBuffer): Promise<string> {
  try {
    // Use pdf.js via npm specifier which works in Deno
    const pdfjsLib = await import('npm:pdfjs-dist@4.0.379/legacy/build/pdf.mjs');
    
    const loadingTask = pdfjsLib.getDocument({ 
      data: new Uint8Array(pdfData),
      useSystemFonts: true,
    });
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
      if (pageText) {
        textParts.push(pageText);
      }
    }
    
    const result = textParts.join('\n\n');
    if (result.trim().length > 50) {
      return result;
    }
    throw new Error('Extracted text too short, likely failed');
  } catch (e) {
    console.error('pdfjs extraction failed:', e);
    throw new Error('Não foi possível extrair texto do PDF. Verifique se o documento contém texto selecionável (não apenas imagens escaneadas).');
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

    // Verify admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
      console.error('Auth error:', userError?.message);
      return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const userId = userData.user.id;

    // Check admin role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Acesso negado. Apenas administradores.' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { filePath, fileName, category } = await req.json();

    if (!filePath || !fileName) {
      return new Response(JSON.stringify({ error: 'filePath e fileName são obrigatórios' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from('knowledge-files')
      .download(filePath);

    if (downloadError || !fileData) {
      console.error('Download error:', downloadError);
      return new Response(JSON.stringify({ error: 'Erro ao baixar arquivo: ' + (downloadError?.message || 'arquivo não encontrado') }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Extract text based on file type
    const ext = fileName.toLowerCase().split('.').pop();
    let extractedText = '';

    if (ext === 'pdf') {
      console.log('Extracting text from PDF...');
      const arrayBuffer = await fileData.arrayBuffer();
      extractedText = await extractTextFromPDF(arrayBuffer);
      console.log(`PDF extraction result: ${extractedText.length} chars`);
    } else if (ext === 'txt' || ext === 'md' || ext === 'csv') {
      extractedText = await fileData.text();
    } else if (ext === 'json') {
      const jsonText = await fileData.text();
      try {
        const parsed = JSON.parse(jsonText);
        extractedText = JSON.stringify(parsed, null, 2);
      } catch {
        extractedText = jsonText;
      }
    } else {
      extractedText = await fileData.text();
    }

    if (!extractedText.trim()) {
      return new Response(JSON.stringify({ error: 'Não foi possível extrair texto do arquivo. Para PDFs, verifique se o documento contém texto selecionável (não apenas imagens escaneadas).' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // No truncation - store full content

    // Generate title from filename
    const title = fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    const finalCategory = category || 'Importado';

    // Generate keywords from filename
    const keywords = title.toLowerCase().split(/\s+/).filter((w: string) => w.length > 2);

    // Insert into knowledge_base
    const { data: inserted, error: insertError } = await supabase
      .from('knowledge_base')
      .insert({
        title,
        category: finalCategory,
        content: extractedText,
        keywords: keywords.length > 0 ? keywords : null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return new Response(JSON.stringify({ error: 'Erro ao salvar na base: ' + insertError.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Clean up uploaded file
    await supabase.storage.from('knowledge-files').remove([filePath]);

    return new Response(
      JSON.stringify({
        success: true,
        entry: inserted,
        extractedLength: extractedText.length,
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
