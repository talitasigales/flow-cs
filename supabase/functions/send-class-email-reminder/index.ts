import { createClient } from 'npm:@supabase/supabase-js@2';
import {
  ReminderClassInfo,
  ReminderType,
  sendReminderEmail,
} from '../_shared/class-reminder-email.ts';
import { startDeliveryLog, finishDeliveryLog } from '../_shared/delivery-log.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-internal-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

// Sessões são armazenadas em horário local (America/Sao_Paulo, UTC-3).
const BR_OFFSET = '-03:00';
const sessionStartUtc = (date: string, time?: string | null) => {
  const t = (time || '09:00:00').slice(0, 8);
  const ms = new Date(`${date}T${t.length === 5 ? `${t}:00` : t}${BR_OFFSET}`).getTime();
  return Number.isNaN(ms) ? 0 : ms;
};

const MIN = 60_000;

interface Session {
  class_id: string;
  session_date: string;
  start_time: string | null;
  end_time: string | null;
  title: string | null;
  cls: any;
}

async function collectRecipients(supabase: any, classId: string) {
  const recipients: { email: string; name: string | null }[] = [];
  const seen = new Set<string>();

  const { data: enrolls } = await supabase
    .from('program_enrollments')
    .select('user_id, profiles!inner(full_name, email)')
    .eq('class_id', classId);

  for (const e of enrolls || []) {
    const p: any = e.profiles;
    const email = (p?.email || '').trim().toLowerCase();
    if (!email || seen.has(email)) continue;
    seen.add(email);
    recipients.push({ email, name: p?.full_name || null });
  }

  const { data: pendings } = await supabase
    .from('pending_enrollments')
    .select('email')
    .eq('class_id', classId);

  for (const p of pendings || []) {
    const email = (p.email || '').trim().toLowerCase();
    if (!email || seen.has(email)) continue;
    seen.add(email);
    recipients.push({ email, name: null });
  }

  return recipients;
}

function buildInfo(s: Session): ReminderClassInfo {
  return {
    programName: s.cls.programs?.name || 'Programa',
    className: s.cls.name,
    sessionTitle: s.title,
    sessionDate: s.session_date,
    startTime: s.start_time,
    endTime: s.end_time,
    timezone: s.cls.timezone || 'America/Sao_Paulo',
    videoConferenceUrl: s.cls.video_conference_url,
    specialist: s.cls.specialist,
  };
}

async function dispatch(
  supabase: any,
  resendApiKey: string,
  s: Session,
  type: ReminderType,
): Promise<any> {
  // Dedup: a chave única impede reenvio do mesmo lembrete.
  const { error: logErr } = await supabase.from('class_reminder_logs').insert({
    class_id: s.class_id,
    session_date: s.session_date,
    session_start_time: s.start_time,
    reminder_type: type,
    channel: 'email',
  });
  if (logErr) {
    return { class_id: s.class_id, session_date: s.session_date, type, skipped: 'already_sent' };
  }

  const info = buildInfo(s);
  const recipients = await collectRecipients(supabase, s.class_id);
  let sent = 0;
  let failed = 0;
  for (const r of recipients) {
    const logId = await startDeliveryLog(supabase, {
      class_id: s.class_id,
      program_id: s.cls.program_id ?? null,
      recipient_name: r.name,
      recipient_email: r.email,
      channel: 'email',
      message_type: type === '24h' ? 'reminder_24h' : 'reminder_1h',
      session_date: s.session_date,
    });
    const res = await sendReminderEmail(resendApiKey, info, type, r.email, r.name);
    await finishDeliveryLog(supabase, logId, !!res.ok, (res as any).body ?? null);
    if (res.ok) sent++;
    else {
      failed++;
      console.error(`Falha ao enviar lembrete para ${r.email}: ${res.status} ${JSON.stringify(res.body)}`);
    }
  }

  await supabase
    .from('class_reminder_logs')
    .update({ recipients_count: sent })
    .eq('class_id', s.class_id)
    .eq('session_date', s.session_date)
    .eq('reminder_type', type)
    .eq('channel', 'email');

  const col = type === '24h' ? 'email_reminder_24h_sent_at' : 'email_reminder_1h_sent_at';
  await supabase.from('program_classes').update({ [col]: new Date().toISOString() }).eq('id', s.class_id);

  return { class_id: s.class_id, session_date: s.session_date, type, sent, failed, total: recipients.length };
}

async function loadSessions(supabase: any, classId?: string): Promise<Session[]> {
  const today = new Date(Date.now() - 6 * 3600_000).toISOString().slice(0, 10);

  let clsQuery = supabase
    .from('program_classes')
    .select('id, name, program_id, start_date, end_date, start_time, timezone, video_conference_url, specialist, email_reminders_enabled, programs(name)');
  if (classId) clsQuery = clsQuery.eq('id', classId);
  else clsQuery = clsQuery.eq('email_reminders_enabled', true).gte('end_date', today);

  const { data: classes } = await clsQuery;
  if (!classes?.length) return [];

  const ids = classes.map((c: any) => c.id);
  const { data: schedules } = await supabase
    .from('class_schedules')
    .select('class_id, title, schedule_date, start_time, end_time')
    .in('class_id', ids)
    .gte('schedule_date', today);

  const byClass = new Map<string, any[]>();
  for (const s of schedules || []) {
    const arr = byClass.get(s.class_id) || [];
    arr.push(s);
    byClass.set(s.class_id, arr);
  }

  const sessions: Session[] = [];
  for (const cls of classes) {
    const rows = byClass.get(cls.id);
    if (rows?.length) {
      for (const r of rows) {
        sessions.push({
          class_id: cls.id,
          session_date: r.schedule_date,
          start_time: r.start_time || cls.start_time,
          end_time: r.end_time,
          title: r.title,
          cls,
        });
      }
    } else if (cls.start_date) {
      sessions.push({
        class_id: cls.id,
        session_date: cls.start_date,
        start_time: cls.start_time,
        end_time: null,
        title: null,
        cls,
      });
    }
  }
  return sessions;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) return json({ error: 'RESEND_API_KEY não configurada' }, 500);

    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const internalKey = req.headers.get('x-internal-key');
    const isInternal =
      !!internalKey &&
      (internalKey === serviceKey ||
        internalKey === Deno.env.get('INTERNAL_TEST_KEY') ||
        internalKey === Deno.env.get('INTERNAL_TEST_KEY_V2'));

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, serviceKey);

    const payload = await req.json().catch(() => ({} as any));

    if (!isInternal) {
      // Exige admin autenticado para chamadas manuais
      const auth = req.headers.get('Authorization') || '';
      const token = auth.replace('Bearer ', '');
      const { data: userData } = await supabase.auth.getUser(token);
      const uid = userData?.user?.id;
      if (!uid) return json({ error: 'Não autorizado' }, 401);
      const { data: isAdmin } = await supabase.rpc('has_role', { _user_id: uid, _role: 'admin' });
      if (!isAdmin) return json({ error: 'Apenas administradores' }, 403);
    }

    // ---- Envio manual / teste ----
    if (payload?.class_id) {
      const type: ReminderType = payload.reminder_type === '1h' ? '1h' : '24h';
      const sessions = await loadSessions(supabase, payload.class_id);
      if (!sessions.length) return json({ error: 'Turma sem datas configuradas' }, 404);

      const now = Date.now();
      const upcoming =
        sessions
          .filter((s) => sessionStartUtc(s.session_date, s.start_time) >= now - 6 * 3600_000)
          .sort((a, b) => sessionStartUtc(a.session_date, a.start_time) - sessionStartUtc(b.session_date, b.start_time))[0] ||
        sessions[0];

      if (payload.preview) {
        const info = buildInfo(upcoming);
        const recipients = await collectRecipients(supabase, payload.class_id);
        return json({
          preview: true,
          subject: buildReminderSubject(info, type),
          html: buildReminderHtml(info, type, recipients[0]?.name || 'Nome do Aluno'),
          recipients_count: recipients.length,
          sample_recipients: recipients.slice(0, 5),
          session: { date: upcoming.session_date, start_time: upcoming.start_time, end_time: upcoming.end_time },
        });
      }

      if (payload.test_email) {

        const res = await sendReminderEmail(
          resendApiKey,
          buildInfo(upcoming),
          type,
          payload.test_email,
          payload.test_name || null,
        );
        return json({ test: true, ...res }, res.ok ? 200 : 502);
      }

      const result = await dispatch(supabase, resendApiKey, upcoming, type);
      return json(result);
    }

    // ---- Modo cron: varre próximas sessões ----
    const sessions = await loadSessions(supabase);
    const now = Date.now();
    const results: any[] = [];

    for (const s of sessions) {
      const start = sessionStartUtc(s.session_date, s.start_time);
      if (!start) continue;
      const diff = start - now; // ms até o início

      let type: ReminderType | null = null;
      if (diff <= 24 * 60 * MIN && diff > 23 * 60 * MIN) type = '24h';
      else if (diff <= 60 * MIN && diff > 40 * MIN) type = '1h';
      if (!type) continue;

      results.push(await dispatch(supabase, resendApiKey, s, type));
    }

    return json({ scanned: sessions.length, dispatched: results.length, results });
  } catch (err: any) {
    console.error(err);
    return json({ error: err?.message || 'Erro interno' }, 500);
  }
});
