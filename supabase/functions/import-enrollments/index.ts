import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify caller is admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').maybeSingle();
    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Acesso negado' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { emails, program_id, class_id } = await req.json();
    if (!emails || !program_id) {
      return new Response(JSON.stringify({ error: 'emails e program_id são obrigatórios' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const emailList: string[] = Array.isArray(emails) ? emails : emails.split(/[\n,;]+/).map((e: string) => e.trim().toLowerCase()).filter(Boolean);

    const enrolled: string[] = [];
    const notFound: string[] = [];
    const alreadyEnrolled: string[] = [];

    for (const email of emailList) {
      const { data: profile } = await supabase.from('profiles').select('user_id').eq('email', email).maybeSingle();
      if (!profile) {
        notFound.push(email);
        continue;
      }
      const insertData: any = { program_id, user_id: profile.user_id };
      if (class_id && class_id !== 'none') {
        insertData.class_id = class_id;
      }
      const { error } = await supabase.from('program_enrollments').insert(insertData);
      if (error) {
        if (error.code === '23505') {
          alreadyEnrolled.push(email);
        } else {
          notFound.push(email);
        }
      } else {
        enrolled.push(email);
      }
    }

    return new Response(JSON.stringify({ enrolled: enrolled.length, alreadyEnrolled: alreadyEnrolled.length, notFound, total: emailList.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
