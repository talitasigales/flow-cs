import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/resend'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization') ?? ''
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')

    if (!resendApiKey || !lovableApiKey) {
      return new Response(JSON.stringify({ error: 'Missing email API keys' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Validate caller is admin
    const token = authHeader.replace('Bearer ', '')
    const supabaseAdmin = createClient(supabaseUrl, serviceKey)

    // Decode JWT to get user id
    const parts = token.split('.')
    if (parts.length !== 3) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    const payload = JSON.parse(atob(parts[1]))
    const userId = payload.sub

    // Check admin role
    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle()

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { certificates } = await req.json()
    // certificates: Array<{ certificateId, pdfUrl, studentEmail, studentName, programName }>

    if (!certificates || !Array.isArray(certificates) || certificates.length === 0) {
      return new Response(JSON.stringify({ error: 'No certificates provided' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const results: any[] = []

    for (const cert of certificates) {
      const { certificateId, pdfUrl, studentEmail, studentName, programName } = cert

      if (!certificateId || !pdfUrl || !studentEmail) {
        results.push({ certificateId, success: false, error: 'Missing fields' })
        continue
      }

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1C110B; font-size: 24px; margin: 0;">Parabéns, ${studentName || 'Aluno'}! 🎉</h1>
          </div>
          <p style="color: #333; font-size: 16px; line-height: 1.6;">
            Seu certificado de conclusão do programa <strong>${programName || 'Programa'}</strong> está disponível para download.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${pdfUrl}" 
               style="background-color: #F25C05; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold; display: inline-block;">
              📄 Baixar Certificado
            </a>
          </div>
          <p style="color: #666; font-size: 14px; line-height: 1.5;">
            Caso o botão não funcione, copie e cole o link abaixo no seu navegador:
          </p>
          <p style="color: #F25C05; font-size: 12px; word-break: break-all;">${pdfUrl}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="color: #999; font-size: 12px; text-align: center;">
            Grou — Plataforma de Desenvolvimento
          </p>
        </div>
      `

      try {
        const emailRes = await fetch(`${GATEWAY_URL}/emails`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${lovableApiKey}`,
            'X-Connection-Api-Key': resendApiKey,
          },
          body: JSON.stringify({
            from: 'Grou <onboarding@resend.dev>',
            to: [studentEmail],
            subject: `Seu certificado — ${programName || 'Programa'}`,
            html,
          }),
        })

        if (emailRes.ok) {
          // Update emailed_at
          await supabaseAdmin
            .from('certificates')
            .update({ emailed_at: new Date().toISOString() })
            .eq('id', certificateId)

          results.push({ certificateId, success: true })
        } else {
          const errBody = await emailRes.text()
          results.push({ certificateId, success: false, error: errBody })
        }
      } catch (e: any) {
        results.push({ certificateId, success: false, error: e.message })
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
