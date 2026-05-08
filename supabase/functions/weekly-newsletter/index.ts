import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const RESEND_API_URL = 'https://api.resend.com'
const FROM = 'Plataforma Grou <novidades@grougp.com.br>'
const DOMAIN_FILTER = '@grougp.com.br'

const CATEGORY_META: Record<string, { label: string; color: string }> = {
  novidade:  { label: 'Novidade',  color: '#10b981' },
  melhoria:  { label: 'Melhoria',  color: '#f59e0b' },
  'correção':{ label: 'Correção',  color: '#3b82f6' },
  correcao:  { label: 'Correção',  color: '#3b82f6' },
  ajuste:    { label: 'Ajuste',    color: '#a78bfa' },
}

function brDate(d: Date) {
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function escapeHtml(s: string) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c] as string))
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

    let dryRun = false
    let recipientsOverride: string[] | null = null
    let daysWindow = 7
    try {
      if (req.method === 'POST') {
        const body = await req.json()
        dryRun = !!body?.dryRun
        recipientsOverride = Array.isArray(body?.recipients) ? body.recipients : null
        if (typeof body?.days === 'number' && body.days > 0) daysWindow = body.days
      }
    } catch (_) {}

    const now = new Date()
    const since = new Date(now.getTime() - daysWindow * 24 * 60 * 60 * 1000)

    const { data: entries, error } = await supabase
      .from('platform_changelog')
      .select('title, description, category, area, published_at')
      .gte('published_at', since.toISOString())
      .lte('published_at', now.toISOString())
      .order('published_at', { ascending: false })
      .limit(500)
    if (error) throw error

    // Agrupa por área
    const byArea: Record<string, any[]> = {}
    for (const e of entries || []) {
      byArea[e.area] = byArea[e.area] || []
      byArea[e.area].push(e)
    }
    const areasOrdered = Object.keys(byArea).sort()
    const totalEntries = (entries || []).length

    const renderEntry = (e: any) => {
      const meta = CATEGORY_META[e.category] || { label: e.category, color: '#888' }
      return `
        <div style="margin: 12px 0; padding: 14px; background: #110b08; border-radius: 8px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
            <span style="display: inline-block; background: ${meta.color}; color: #0a0705; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.5px;">${meta.label}</span>
            <strong style="color: #fff; font-size: 15px; font-family: Arial, sans-serif;">${escapeHtml(e.title)}</strong>
          </div>
          <p style="color: #c9c0b8; font-size: 14px; line-height: 1.6; margin: 0; font-family: Arial, sans-serif;">${escapeHtml(e.description)}</p>
        </div>`
    }

    const sections = areasOrdered.map(area => `
      <div style="margin: 24px 0;">
        <h2 style="color: #f59e0b; font-size: 14px; margin: 0 0 8px 0; font-family: Arial, sans-serif; text-transform: uppercase; letter-spacing: 1px;">${escapeHtml(area)}</h2>
        ${byArea[area].map(renderEntry).join('')}
      </div>
    `).join('')

    const emptyState = `
      <div style="margin: 24px 0; padding: 32px; background: #1a1410; border-radius: 12px; text-align: center;">
        <p style="color: #c9c0b8; font-family: Arial, sans-serif; margin: 0;">
          Semana sem novidades publicadas — bora movimentar a próxima! 🚀
        </p>
      </div>`

    const periodo = `${brDate(since)} a ${brDate(now)}`

    const html = `
<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#0a0705;">
  <div style="max-width:640px;margin:0 auto;padding:32px 20px;background:#0a0705;">
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="color:#f59e0b;font-size:28px;margin:0;font-family:Arial,sans-serif;">Novidades da semana</h1>
      <p style="color:#888;font-size:13px;margin:8px 0 0 0;font-family:Arial,sans-serif;">${periodo}</p>
    </div>
    <p style="color:#e5e5e5;font-size:15px;line-height:1.6;font-family:Arial,sans-serif;">
      Olá! Esse é o resumo do que foi <strong>implementado, ajustado e melhorado</strong> na plataforma nessa semana. Bora ver o que tem de novo? 👇
    </p>
    ${areasOrdered.length ? sections : emptyState}
    <div style="margin-top:32px;padding:20px;background:#1a1410;border-radius:12px;text-align:center;">
      <a href="https://cs.grougp.com.br" style="display:inline-block;background:#f59e0b;color:#0a0705;text-decoration:none;padding:10px 24px;border-radius:8px;font-family:Arial,sans-serif;font-size:14px;font-weight:600;">Abrir plataforma</a>
    </div>
    <p style="color:#555;font-size:11px;text-align:center;margin-top:32px;font-family:Arial,sans-serif;">
      Você está recebendo este e-mail porque é colaborador Grou.<br/>Plataforma Grou • Customer Success
    </p>
  </div>
</body></html>`

    let recipients: string[] = []
    if (recipientsOverride) {
      recipients = recipientsOverride
    } else {
      const { data: profs, error: pErr } = await supabase
        .from('profiles').select('email').ilike('email', `%${DOMAIN_FILTER}`)
      if (pErr) throw pErr
      recipients = Array.from(new Set((profs || []).map((p: any) => p.email).filter(Boolean)))
    }

    if (dryRun) {
      return new Response(JSON.stringify({
        ok: true, dryRun: true, recipientsCount: recipients.length,
        recipientsPreview: recipients.slice(0, 10), totalEntries, areas: areasOrdered, html,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (recipients.length === 0) {
      return new Response(JSON.stringify({ ok: true, sent: 0, message: 'Nenhum destinatário' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (totalEntries === 0) {
      return new Response(JSON.stringify({ ok: true, sent: 0, message: 'Sem entradas no changelog dessa semana — newsletter não foi enviada.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const subject = `Novidades da semana • ${brDate(now)}`
    const results: any[] = []
    const chunkSize = 45
    for (let i = 0; i < recipients.length; i += chunkSize) {
      const chunk = recipients.slice(i, i + chunkSize)
      const resp = await fetch(`${RESEND_API_URL}/emails`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: FROM, to: ['novidades@grougp.com.br'], bcc: chunk, subject, html,
        }),
      })
      const j = await resp.json().catch(() => ({}))
      results.push({ ok: resp.ok, status: resp.status, count: chunk.length, response: j })
      if (!resp.ok) console.error('Resend error', resp.status, j)
    }

    return new Response(JSON.stringify({
      ok: true, sent: recipients.length, batches: results.length, totalEntries,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (e: any) {
    console.error('weekly-newsletter error', e)
    return new Response(JSON.stringify({ error: e?.message || String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
