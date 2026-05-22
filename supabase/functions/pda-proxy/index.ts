import { createClient } from "npm:@supabase/supabase-js@2";

const PDA_BASE = "https://integrations.apispda.com";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

let cachedToken: { value: string; expiresAt: number; userId: string | null } | null = null;

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

// TTL por endpoint, em segundos. PDA pediu para reduzirmos chamadas.
function getTtlSeconds(endpoint: string): number {
  if (endpoint.includes("GetBasesByUser")) return 6 * 3600;            // 6h
  if (endpoint.includes("AccountSubBaseDetail")) return 6 * 3600;      // 6h
  if (endpoint.startsWith("/api/credit/v1/CreditBalance/base/")) return 3600; // 1h
  if (endpoint.includes("CreditConsumeMovement")) return 30 * 60;      // 30 min
  return 30 * 60;
}

async function readCache(endpoint: string): Promise<{ payload: unknown; fetched_at: string } | null> {
  const { data, error } = await supabaseAdmin
    .from("pda_cache")
    .select("payload, fetched_at")
    .eq("endpoint", endpoint)
    .maybeSingle();
  if (error) {
    console.warn("[pda-proxy] cache read error", error.message);
    return null;
  }
  return data ?? null;
}

async function writeCache(endpoint: string, payload: unknown) {
  const { error } = await supabaseAdmin
    .from("pda_cache")
    .upsert({ endpoint, payload, fetched_at: new Date().toISOString() }, { onConflict: "endpoint" });
  if (error) console.warn("[pda-proxy] cache write error", error.message);
}

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

  const ud = data.userDetails ?? data.UserDetails ?? {};
  const userId =
    ud.id ?? ud.Id ?? ud.userId ?? ud.UserId ?? ud.userID ?? ud.UserID ??
    data.userId ?? data.UserId ?? data.id ?? data.Id ?? null;

  cachedToken = { value: data.token, expiresAt: Date.now() + 3500 * 1000, userId };
  return data.token;
}

async function getPdaUserId(): Promise<string | null> {
  await getPdaToken();
  return cachedToken?.userId ?? null;
}

async function fetchPda(endpoint: string, timeoutMs = 15000) {
  let token = await getPdaToken();
  const doFetch = (tk: string) => fetch(`${PDA_BASE}${endpoint}`, {
    headers: { Authorization: `Bearer ${tk}` },
    signal: AbortSignal.timeout(timeoutMs),
  });

  let pdaRes = await doFetch(token);

  if (pdaRes.status === 401) {
    token = await getPdaToken(true);
    pdaRes = await doFetch(token);
  }

  return pdaRes;
}

async function refreshInBackground(rawEndpoint: string, endpoint: string) {
  try {
    const pdaRes = await fetchPda(endpoint);
    if (!pdaRes.ok) return;
    const payload = await parsePdaBody(pdaRes);
    const trimmed = trimPayload(rawEndpoint, payload);
    await writeCache(rawEndpoint, trimmed);
    console.log(`[pda-proxy] background refresh OK ${rawEndpoint}`);
  } catch (e) {
    console.warn(`[pda-proxy] background refresh failed ${rawEndpoint}:`, (e as Error).message);
  }
}

function trimPayload(rawEndpoint: string, payload: unknown): unknown {
  // GetBasesByUser retorna milhares de campos por base; mantemos só o essencial.
  if (rawEndpoint.includes("GetBasesByUser") && Array.isArray(payload)) {
    return payload.map((item: any) => ({
      baseId: item.baseId ?? item.BaseId,
      baseName: item.baseName ?? item.BaseName,
      creditsExpirationDate: item.creditsExpirationDate ?? item.CreditsExpirationDate ?? null,
      expirationDate: item.expirationDate ?? item.ExpirationDate ?? null,
      userLimit: item.userLimit ?? item.UserLimit ?? null,
    }));
  }
  return payload;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const body = await req.json();
    const rawEndpoint: string = body?.endpoint;
    const force: boolean = body?.force === true;

    if (!rawEndpoint || typeof rawEndpoint !== "string" || !rawEndpoint.startsWith("/api/")) {
      return jsonResponse({ error: "Invalid endpoint param" }, 400);
    }

    let endpoint = rawEndpoint;
    if (endpoint.includes("{me}") || endpoint.endsWith("/me")) {
      const userId = await getPdaUserId();
      if (!userId) {
        return jsonResponse({ error: "PDA userId not available from login response" }, 500);
      }
      endpoint = endpoint.replace("{me}", userId).replace(/\/me$/, `/${userId}`);
    }

    // Chave de cache usa o endpoint original (com /me) para ser estável entre sessões.
    const cacheKey = rawEndpoint;
    const ttlSec = getTtlSeconds(rawEndpoint);

    if (!force) {
      const cached = await readCache(cacheKey);
      if (cached) {
        const ageMs = Date.now() - new Date(cached.fetched_at).getTime();
        if (ageMs < ttlSec * 1000) {
          console.log(`[pda-proxy] cache HIT ${cacheKey} age=${Math.round(ageMs / 1000)}s ttl=${ttlSec}s`);
          return jsonResponse(cached.payload);
        }
        console.log(`[pda-proxy] cache STALE ${cacheKey} age=${Math.round(ageMs / 1000)}s`);
      } else {
        console.log(`[pda-proxy] cache MISS ${cacheKey}`);
      }
    } else {
      console.log(`[pda-proxy] cache BYPASS (force=true) ${cacheKey}`);
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

      // Em caso de erro, se tivermos cache antigo, devolve para não quebrar a UI.
      const stale = await readCache(cacheKey);
      if (stale) {
        console.warn(`[pda-proxy] returning STALE cache after upstream ${pdaRes.status} ${cacheKey}`);
        return jsonResponse(stale.payload);
      }

      return jsonResponse(
        { error: `PDA API error: ${pdaRes.status} on ${endpoint}`, details: payload },
        502,
      );
    }

    const trimmed = trimPayload(rawEndpoint, payload);
    // Grava no cache (fire-and-forget é tentador, mas await garante consistência sob baixa carga)
    await writeCache(cacheKey, trimmed);

    return jsonResponse(trimmed);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[pda-proxy] internal error", message);
    return jsonResponse({ error: message }, 500);
  }
});
