import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  company: string;
  job_title: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password, full_name, company, job_title }: RegisterRequest = await req.json();

    if (!email || !email.includes('@')) {
      return new Response(
        JSON.stringify({ error: 'Email inválido' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (!password || password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'A senha deve ter pelo menos 6 caracteres' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (!full_name || !company || !job_title) {
      return new Response(
        JSON.stringify({ error: 'Nome completo, empresa e cargo são obrigatórios' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const normalizedEmail = email.trim().toLowerCase();

    // Try to create user directly — handle duplicate via error code
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
      user_metadata: { full_name, company, job_title },
    });

    let userId: string;

    if (createError) {
      const isDuplicate =
        (createError as any).code === 'email_exists' ||
        createError.message?.includes('already been registered');

      if (!isDuplicate) {
        console.error('Error creating user:', createError);
        return new Response(
          JSON.stringify({ error: `Erro ao criar conta: ${createError.message}` }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Email already exists — check if it's a pre-enrolled (never-activated) account
      const { data: profileRow } = await supabaseAdmin
        .from('profiles')
        .select('user_id, password_changed')
        .eq('email', normalizedEmail)
        .maybeSingle();

      let existingUserId = profileRow?.user_id as string | undefined;

      // Fallback: locate via auth admin listUsers if no profile row
      if (!existingUserId) {
        const { data: listData } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
        const found = listData?.users?.find((u: any) => u.email?.toLowerCase() === normalizedEmail);
        existingUserId = found?.id;
      }

      if (!existingUserId) {
        return new Response(
          JSON.stringify({ error: 'Este e-mail já tem cadastro na plataforma. Acesse com sua senha ou clique em "Esqueceu a senha?" para defini-la.' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // If the user already activated their account (changed password), block re-registration
      if (profileRow?.password_changed === true) {
        return new Response(
          JSON.stringify({ error: 'Este e-mail já tem cadastro ativo. Faça login ou use "Esqueceu a senha?" para recuperar o acesso.' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Pre-enrolled account never activated — claim it: set chosen password and update profile
      const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(existingUserId, {
        password,
        email_confirm: true,
        user_metadata: { full_name, company, job_title },
      });

      if (updateAuthError) {
        console.error('Error updating pre-enrolled user password:', updateAuthError);
        return new Response(
          JSON.stringify({ error: `Erro ao ativar conta: ${updateAuthError.message}` }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      userId = existingUserId;
      console.log(`Pre-enrolled account claimed via signup: ${normalizedEmail} (${userId})`);
    } else {
      userId = newUser!.user.id;
    }

    // Update profile with company and job_title
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ full_name, company, job_title, password_changed: true })
      .eq('user_id', userId);

    if (profileError) {
      console.error('Error updating profile:', profileError);
    }

    // Process pending enrollments for this email (match primary OR secondary)
    const { data: pendingRows, error: pendingError } = await supabaseAdmin
      .from('pending_enrollments')
      .select('id, program_id, class_id')
      .or(`email.eq.${normalizedEmail},secondary_email.eq.${normalizedEmail}`);

    if (pendingError) {
      console.error('Error checking pending enrollments:', pendingError);
    } else if (pendingRows && pendingRows.length > 0) {
      for (const row of pendingRows) {
        const { error: enrollError } = await supabaseAdmin
          .from('program_enrollments')
          .insert({
            user_id: userId,
            program_id: row.program_id,
            class_id: row.class_id,
          });

        if (enrollError) {
          console.error(`Error enrolling user in program ${row.program_id}:`, enrollError);
        } else {
          console.log(`Auto-enrolled user ${normalizedEmail} in program ${row.program_id}`);
        }
      }

      // Delete processed pending enrollments
      const pendingIds = pendingRows.map(r => r.id);
      await supabaseAdmin
        .from('pending_enrollments')
        .delete()
        .in('id', pendingIds);
    }

    console.log(`User registered: ${normalizedEmail} (${userId})`);

    return new Response(
      JSON.stringify({ success: true, message: 'Conta criada com sucesso! Faça login.' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in register-user:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
