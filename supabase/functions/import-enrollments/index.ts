import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface Entry {
  name?: string;
  email: string;
  secondary_email?: string | null;
  resilience_url?: string | null;
  dilemmas_url?: string | null;
}

const norm = (v: unknown): string => (typeof v === 'string' ? v.trim().toLowerCase() : '');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const token = authHeader.replace('Bearer ', '');
    let userId: string;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userId = payload.sub;
      if (!userId) throw new Error('No sub in token');
    } catch {
      return new Response(JSON.stringify({ error: 'Token inválido' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: authUser, error: authErr } = await supabase.auth.admin.getUserById(userId);
    if (authErr || !authUser?.user) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', userId).eq('role', 'admin').maybeSingle();
    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Acesso negado' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body = await req.json();
    const { emails, entries, program_id, class_id } = body;
    if (!program_id) {
      return new Response(JSON.stringify({ error: 'program_id é obrigatório' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Build normalized entry list (supports new `entries` shape and legacy `emails`)
    let entryList: Entry[] = [];
    if (Array.isArray(entries) && entries.length > 0) {
      entryList = entries
        .map((e: any) => {
          const primary = norm(e?.email);
          const secondary = norm(e?.secondary_email);
          const resilience = typeof e?.resilience_url === 'string' ? e.resilience_url.trim() : '';
          const dilemmas = typeof e?.dilemmas_url === 'string' ? e.dilemmas_url.trim() : '';
          return primary
            ? {
                name: typeof e?.name === 'string' ? e.name.trim() : undefined,
                email: primary,
                secondary_email: secondary && secondary !== primary ? secondary : null,
                resilience_url: resilience || null,
                dilemmas_url: dilemmas || null,
              }
            : null;
        })
        .filter((x): x is Entry => x !== null);
    } else if (emails) {
      const emailList: string[] = Array.isArray(emails)
        ? emails.map((e: string) => norm(e)).filter(Boolean)
        : String(emails).split(/[\n,;]+/).map((e: string) => norm(e)).filter(Boolean);
      entryList = emailList.map((email) => ({ email, secondary_email: null }));
    }

    if (entryList.length === 0) {
      return new Response(JSON.stringify({ error: 'Nenhum e-mail válido informado' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const enrolled: string[] = [];
    const notFound: string[] = [];
    const alreadyEnrolled: string[] = [];
    const pending: string[] = [];

    for (const entry of entryList) {
      const candidates = [entry.email, entry.secondary_email].filter((x): x is string => !!x);

      // Find an existing profile matching either email
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, email')
        .in('email', candidates)
        .limit(1);
      const profile = profiles?.[0];

      if (profile) {
        const insertData: any = { program_id, user_id: profile.user_id };
        if (class_id && class_id !== 'none') insertData.class_id = class_id;
        const { error } = await supabase.from('program_enrollments').insert(insertData);
        if (error) {
          if (error.code === '23505') {
            alreadyEnrolled.push(entry.email);
          } else {
            console.error('enroll error', error);
            notFound.push(entry.email);
          }
        } else {
          enrolled.push(entry.email);
        }
        continue;
      }

      // No profile yet → create / update pending entry
      const pendingData: any = {
        email: entry.email,
        program_id,
        secondary_email: entry.secondary_email || null,
      };
      if (class_id && class_id !== 'none') pendingData.class_id = class_id;

      const { error: pendingErr } = await supabase.from('pending_enrollments').insert(pendingData);

      if (pendingErr) {
        if (pendingErr.code === '23505') {
          // already pending for this primary email/program — try to backfill secondary if missing
          if (entry.secondary_email) {
            const { data: existing } = await supabase
              .from('pending_enrollments')
              .select('id, secondary_email')
              .eq('email', entry.email)
              .eq('program_id', program_id)
              .maybeSingle();
            if (existing && !existing.secondary_email) {
              await supabase
                .from('pending_enrollments')
                .update({ secondary_email: entry.secondary_email })
                .eq('id', existing.id);
            }
          }
          alreadyEnrolled.push(entry.email);
        } else {
          console.error('pending insert error', pendingErr);
          notFound.push(entry.email);
        }
      } else {
        pending.push(entry.email);
      }
    }

    return new Response(JSON.stringify({
      enrolled: enrolled.length,
      pending: pending.length,
      alreadyEnrolled: alreadyEnrolled.length,
      notFound,
      total: entryList.length,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
