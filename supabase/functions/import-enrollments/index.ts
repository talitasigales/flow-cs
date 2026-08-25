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
    const createdAccounts: { email: string; name: string | null; tempPassword: string }[] = [];


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
        if (entry.resilience_url) insertData.resilience_url = entry.resilience_url;
        if (entry.dilemmas_url) insertData.dilemmas_url = entry.dilemmas_url;
        const { error } = await supabase.from('program_enrollments').insert(insertData);
        if (error) {
          if (error.code === '23505') {
            // Already enrolled — backfill links if provided
            if (entry.resilience_url || entry.dilemmas_url) {
              const updateData: any = {};
              if (entry.resilience_url) updateData.resilience_url = entry.resilience_url;
              if (entry.dilemmas_url) updateData.dilemmas_url = entry.dilemmas_url;
              await supabase
                .from('program_enrollments')
                .update(updateData)
                .eq('program_id', program_id)
                .eq('user_id', profile.user_id);
            }
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

      // No profile yet → create the account right away with a provisional password
      const tempPassword = entry.email.split('@')[0];
      let newUserId: string | null = null;

      const { data: created, error: createErr } = await supabase.auth.admin.createUser({
        email: entry.email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { full_name: entry.name || entry.email.split('@')[0] },
      });

      if (createErr) {
        // Account may already exist in auth without a profile row — locate it
        const { data: listData } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
        const found = listData?.users?.find((u: any) => u.email?.toLowerCase() === entry.email);
        newUserId = found?.id ?? null;
        if (!newUserId) {
          console.error('create user error', createErr);
          notFound.push(entry.email);
          continue;
        }
      } else {
        newUserId = created!.user.id;
      }

      // Ensure the profile exists / carries name + provisional-password flag
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', newUserId)
        .maybeSingle();

      const profileFields: any = {
        email: entry.email,
        password_changed: false,
      };
      if (entry.name) profileFields.full_name = entry.name;

      if (existingProfile) {
        await supabase.from('profiles').update(profileFields).eq('user_id', newUserId);
      } else {
        await supabase.from('profiles').insert({ user_id: newUserId, ...profileFields });
      }

      const enrollData: any = { program_id, user_id: newUserId };
      if (class_id && class_id !== 'none') enrollData.class_id = class_id;
      if (entry.resilience_url) enrollData.resilience_url = entry.resilience_url;
      if (entry.dilemmas_url) enrollData.dilemmas_url = entry.dilemmas_url;

      const { error: enrollErr } = await supabase.from('program_enrollments').insert(enrollData);
      if (enrollErr) {
        if (enrollErr.code === '23505') {
          alreadyEnrolled.push(entry.email);
        } else {
          console.error('enroll error (new account)', enrollErr);
          notFound.push(entry.email);
        }
        continue;
      }

      // Clean up any stale pending row for this email/program
      await supabase
        .from('pending_enrollments')
        .delete()
        .eq('program_id', program_id)
        .eq('email', entry.email);

      enrolled.push(entry.email);
      createdAccounts.push({ email: entry.email, name: entry.name || null, tempPassword });
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
