import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendWelcomeEmail, type WelcomeClassInfo } from '../_shared/enrollment-welcome-email.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) return json({ error: 'RESEND_API_KEY não configurada' }, 500);

    const authHeader = req.headers.get('Authorization') ?? '';
    if (!authHeader.startsWith('Bearer ')) return json({ error: 'Não autorizado' }, 401);
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

    const { program_id, class_id, emails, test_email } = await req.json();
    if (!program_id) return json({ error: 'program_id é obrigatório' }, 400);

    const { data: program } = await supabase.from('programs').select('name, description').eq('id', program_id).maybeSingle();
    let klass: any = null;
    let classEndTime: string | null = null;
    if (class_id && class_id !== 'none') {
      const { data } = await supabase
        .from('program_classes')
        .select('name, start_date, end_date, start_time, video_conference_url, specialist')
        .eq('id', class_id)
        .maybeSingle();
      klass = data;
      const { data: sched } = await supabase
        .from('class_schedules')
        .select('end_time')
        .eq('class_id', class_id)
        .not('end_time', 'is', null)
        .order('schedule_date', { ascending: true })
        .limit(1);
      classEndTime = sched?.[0]?.end_time ?? null;
    }

    const info: WelcomeClassInfo = {
      programName: program?.name || 'Programa Grou',
      programDescription: program?.description ?? null,
      className: klass?.name ?? null,
      startDate: klass?.start_date ?? null,
      endDate: klass?.end_date ?? null,
      startTime: klass?.start_time ?? null,
      endTime: classEndTime,
      videoConferenceUrl: klass?.video_conference_url ?? null,
      specialist: klass?.specialist ?? null,
    };

    if (test_email) {
      const res = await sendWelcomeEmail(resendApiKey, info, {
        email: String(test_email).trim().toLowerCase(),
        name: 'Teste',
        tempPassword: 'senha-exemplo',
      });
      return json({ test: true, ...res });
    }

    // Destinatários: lista explícita ou todos os matriculados da turma/programa
    let query = supabase.from('program_enrollments').select('user_id').eq('program_id', program_id);
    if (class_id && class_id !== 'none') query = query.eq('class_id', class_id);
    const { data: enrolls, error: enrollErr } = await query;
    if (enrollErr) throw enrollErr;

    const ids = (enrolls || []).map((e: any) => e.user_id);
    if (ids.length === 0) return json({ sent: 0, total: 0, results: [] });

    const { data: profs } = await supabase
      .from('profiles').select('user_id, full_name, email').in('user_id', ids);

    const filter: string[] | null = Array.isArray(emails) && emails.length
      ? emails.map((e: string) => String(e).trim().toLowerCase())
      : null;

    const results: any[] = [];
    for (const p of (profs || []) as any[]) {
      const email = (p.email || '').toLowerCase();
      if (!email) continue;
      if (filter && !filter.includes(email)) continue;
      const res = await sendWelcomeEmail(resendApiKey, info, { email, name: p.full_name });
      results.push({ email, ...res });
      await new Promise((r) => setTimeout(r, 250));
    }

    return json({ sent: results.filter((r) => r.ok).length, total: results.length, results });
  } catch (e: any) {
    return json({ error: e.message }, 500);
  }
});
