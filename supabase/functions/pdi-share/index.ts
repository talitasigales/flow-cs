import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getUserIdFromAuthHeader(req: Request): string | null {
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  try {
    const payload = JSON.parse(atob(auth.slice(7).split(".")[1]));
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

async function handleView(token: string) {
  if (!token || token.length < 16 || token.length > 128) {
    return json({ error: "invalid_token" }, 400);
  }

  const { data: share } = await admin
    .from("pdi_shares")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  if (!share || !share.is_active) return json({ error: "link_invalid" }, 404);
  if (share.expires_at && new Date(share.expires_at).getTime() < Date.now()) {
    return json({ error: "link_expired" }, 410);
  }

  const [{ data: pdi }, { data: actions }, { data: checkins }, { data: closure }] = await Promise.all([
    admin.from("pdis").select("*").eq("id", share.pdi_id).maybeSingle(),
    admin.from("pdi_actions").select("*").eq("pdi_id", share.pdi_id).order("created_at", { ascending: false }),
    admin.from("pdi_checkins").select("*").eq("pdi_id", share.pdi_id).order("checkin_date", { ascending: false }),
    admin.from("pdi_closures").select("*").eq("pdi_id", share.pdi_id).maybeSingle(),
  ]);

  if (!pdi) return json({ error: "link_invalid" }, 404);

  const safePdi: Record<string, unknown> = { ...pdi };
  delete safePdi.user_id;
  if (share.hide_notes) {
    safePdi.notes = null;
  }

  const safeCheckins = (checkins ?? []).map((c: Record<string, unknown>) =>
    share.hide_notes ? { ...c, notes: null } : c
  );

  await admin
    .from("pdi_shares")
    .update({ view_count: (share.view_count ?? 0) + 1, last_viewed_at: new Date().toISOString() })
    .eq("id", share.id);

  return json({
    pdi: safePdi,
    actions: actions ?? [],
    checkins: safeCheckins,
    closure: closure ?? null,
    hide_notes: share.hide_notes,
  });
}

async function handleSendEmail(req: Request, body: Record<string, unknown>) {
  const userId = getUserIdFromAuthHeader(req);
  if (!userId) return json({ error: "unauthorized" }, 401);

  const shareId = typeof body.share_id === "string" ? body.share_id : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const link = typeof body.link === "string" ? body.link : "";

  if (!shareId || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || !link.startsWith("http")) {
    return json({ error: "invalid_input" }, 400);
  }

  const { data: share } = await admin
    .from("pdi_shares")
    .select("id, pdi_id, is_active")
    .eq("id", shareId)
    .maybeSingle();
  if (!share || !share.is_active) return json({ error: "share_not_found" }, 404);

  const { data: pdi } = await admin
    .from("pdis")
    .select("id, user_id, employee_name")
    .eq("id", share.pdi_id)
    .maybeSingle();
  if (!pdi || pdi.user_id !== userId) return json({ error: "forbidden" }, 403);

  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) return json({ error: "email_not_configured" }, 500);

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#0f172a">
      <h2 style="color:#0f172a">Seu Plano de Desenvolvimento Individual</h2>
      <p>Olá, ${pdi.employee_name}!</p>
      <p>Seu PDI está disponível para acompanhamento. Você pode acessá-lo a qualquer momento pelo link abaixo — não é necessário criar conta ou fazer login.</p>
      <p style="margin:28px 0">
        <a href="${link}" style="background:#2bdccf;color:#04292a;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:bold">Ver meu PDI</a>
      </p>
      <p style="font-size:12px;color:#64748b">Este link é pessoal. Não compartilhe com terceiros.</p>
    </div>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "Grou <no-reply@grougp.com.br>",
      to: [email],
      subject: "Seu Plano de Desenvolvimento Individual (PDI)",
      html,
    }),
  });

  if (!res.ok) {
    const details = await res.text();
    console.error("[pdi-share] resend error", res.status, details);
    return json({ error: "email_failed", status: res.status, details }, res.status);
  }

  return json({ ok: true });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const action = typeof body?.action === "string" ? body.action : "view";

    if (action === "view") return await handleView(String(body?.token ?? ""));
    if (action === "send_email") return await handleSendEmail(req, body);

    return json({ error: "unknown_action" }, 400);
  } catch (err) {
    console.error("[pdi-share] error", (err as Error).message);
    return json({ error: (err as Error).message }, 500);
  }
});
