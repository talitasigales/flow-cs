import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const GRAPH_URL = 'https://graph.facebook.com/v20.0';

interface Payload {
  class_id: string;
  reminder_type: '24h' | '30min';
  test_phone?: string;
  test_name?: string;
}

function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '');
  if (!digits) return null;
  // If already starts with country code 55 and length >= 12, keep as is
  if (digits.startsWith('55') && digits.length >= 12) return digits;
  // Brazilian mobile without country code (10 or 11 digits)
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return digits;
}

function formatDateTime(date: string, time: string | null, tz: string): string {
  try {
    const iso = `${date}T${time || '00:00'}:00`;
    const d = new Date(iso);
    return d.toLocaleString('pt-BR', {
      timeZone: tz || 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return `${date} ${time || ''}`.trim();
  }
}

async function sendTemplate(params: {
  token: string;
  phoneNumberId: string;
  to: string;
  template: string;
  language: string;
  variables: string[];
}) {
  const { token, phoneNumberId, to, template, language, variables } = params;
  const body = {
    messaging_product: 'whatsapp',
    to,
    type: 'template',
    template: {
      name: template,
      language: { code: language },
      components: [
        {
          type: 'body',
          parameters: variables.map((v) => ({ type: 'text', text: v })),
        },
      ],
    },
  };
  const res = await fetch(`${GRAPH_URL}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, body: text };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const token = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
    const phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');
    const tpl24 = Deno.env.get('WHATSAPP_TEMPLATE_REMINDER_24H');
    const tpl30 = Deno.env.get('WHATSAPP_TEMPLATE_REMINDER_30MIN');
    const language = Deno.env.get('WHATSAPP_TEMPLATE_LANGUAGE') || 'pt_BR';

    if (!token || !phoneNumberId || !tpl24 || !tpl30) {
      return new Response(
        JSON.stringify({ error: 'WhatsApp credentials/templates not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const payload = (await req.json()) as Payload;
    if (!payload?.class_id || !payload?.reminder_type) {
      return new Response(JSON.stringify({ error: 'class_id and reminder_type required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const template = payload.reminder_type === '24h' ? tpl24 : tpl30;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: cls, error: clsErr } = await supabase
      .from('program_classes')
      .select('id, name, start_date, start_time, timezone, video_conference_url, program_id, programs(name)')
      .eq('id', payload.class_id)
      .maybeSingle();

    if (clsErr || !cls) {
      return new Response(JSON.stringify({ error: 'Class not found', details: clsErr?.message }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!cls.video_conference_url) {
      return new Response(
        JSON.stringify({ error: 'Turma sem link da sala (video_conference_url) configurado.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const programName = (cls as any).programs?.name || 'Programa';
    const whenStr = formatDateTime(cls.start_date, cls.start_time, cls.timezone);
    const link = cls.video_conference_url;

    // Test mode
    if (payload.test_phone) {
      const to = normalizePhone(payload.test_phone);
      if (!to) {
        return new Response(JSON.stringify({ error: 'Invalid test_phone' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const result = await sendTemplate({
        token,
        phoneNumberId,
        to,
        template,
        language,
        variables: [payload.test_name || 'Aluno(a)', programName, whenStr, link],
      });
      return new Response(JSON.stringify({ test: true, ...result }), {
        status: result.ok ? 200 : 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Collect recipients: enrollments (join profiles) + pending_enrollments
    const { data: enrolls } = await supabase
      .from('program_enrollments')
      .select('user_id, profiles!inner(full_name, phone)')
      .eq('class_id', cls.id);

    const { data: pendings } = await supabase
      .from('pending_enrollments')
      .select('full_name, phone, email')
      .eq('class_id', cls.id);

    const recipients: { name: string; phone: string; source: string; key: string }[] = [];
    const seen = new Set<string>();

    for (const e of enrolls || []) {
      const p: any = (e as any).profiles;
      const phone = normalizePhone(p?.phone);
      if (!phone) continue;
      if (seen.has(phone)) continue;
      seen.add(phone);
      recipients.push({ name: p?.full_name || 'Aluno(a)', phone, source: 'enrollment', key: (e as any).user_id });
    }
    for (const p of pendings || []) {
      const phone = normalizePhone((p as any).phone);
      if (!phone) continue;
      if (seen.has(phone)) continue;
      seen.add(phone);
      recipients.push({ name: (p as any).full_name || 'Aluno(a)', phone, source: 'pending', key: (p as any).email });
    }

    const results: any[] = [];
    let sent = 0;
    let failed = 0;
    for (const r of recipients) {
      const res = await sendTemplate({
        token,
        phoneNumberId,
        to: r.phone,
        template,
        language,
        variables: [r.name, programName, whenStr, link],
      });
      if (res.ok) sent++;
      else failed++;
      results.push({ to: r.phone, name: r.name, ok: res.ok, status: res.status, body: res.body });
    }

    // Mark sent
    const col = payload.reminder_type === '24h' ? 'whatsapp_reminder_24h_sent_at' : 'whatsapp_reminder_30min_sent_at';
    await supabase.from('program_classes').update({ [col]: new Date().toISOString() }).eq('id', cls.id);

    return new Response(
      JSON.stringify({
        sent,
        failed,
        skipped_no_phone:
          (enrolls?.length || 0) + (pendings?.length || 0) - recipients.length,
        total_recipients: recipients.length,
        reminder_type: payload.reminder_type,
        class: { id: cls.id, name: cls.name, program: programName, when: whenStr },
        results,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err: any) {
    console.error(err);
    return new Response(JSON.stringify({ error: err?.message || 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
