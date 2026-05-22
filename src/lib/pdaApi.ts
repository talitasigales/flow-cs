import { supabase } from "@/integrations/supabase/client";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function pdaFetch(endpoint: string, retries = 3, delayMs = 500): Promise<any> {
  const { data, error } = await supabase.functions.invoke("pda-proxy", {
    body: { endpoint },
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
    return pdaFetch(endpoint, retries - 1, delayMs * 2);
  }

  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data;
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

export async function getAccountBases(): Promise<PdaSubBaseDetail[]> {
  const data = await pdaFetch("/api/identity/v1/Accounts/AccountSubBaseDetail");
  return Array.isArray(data) ? data : (data?.data ?? []);
}

export async function getCreditBalance(baseId: string): Promise<PdaCreditBalanceResponse> {
  return pdaFetch(`/api/credit/v1/CreditBalance/base/${baseId}`);
}

export async function getCreditMovements() {
  return pdaFetch("/api/credit/v1/Credit/CreditConsumeMovement");
}
