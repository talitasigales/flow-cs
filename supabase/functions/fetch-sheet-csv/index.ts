import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function toCsvExportUrl(raw: string): string | null {
  try {
    const url = new URL(raw.trim());
    if (!/(^|\.)docs\.google\.com$/.test(url.hostname)) return null;
    const m = url.pathname.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!m) return null;
    const id = m[1];
    const gidMatch = raw.match(/[#&?]gid=(\d+)/);
    const gid = gidMatch ? `&gid=${gidMatch[1]}` : '';
    return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv${gid}`;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Não autorizado' }, 401);
    let userId: string;
    try {
      userId = JSON.parse(atob(authHeader.replace('Bearer ', '').split('.')[1])).sub;
      if (!userId) throw new Error('no sub');
    } catch {
      return json({ error: 'Token inválido' }, 401);
    }

    const { data: roleData } = await supabase
      .from('user_roles').select('role').eq('user_id', userId).eq('role', 'admin').maybeSingle();
    if (!roleData) return json({ error: 'Acesso negado' }, 403);

    const { url } = await req.json();
    if (typeof url !== 'string' || !url.trim()) return json({ error: 'URL é obrigatória' }, 400);

    const exportUrl = toCsvExportUrl(url);
    if (!exportUrl) return json({ error: 'Informe um link válido do Google Sheets' }, 400);

    const resp = await fetch(exportUrl, { redirect: 'follow' });
    if (!resp.ok) {
      return json({ error: 'Não foi possível ler a planilha. Compartilhe com "qualquer pessoa com o link".' }, 400);
    }
    const csv = await resp.text();
    if (csv.trim().startsWith('<')) {
      return json({ error: 'A planilha não está pública. Compartilhe com "qualquer pessoa com o link".' }, 400);
    }

    return json({ csv });
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});
