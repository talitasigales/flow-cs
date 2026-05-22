import { supabase } from "@/integrations/supabase/client";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function getClientFallback(endpoint: string) {
  if (endpoint === "/api/identity/v1/Accounts/AccountSubBaseDetail") {
    return [];
  }

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

  return null;
}

async function pdaFetch(endpoint: string, options: { force?: boolean } = {}, retries = 3, delayMs = 500): Promise<any> {
  const { force = false } = options;
  try {
    const { data, error } = await supabase.functions.invoke("pda-proxy", {
      body: { endpoint, force },
    });

    const message = error?.message || data?.error;
    const isTransientBootError = typeof message === "string" && (
      message.includes("BOOT_ERROR") ||
      message.includes("Function failed to start") ||
      message.includes("Edge function returned 503") ||
      message.includes("503 Service Temporarily Unavailable")
    );

    const isTransientUpstreamError = typeof message === "string" && (
      message.includes("PDA login failed: 502") ||
      message.includes("PDA login failed: 503") ||
      message.includes("Bad gateway")
    );

    if ((isTransientBootError || isTransientUpstreamError) && retries > 0) {
      await wait(delayMs);
      return pdaFetch(endpoint, options, retries - 1, delayMs * 2);
    }

    if (isTransientBootError || isTransientUpstreamError) {
      const fallback = getClientFallback(endpoint);
      if (fallback !== null) {
        return fallback;
      }
    }

    if (error) throw new Error(error.message);
    if (data?.error) throw new Error(data.error);
    return data;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const isTransientInvokeError = (
      message.includes("BOOT_ERROR") ||
      message.includes("Function failed to start") ||
      message.includes("Edge function returned 503") ||
      message.includes("FunctionsFetchError") ||
      message.includes("Failed to send a request to the Edge Function")
    );

    if (isTransientInvokeError && retries > 0) {
      await wait(delayMs);
      return pdaFetch(endpoint, options, retries - 1, delayMs * 2);
    }

    if (isTransientInvokeError) {
      const fallback = getClientFallback(endpoint);
      if (fallback !== null) {
        return fallback;
      }
    }

    throw err;
  }
}

export interface PdaSubBaseDetail {
  accountId: string;
  baseId: string;
  baseName: string;
  link: string;
  subBaseId: string;
  subBaseName: string;
}

export interface PdaCreditBalanceEntry {
  baseId: string;
  subbaseId: string;
  remainingCredits: number;
  spentCredits: number;
  creditBalanceId: string;
  creditType: string | null;
  modificationDate: string;
}

export interface PdaCreditBalanceResponse {
  clientCreditBalance: PdaCreditBalanceEntry[];
  isLicense: boolean;
  unavailable?: boolean;
}

export async function getAccountBases(force = false): Promise<PdaSubBaseDetail[]> {
  const data = await pdaFetch("/api/identity/v1/Accounts/AccountSubBaseDetail", { force });
  return Array.isArray(data) ? data : (data?.data ?? []);
}

export async function getCreditBalance(baseId: string, force = false): Promise<PdaCreditBalanceResponse> {
  return pdaFetch(`/api/credit/v1/CreditBalance/base/${baseId}`, { force });
}

export async function getCreditMovements(force = false) {
  return pdaFetch("/api/credit/v1/Credit/CreditConsumeMovement", { force });
}

export interface PdaBaseByUser {
  baseId?: string;
  BaseId?: string;
  baseName?: string;
  BaseName?: string;
  accountId?: string;
  AccountId?: string;
  creditsExpirationDate?: string | null;
  CreditsExpirationDate?: string | null;
  expirationDate?: string | null;
  ExpirationDate?: string | null;
}

export async function getBasesByUser(force = false): Promise<PdaBaseByUser[]> {
  const data = await pdaFetch("/api/client/v1/Client/GetBasesByUser/me", { force }).catch(() => null);
  if (!data) return [];
  return Array.isArray(data) ? data : (data?.data ?? []);
}
