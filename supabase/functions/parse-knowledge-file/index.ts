import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

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

    const supabase = createClient(supabaseUrl, supabaseKey);
    const anonClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: claimsData, error: claimsError } = await anonClient.auth.getUser();
    if (claimsError || !claimsData?.user) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const userId = claimsData.user.id;

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

    if (ext === 'txt' || ext === 'md' || ext === 'csv') {
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
      // For PDF and other binary formats, extract raw text
      extractedText = await fileData.text();
    }

    if (!extractedText.trim()) {
      return new Response(JSON.stringify({ error: 'Não foi possível extrair texto do arquivo. Use arquivos .txt, .md ou .csv para melhores resultados.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Truncate if too long (max ~50k chars)
    if (extractedText.length > 50000) {
      extractedText = extractedText.substring(0, 50000) + '\n\n[... conteúdo truncado por exceder limite de 50.000 caracteres]';
    }

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
