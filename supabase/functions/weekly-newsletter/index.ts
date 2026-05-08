import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const RESEND_API_URL = 'https://api.resend.com'
const FROM = 'Plataforma Grou <novidades@grougp.com.br>'
const DOMAIN_FILTER = '@grougp.com.br'

// Mapeia table_name -> rótulo amigável e área
const TABLE_LABELS: Record<string, { label: string; area: string }> = {
  profiles: { label: 'Perfis de usuário', area: 'Usuários' },
  user_roles: { label: 'Permissões', area: 'Usuários' },
  pending_enrollments: { label: 'Pré-matrículas', area: 'Academy' },
  enrollments: { label: 'Matrículas', area: 'Academy' },
  programs: { label: 'Programas', area: 'Academy' },
  modules: { label: 'Módulos', area: 'Academy' },
  classes: { label: 'Turmas', area: 'Academy' },
  class_schedules: { label: 'Cronogramas de turma', area: 'Academy' },
  class_modules: { label: 'Módulos das turmas', area: 'Academy' },
  module_materials: { label: 'Materiais', area: 'Academy' },
  module_exercises: { label: 'Exercícios', area: 'Academy' },
  certificates: { label: 'Certificados', area: 'Academy' },
  knowledge_base: { label: 'Base de conhecimento da Nanda', area: 'Nanda' },
  pdis: { label: 'PDIs', area: 'PDI' },
  pdi_actions: { label: 'Ações de PDI', area: 'PDI' },
  pdi_checkins: { label: 'Check-ins de PDI', area: 'PDI' },
  pdi_closures: { label: 'Encerramentos de PDI', area: 'PDI' },
  pda_reports: { label: 'Relatórios PDA', area: 'PDA' },
  job_constructions: { label: 'Construção de cargo', area: 'PDA' },
  matriz_9box: { label: 'Matriz 9Box', area: 'PDA' },
  community_posts: { label: 'Posts da comunidade', area: 'Comunidade' },
  community_comments: { label: 'Comentários', area: 'Comunidade' },
  cs_companies: { label: 'Empresas CS', area: 'Customer Success' },
  cs_touchpoints: { label: 'Touchpoints CS', area: 'Customer Success' },
  cs_contacts: { label: 'Contatos CS', area: 'Customer Success' },
}

const ACTION_VERBS: Record<string, string> = {
  INSERT: 'criados',
  UPDATE: 'atualizados',
  DELETE: 'removidos',
}

function brDate(d: Date) {
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      return new Response(JSON.stringify({ error: 'Missing RESEND_API_KEY' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabase = createClient(supabaseUrl, serviceKey)

    // Período: últimos 7 dias
    const now = new Date()
    const since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Permite override via body { dryRun, recipientsOverride }
    let dryRun = false
    let recipientsOverride: string[] | null = null
    try {
      if (req.method === 'POST') {
        const body = await req.json()
        dryRun = !!body?.dryRun
        recipientsOverride = Array.isArray(body?.recipients) ? body.recipients : null
      }
    } catch (_) { /* sem body */ }

    // Buscar audit_logs da semana
    const { data: logs, error: logsErr } = await supabase
      .from('audit_logs')
      .select('action, table_name, created_at')
      .gte('created_at', since.toISOString())
      .lte('created_at', now.toISOString())
      .limit(50000)

    if (logsErr) throw logsErr

    // Agrupa por (area, table, action)
    type Bucket = { area: string; label: string; action: string; count: number }
    const groups = new Map<string, Bucket>()
    for (const l of logs || []) {
      const meta = TABLE_LABELS[l.table_name as string]
      if (!meta) continue
      const key = `${meta.area}::${meta.label}::${l.action}`
      const b = groups.get(key) || { area: meta.area, label: meta.label, action: l.action, count: 0 }
      b.count += 1
      groups.set(key, b)
    }

    // Organiza por área
    const byArea: Record<string, string[]> = {}
    for (const b of groups.values()) {
      if (b.count < 1) continue
      const verb = ACTION_VERBS[b.action] || b.action.toLowerCase()
      const line = `${b.count} ${b.label.toLowerCase()} ${verb}`
      byArea[b.area] = byArea[b.area] || []
      byArea[b.area].push(line)
    }

    // Conta totais úteis
    const totalEvents = (logs || []).length
    const areasOrdered = Object.keys(byArea).sort()

    // Monta HTML no estilo da plataforma (escuro com laranja)
    const sections = areasOrdered.map(area => `
      <div style="margin: 24px 0; padding: 20px; background: #1a1410; border-radius: 12px; border-left: 4px solid #f59e0b;">
        <h2 style="color: #f59e0b; font-size: 16px; margin: 0 0 12px 0; font-family: Arial, sans-serif;">${area}</h2>
        <ul style="color: #e5e5e5; font-size: 14px; line-height: 1.7; margin: 0; padding-left: 20px; font-family: Arial, sans-serif;">
          ${byArea[area].map(l => `<li>${l}</li>`).join('')}
        </ul>
      </div>
    `).join('')

    const emptyState = `
      <div style="margin: 24px 0; padding: 32px; background: #1a1410; border-radius: 12px; text-align: center;">
        <p style="color: #e5e5e5; font-family: Arial, sans-serif; margin: 0;">
          Semana mais tranquila por aqui — sem grandes mudanças registradas. Bora movimentar a próxima! 🚀
        </p>
      </div>
    `

    const periodo = `${brDate(since)} a ${brDate(now)}`

    const html = `
<!DOCTYPE html>
<html>
<body style="margin: 0; padding: 0; background: #0a0705;">
  <div style="max-width: 640px; margin: 0 auto; padding: 32px 20px; background: #0a0705;">
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="color: #f59e0b; font-size: 28px; margin: 0; font-family: Arial, sans-serif;">Novidades da semana</h1>
      <p style="color: #888; font-size: 13px; margin: 8px 0 0 0; font-family: Arial, sans-serif;">${periodo}</p>
    </div>

    <p style="color: #e5e5e5; font-size: 15px; line-height: 1.6; font-family: Arial, sans-serif;">
      Olá! Esse é o resumo do que rolou na plataforma nos últimos 7 dias. Reunimos as principais movimentações para você acompanhar de pertinho a evolução do produto e o uso pelos times.
    </p>

    ${areasOrdered.length ? sections : emptyState}

    <div style="margin-top: 32px; padding: 20px; background: #1a1410; border-radius: 12px; text-align: center;">
      <p style="color: #888; font-size: 13px; margin: 0 0 12px 0; font-family: Arial, sans-serif;">
        Total de eventos registrados: <strong style="color: #f59e0b;">${totalEvents}</strong>
      </p>
      <a href="https://cs.grougp.com.br" style="display: inline-block; background: #f59e0b; color: #0a0705; text-decoration: none; padding: 10px 24px; border-radius: 8px; font-family: Arial, sans-serif; font-size: 14px; font-weight: 600;">Abrir plataforma</a>
    </div>

    <p style="color: #555; font-size: 11px; text-align: center; margin-top: 32px; font-family: Arial, sans-serif;">
      Você está recebendo este e-mail porque é um colaborador Grou.<br/>
      Plataforma Grou • Customer Success
    </p>
  </div>
</body>
</html>`

    // Buscar destinatários (todos os perfis @grougp.com.br)
    let recipients: string[] = []
    if (recipientsOverride) {
      recipients = recipientsOverride
    } else {
      const { data: profs, error: pErr } = await supabase
        .from('profiles')
        .select('email')
        .ilike('email', `%${DOMAIN_FILTER}`)
      if (pErr) throw pErr
      recipients = Array.from(new Set((profs || []).map((p: any) => p.email).filter(Boolean)))
    }

    if (dryRun) {
      return new Response(JSON.stringify({
        ok: true, dryRun: true, recipientsCount: recipients.length,
        recipientsPreview: recipients.slice(0, 10), totalEvents, areas: areasOrdered, html,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (recipients.length === 0) {
      return new Response(JSON.stringify({ ok: true, sent: 0, message: 'Nenhum destinatário' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const subject = `Novidades da semana • ${brDate(now)}`
    const results: any[] = []

    // Resend permite até 50 destinatários por chamada usando 'bcc'
    const chunkSize = 45
    for (let i = 0; i < recipients.length; i += chunkSize) {
      const chunk = recipients.slice(i, i + chunkSize)
      const resp = await fetch(`${RESEND_API_URL}/emails`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: FROM,
          to: ['novidades@grougp.com.br'],
          bcc: chunk,
          subject,
          html,
        }),
      })
      const j = await resp.json().catch(() => ({}))
      results.push({ ok: resp.ok, status: resp.status, count: chunk.length, response: j })
      if (!resp.ok) console.error('Resend error', resp.status, j)
    }

    return new Response(JSON.stringify({
      ok: true, sent: recipients.length, batches: results.length, totalEvents,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (e: any) {
    console.error('weekly-newsletter error', e)
    return new Response(JSON.stringify({ error: e?.message || String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
