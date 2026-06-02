import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

const DEFAULT_SHEET = 'https://docs.google.com/spreadsheets/d/1LYX9uC-CjJKPUlCWctMuIzsTlA4pKl4mFXTCM-oRS-Q/export?format=csv';

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') { inQuotes = false; }
      else { field += c; }
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ',') { cur.push(field); field = ''; }
      else if (c === '\n') { cur.push(field); rows.push(cur); cur = []; field = ''; }
      else if (c === '\r') { /* skip */ }
      else { field += c; }
    }
  }
  if (field !== '' || cur.length) { cur.push(field); rows.push(cur); }
  return rows.filter(r => r.some(v => v.trim() !== ''));
}

function parseDate(s: string): string | null {
  if (!s) return null;
  const t = s.trim();
  if (!t) return null;
  const m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const [, d, mo, y] = m;
  return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

function parseInt0(s: string): number {
  if (!s) return 0;
  const n = parseInt(s.replace(/[.,\s]/g, ''), 10);
  return isFinite(n) ? n : 0;
}

function deriveSignal(s: string): string {
  if (!s) return 'unknown';
  if (s.includes('🟢') || /verde/i.test(s)) return 'ok';
  if (s.includes('🟡') || /amarelo/i.test(s)) return 'warning';
  if (s.includes('🔴') || /vermelho/i.test(s)) return 'critical';
  return 'unknown';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace('Bearer ', '');
    const { data: claims, error: cErr } = await userClient.auth.getClaims(token);
    if (cErr || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const userId = claims.claims.sub;

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: roleRow } = await admin.from('user_roles').select('role').eq('user_id', userId).eq('role', 'admin').maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: 'Forbidden — admin only' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    let csv: string | null = null;
    let sheetUrl = DEFAULT_SHEET;
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        if (body?.csv) csv = String(body.csv);
        if (body?.url) sheetUrl = String(body.url);
      } catch { /* no body */ }
    }

    if (!csv) {
      const resp = await fetch(sheetUrl, { redirect: 'follow' });
      if (!resp.ok) throw new Error(`Falha ao baixar planilha: ${resp.status}`);
      csv = await resp.text();
    }

    const rows = parseCSV(csv);
    if (rows.length < 2) throw new Error('CSV vazio');
    const header = rows[0].map(h => h.trim());
    const idx = (name: string) => header.findIndex(h => h.toLowerCase().includes(name.toLowerCase()));
    const cAccount = idx('conta');
    const cRem = idx('restantes');
    const cUsed = idx('utilizados');
    const cLast = idx('consumo');
    const cSignal = idx('sinaleira');
    const cExpC = idx('expiração dos créditos');
    const cExpA = idx('expiração da conta');
    const cType = idx('tipo de conta');
    const cAlert = idx('status');
    const cConsulted = idx('data da consulta');

    const snapshotId = crypto.randomUUID();
    const records = rows.slice(1).map(r => ({
      snapshot_id: snapshotId,
      account_name: (r[cAccount] || '').trim(),
      available_credits: parseInt0(r[cRem] || ''),
      used_credits_total: parseInt0(r[cUsed] || ''),
      last_month_consumption: parseInt0(r[cLast] || ''),
      signal: deriveSignal(r[cSignal] || ''),
      credits_expiration: parseDate(r[cExpC] || ''),
      account_expiration: parseDate(r[cExpA] || ''),
      account_type: (r[cType] || '').trim() || null,
      alert: (r[cAlert] || '').trim() || null,
      consulted_at: parseDate(r[cConsulted] || '') || new Date().toISOString().slice(0, 10),
    })).filter(r => r.account_name);

    // Insert in chunks
    const chunkSize = 500;
    for (let i = 0; i < records.length; i += chunkSize) {
      const chunk = records.slice(i, i + chunkSize);
      const { error: insErr } = await admin.from('pda_sinaleira_snapshot').insert(chunk);
      if (insErr) throw insErr;
    }

    // Delete older snapshots
    await admin.from('pda_sinaleira_snapshot').delete().neq('snapshot_id', snapshotId);

    return new Response(JSON.stringify({ ok: true, snapshot_id: snapshotId, imported: records.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
