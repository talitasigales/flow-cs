import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Email é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Use admin API to generate a recovery link - this bypasses email rate limits entirely
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email.trim().toLowerCase(),
    });

    if (error) {
      console.error('Error generating recovery link:', error.message);
      // Don't reveal if the email exists or not
      return new Response(
        JSON.stringify({ success: false, message: 'Não foi possível processar a solicitação. Verifique o email informado.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!data?.properties?.action_link) {
      console.error('No action_link returned');
      return new Response(
        JSON.stringify({ success: false, message: 'Email não encontrado no sistema.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // The action_link from Supabase looks like:
    // https://project.supabase.co/auth/v1/verify?token=...&type=recovery&redirect_to=...
    // We need to add our redirect_to parameter
    const actionLink = new URL(data.properties.action_link);
    actionLink.searchParams.set('redirect_to', 'https://flow-cs.lovable.app/reset-password');

    console.log(`Recovery link generated for: ${email}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        actionLink: actionLink.toString(),
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
