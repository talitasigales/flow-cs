import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InviteRequest {
  email: string;
  role: 'admin' | 'user';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify the requesting user via token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      console.error('Authentication error:', userError);
      return new Response(
        JSON.stringify({ error: 'Não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: userRole, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError || !userRole) {
      console.error('Role check error:', roleError);
      return new Response(
        JSON.stringify({ error: 'Acesso negado. Apenas administradores podem convidar usuários.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { email, role }: InviteRequest = await req.json();

    if (!email || !email.includes('@')) {
      return new Response(
        JSON.stringify({ error: 'Email inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Admin ${user.email} is inviting ${email} with role ${role}`);

    // Create admin client for user creation
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Check if user already exists in auth
    const normalizedEmail = email.trim().toLowerCase();
    let existingAuthUser = null;
    
    // Try to create the user first - if it fails with email_exists, look them up
    const tempPassword = crypto.randomUUID();
    const { data: newUserAttempt, error: createAttemptError } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { invited_by: user.email },
    });

    if (createAttemptError && createAttemptError.message?.includes('already been registered')) {
      // User exists - find them by listing with email filter
      const { data: listData } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      existingAuthUser = listData?.users?.find(u => u.email?.toLowerCase() === normalizedEmail) ?? null;
      
      if (!existingAuthUser) {
        // Fallback: check profiles table
        const { data: profileData } = await supabaseAdmin
          .from('profiles')
          .select('user_id')
          .eq('email', normalizedEmail)
          .maybeSingle();
        if (profileData) {
          existingAuthUser = { id: profileData.user_id, email: normalizedEmail };
        }
      }
    } else if (createAttemptError) {
      console.error('Error creating user:', createAttemptError);
      return new Response(
        JSON.stringify({ error: `Erro ao criar usuário: ${createAttemptError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (existingAuthUser) {
      // User already exists - just update their role if needed
      console.log(`User ${email} already exists (id: ${existingAuthUser.id}), updating role to ${role}`);
      
      if (role === 'admin') {
        // Check if already admin
        const { data: existingRole } = await supabaseAdmin
          .from('user_roles')
          .select('id')
          .eq('user_id', existingAuthUser.id)
          .eq('role', 'admin')
          .maybeSingle();

        if (!existingRole) {
          const { error: roleInsertError } = await supabaseAdmin
            .from('user_roles')
            .insert({ user_id: existingAuthUser.id, role: 'admin' });

          if (roleInsertError) {
            console.error('Error adding admin role:', roleInsertError);
          } else {
            console.log(`Admin role added to existing user ${existingAuthUser.id}`);
          }
        }
      } else {
        // Role is 'user' — ensure user role exists but do NOT remove existing admin role
        const { data: existingUserRole } = await supabaseAdmin
          .from('user_roles')
          .select('id')
          .eq('user_id', existingAuthUser.id)
          .eq('role', 'user')
          .maybeSingle();

        if (!existingUserRole) {
          await supabaseAdmin
            .from('user_roles')
            .insert({ user_id: existingAuthUser.id, role: 'user' });
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Usuário já existia. Permissões atualizadas com sucesso.',
          email,
          existingUser: true,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // User was successfully created above (newUserAttempt)
    const newUser = newUserAttempt!;
    console.log(`User created successfully: ${newUser.user.id}`);

    // Add role if admin
    if (role === 'admin') {
      const { error: roleInsertError } = await supabaseAdmin
        .from('user_roles')
        .insert({ user_id: newUser.user.id, role: 'admin' });

      if (roleInsertError) {
        console.error('Error adding admin role:', roleInsertError);
      }
    }

    // Record the invite
    const { error: inviteError } = await supabaseAdmin
      .from('user_invites')
      .insert({
        email,
        invited_by: user.id,
        role,
        accepted_at: new Date().toISOString()
      });

    if (inviteError) {
      console.error('Error recording invite:', inviteError);
    }

    console.log(`User ${email} created.`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Usuário convidado com sucesso',
        email,
        tempPassword,
        note: 'IMPORTANTE: Envie esta senha temporária ao usuário de forma segura.'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in invite-user function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
