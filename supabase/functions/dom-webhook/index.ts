import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Map Dom Pagamentos link IDs to encounter counts
const LINK_MAP: Record<string, number> = {
  '5ec1b55b-93ad-483b-978c-cadfe610d0d2': 1,  // avulso
  '1ea7977b-44bf-44dc-861e-aa0db9a65603': 5,  // jornada completa
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    const payload = await req.json();
    console.log('[dom-webhook] Payload received:', JSON.stringify(payload));

    // Try to extract event type - adjust field names based on actual payload
    const eventType = payload.event || payload.type || payload.status || payload.eventType;
    console.log('[dom-webhook] Event type:', eventType);

    // Only process approved charges
    const approvedEvents = ['CHARGE-APPROVED', 'charge_approved', 'approved', 'APPROVED', 'paid', 'PAID'];
    if (!approvedEvents.includes(eventType)) {
      console.log('[dom-webhook] Ignoring non-approved event:', eventType);
      return new Response(JSON.stringify({ message: 'Event ignored', event: eventType }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extract customer data - try multiple common field structures
    const customer = payload.customer || payload.payer || payload.buyer || payload.client || {};
    const charge = payload.charge || payload.payment || payload.transaction || payload;
    
    const email = (
      customer.email || payload.email || charge.email || ''
    ).trim().toLowerCase();
    
    const name = customer.name || customer.full_name || payload.name || charge.name || '';
    
    // Extract transaction ID for deduplication
    const transactionId = (
      payload.id || payload.transaction_id || payload.charge_id || 
      charge.id || charge.transaction_id || crypto.randomUUID()
    ).toString();

    // Extract link ID to determine encounter count
    const linkId = (
      payload.link_id || payload.payment_link_id || charge.link_id || 
      payload.linkId || charge.linkId || ''
    ).toString();

    const encounterCount = LINK_MAP[linkId] || null;

    console.log('[dom-webhook] Parsed data:', { email, name, transactionId, linkId, encounterCount });

    if (!email || !email.includes('@')) {
      console.error('[dom-webhook] Invalid or missing email:', email);
      return new Response(JSON.stringify({ error: 'Email inválido ou ausente no payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check for duplicate transaction
    const { data: existingPayment } = await supabase
      .from('bussola_payments')
      .select('id')
      .eq('dom_transaction_id', transactionId)
      .maybeSingle();

    if (existingPayment) {
      console.log('[dom-webhook] Duplicate transaction ignored:', transactionId);
      return new Response(JSON.stringify({ message: 'Transação já processada', transactionId }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Record the payment
    const finalEncounterCount = encounterCount || 5;
    await supabase.from('bussola_payments').insert({
      dom_transaction_id: transactionId,
      customer_email: email,
      customer_name: name || null,
      encounter_count: finalEncounterCount,
      status: 'approved',
      raw_payload: payload,
    });

    // Find or create user
    let userId: string | null = null;

    // Check if user exists by email in profiles
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('email', email)
      .maybeSingle();

    if (existingProfile) {
      userId = existingProfile.user_id;
      console.log('[dom-webhook] Existing user found:', userId);
    } else {
      // Check auth users via admin API (paginated search)
      const { data: authUsers } = await supabase.auth.admin.listUsers({ page: 1, perPage: 50 });
      const existingAuthUser = authUsers?.users?.find(u => u.email?.toLowerCase() === email);

      if (existingAuthUser) {
        userId = existingAuthUser.id;
        console.log('[dom-webhook] Existing auth user found:', userId);
      } else {
        // Create new user with temporary password
        const tempPassword = `Bussola@${Date.now().toString(36)}`;
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: { full_name: name || email.split('@')[0] },
        });

        if (createError) {
          console.error('[dom-webhook] Error creating user:', createError);
          return new Response(JSON.stringify({ error: 'Erro ao criar usuário', details: createError.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        userId = newUser.user.id;
        console.log('[dom-webhook] New user created:', userId);

        // Update profile with name
        if (name) {
          await supabase.from('profiles').update({ full_name: name }).eq('user_id', userId);
        }

        // Assign 'young' role
        await supabase.from('user_roles').insert({ user_id: userId, role: 'young' });
      }
    }

    // Get Bússola program
    const { data: program } = await supabase
      .from('programs')
      .select('id')
      .eq('slug', 'bussola')
      .single();

    if (!program) {
      console.error('[dom-webhook] Bússola program not found');
      return new Response(JSON.stringify({ error: 'Programa Bússola não encontrado' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Enroll in program (ignore duplicate)
    const { error: enrollError } = await supabase
      .from('program_enrollments')
      .insert({ program_id: program.id, user_id: userId });

    if (enrollError && enrollError.code !== '23505') {
      console.error('[dom-webhook] Enrollment error:', enrollError);
    }

    // Create bussola_assignment without psychologist
    const { error: assignError } = await supabase
      .from('bussola_assignments')
      .insert({
        program_id: program.id,
        young_user_id: userId,
        psychologist_id: null,
        encounter_count: finalEncounterCount,
        young_name: name || null,
        young_email: email,
        status: 'pending_assignment',
      });

    if (assignError) {
      console.error('[dom-webhook] Assignment error:', assignError);
    }

    console.log('[dom-webhook] Successfully processed payment for:', email, '| Encounters:', finalEncounterCount);

    return new Response(JSON.stringify({
      success: true,
      user_id: userId,
      encounter_count: finalEncounterCount,
      transaction_id: transactionId,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('[dom-webhook] Unexpected error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
