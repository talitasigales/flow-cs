const PDA_BASE = "https://integrations.apispda.com";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

let cachedToken: { value: string; expiresAt: number } | null = null;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function getEndpointFallback(endpoint: string, status: number) {
  if (endpoint === "/api/credit/v1/Credit/CreditConsumeMovement") {
    return [];
  }

  if (endpoint.startsWith("/api/credit/v1/CreditBalance/base/")) {
    return {
      clientCreditBalance: [],
      isLicense: false,
      unavailable: true,
    };
  }

  if (status === 403 && endpoint.startsWith("/api/identity/v1/Accounts/")) {
    return {
      id: endpoint.split("/").pop() ?? null,
      unavailable: true,
    };
  }

  return null;
}

async function parsePdaBody(res: Response) {
  const text = await res.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function getPdaToken(forceRefresh = false): Promise<string> {
  if (!forceRefresh && cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.value;
  }

  const username = Deno.env.get("PDA_USER");
  const password = Deno.env.get("PDA_PASS");

  if (!username || !password) {
    throw new Error("PDA credentials are not configured");
  }

  const res = await fetch(`${PDA_BASE}/api/identity/v1/Users/Login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    const details = await parsePdaBody(res);
    throw new Error(`PDA login failed: ${res.status}${details ? ` - ${JSON.stringify(details)}` : ""}`);
  }

  const data = await res.json();
  if (!data?.token) {
    throw new Error("PDA login succeeded without token");
  }

  cachedToken = { value: data.token, expiresAt: Date.now() + 3500 * 1000 };
  return data.token;
}

async function fetchPda(endpoint: string) {
  let token = await getPdaToken();
  let pdaRes = await fetch(`${PDA_BASE}${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (pdaRes.status === 401) {
    token = await getPdaToken(true);
    pdaRes = await fetch(`${PDA_BASE}${endpoint}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  return pdaRes;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const { endpoint } = await req.json();
    if (!endpoint || typeof endpoint !== "string" || !endpoint.startsWith("/api/")) {
      return jsonResponse({ error: "Invalid endpoint param" }, 400);
    }

    const pdaRes = await fetchPda(endpoint);
    const payload = await parsePdaBody(pdaRes);

    if (!pdaRes.ok) {
      console.error("[pda-proxy] upstream error", {
        endpoint,
        status: pdaRes.status,
        payload,
      });

      const fallback = getEndpointFallback(endpoint, pdaRes.status);
      if (fallback !== null) {
        return jsonResponse(fallback);
      }

      return jsonResponse(
        { error: `PDA API error: ${pdaRes.status} on ${endpoint}`, details: payload },
        502,
      );
    }

    return jsonResponse(payload);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[pda-proxy] internal error", message);
    return jsonResponse({ error: message }, 500);
  }
});
