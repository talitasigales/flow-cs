import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

interface LeadPayload {
  name: string;
  email: string;
  phone: string;
  company: string;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY not configured');

    const body = (await req.json()) as LeadPayload;
    const { name, email, phone, company } = body || ({} as LeadPayload);

    if (!name || !email || !phone || !company) {
      return new Response(JSON.stringify({ error: 'Campos obrigatórios faltando' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (name.length > 200 || email.length > 200 || phone.length > 50 || company.length > 200) {
      return new Response(JSON.stringify({ error: 'Campos excedem tamanho máximo' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const html = `
      <h2>Novo interesse - Certificação Analista Comportamental PDA</h2>
      <p><strong>Nome:</strong> ${escapeHtml(name)}</p>
      <p><strong>E-mail:</strong> ${escapeHtml(email)}</p>
      <p><strong>Telefone:</strong> ${escapeHtml(phone)}</p>
      <p><strong>Empresa:</strong> ${escapeHtml(company)}</p>
      <hr/>
      <p style="color:#666;font-size:12px">Enviado via plataforma Grou - pop-up de divulgação</p>
    `;

    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Plataforma Grou <plataforma@grougp.com.br>',
        to: ['talita.sigales@grougp.com.br', 'fabiana@grougp.com.br'],
        reply_to: email,
        subject: `[PDA Certificação] Novo lead: ${name} - ${company}`,
        html,
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error('Resend error', resp.status, errText);
      return new Response(JSON.stringify({ error: 'Falha ao enviar', details: errText }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
