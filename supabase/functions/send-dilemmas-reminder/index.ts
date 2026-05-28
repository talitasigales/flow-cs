import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CLASS_ID = '3f14b5b8-c47b-4654-a0eb-dc865e3cb86d';
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

function buildHtml(name: string, url: string) {
  const firstName = (name || '').split(' ')[0] || '';
  return `<!doctype html><html><body style="font-family:Arial,sans-serif;background:#f6f7f9;margin:0;padding:24px;color:#111">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #eee">
    <tr><td style="background:#0F172A;padding:20px 24px;color:#fff">
      <h1 style="margin:0;font-size:18px">Programa Master Líder · Grupo Pinho</h1>
    </td></tr>
    <tr><td style="padding:24px">
      <p style="margin:0 0 12px">Olá, <strong>${firstName}</strong>!</p>
      <p style="margin:0 0 12px">O link de preenchimento da avaliação <strong>Dilemas de Gestão (DG)</strong> continua disponível.</p>
      <p style="margin:0 0 20px"><strong>Boa notícia: o prazo foi flexibilizado para 08/06.</strong> Pedimos que conclua o preenchimento até essa data.</p>
      <p style="margin:0 0 24px;text-align:center">
        <a href="${url}" style="background:#EA580C;color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:bold;display:inline-block">Acessar avaliação DG</a>
      </p>
      <p style="margin:0 0 12px;font-size:13px;color:#555">Se o botão não funcionar, copie e cole este link no navegador:</p>
      <p style="margin:0 0 20px;font-size:12px;word-break:break-all;color:#0F172A"><a href="${url}" style="color:#0F172A">${url}</a></p>
      <p style="margin:24px 0 0;font-size:13px;color:#555">Em caso de dúvidas, responda este e-mail.</p>
      <p style="margin:8px 0 0;font-size:13px;color:#555">Equipe Grou</p>
    </td></tr>
  </table></body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    let onlyEmail: string | null = null;
    if (req.method === 'POST') {
      try { const b = await req.json(); onlyEmail = (b?.only_email || '').toString().trim().toLowerCase() || null; } catch {}
    }
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: enrolls, error } = await supabase
      .from('program_enrollments')
      .select('user_id, dilemmas_url')
      .eq('class_id', CLASS_ID)
      .not('dilemmas_url', 'is', null);
    if (error) throw error;
    const ids = (enrolls || []).map((e: any) => e.user_id);
    const { data: profs, error: pErr } = await supabase
      .from('profiles')
      .select('user_id, full_name, email')
      .in('user_id', ids);
    if (pErr) throw pErr;
    const profMap = new Map((profs || []).map((p: any) => [p.user_id, p]));
    const rows: any[] = (enrolls || []).map((e: any) => ({ ...e, profiles: profMap.get(e.user_id) }));

    // Include pending (não-cadastrados) enrollments for this class
    const { data: pendings } = await supabase
      .from('pending_enrollments')
      .select('email, dilemmas_url')
      .eq('class_id', CLASS_ID)
      .not('dilemmas_url', 'is', null);
    for (const p of (pendings || []) as any[]) {
      rows.push({ dilemmas_url: p.dilemmas_url, profiles: { email: p.email, full_name: '' } });
    }

    const results: any[] = [];
    for (const r of (rows as any[])) {
      const email = r.profiles?.email;
      const name = r.profiles?.full_name || '';
      const url = r.dilemmas_url;
      if (!email || !url) { results.push({ email, skipped: true }); continue; }
      if (onlyEmail && email.toLowerCase() !== onlyEmail) continue;
      const resp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_API_KEY}` },
        body: JSON.stringify({
          from: 'Grou <certificados@grougp.com.br>',
          to: [email],
          subject: 'Dilemas de Gestão — novo prazo: 08/06',
          html: buildHtml(name, url),
        }),
      });
      const body = await resp.json().catch(() => ({}));
      results.push({ email, ok: resp.ok, status: resp.status, body });
      await new Promise(r => setTimeout(r, 250));
    }

    return new Response(JSON.stringify({ sent: results.filter(r => r.ok).length, total: results.length, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
