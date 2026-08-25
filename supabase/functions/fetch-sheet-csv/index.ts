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

// --- CSV parsing helpers -------------------------------------------------
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else { inQuotes = false; }
      } else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (ch === '\r') { /* skip */ }
    else field += ch;
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}

const norm = (s: string) =>
  (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const csvEscape = (v: string) => `"${(v || '').replace(/"/g, '""')}"`;

/**
 * Normalizes an arbitrary sheet into `nome,email_corporativo,email_pessoal`.
 * Finds the header row anywhere in the sheet (planilhas costumam ter títulos
 * e mesclagens acima) and maps the Nome / Email / Email pessoal columns.
 */
function normalizeEnrollmentCsv(raw: string): string | null {
  const rows = parseCsv(raw);
  let headerIdx = -1;
  let nameCol = -1, emailCol = -1, personalCol = -1;

  for (let i = 0; i < Math.min(rows.length, 25); i++) {
    const cells = rows[i].map(norm);
    const nIdx = cells.findIndex((c) => c === 'nome' || c === 'nome completo' || c === 'aluno' || c === 'participante');
    const eIdx = cells.findIndex((c) => c === 'email' || c === 'e-mail' || c === 'email corporativo' || c === 'e-mail corporativo' || c === 'email_corporativo');
    if (nIdx >= 0 && eIdx >= 0) {
      headerIdx = i;
      nameCol = nIdx;
      emailCol = eIdx;
      personalCol = cells.findIndex((c) => c.includes('pessoal'));
      break;
    }
  }
  if (headerIdx === -1) return null;

  const out = ['nome,email_corporativo,email_pessoal'];
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const r = rows[i];
    const name = (r[nameCol] || '').trim();
    const email = (r[emailCol] || '').trim().toLowerCase();
    const personal = personalCol >= 0 ? (r[personalCol] || '').trim().toLowerCase() : '';
    if (!EMAIL_RE.test(email)) continue;
    out.push([name, email, EMAIL_RE.test(personal) && personal !== email ? personal : ''].map(csvEscape).join(','));
  }
  return out.length > 1 ? out.join('\n') : null;
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

    const normalized = normalizeEnrollmentCsv(csv);
    if (!normalized) {
      return json({ error: 'Não encontrei colunas "Nome" e "Email" na planilha. Verifique o cabeçalho.' }, 400);
    }
    return json({ csv: normalized, normalized: true });
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});
