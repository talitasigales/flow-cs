import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const PDA_BASE = "https://integrations.apispda.com";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getPdaToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) return cachedToken.value;
  const res = await fetch(`${PDA_BASE}/api/identity/v1/Users/Login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: Deno.env.get("PDA_USER"),
      password: Deno.env.get("PDA_PASS"),
    }),
  });
  if (!res.ok) throw new Error(`PDA login failed: ${res.status}`);
  const data = await res.json();
  cachedToken = { value: data.token, expiresAt: Date.now() + 3500 * 1000 };
  return data.token;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const { endpoint } = await req.json();
    if (!endpoint || typeof endpoint !== "string" || !endpoint.startsWith("/api/")) {
      throw new Error("Invalid endpoint param");
    }

    const token = await getPdaToken();
    const pdaRes = await fetch(`${PDA_BASE}${endpoint}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!pdaRes.ok) throw new Error(`PDA API error: ${pdaRes.status} on ${endpoint}`);

    const data = await pdaRes.json();
    return new Response(JSON.stringify(data), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
