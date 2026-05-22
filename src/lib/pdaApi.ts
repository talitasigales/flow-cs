import { supabase } from "@/integrations/supabase/client";

async function pdaFetch(endpoint: string) {
  const { data, error } = await supabase.functions.invoke("pda-proxy", {
    body: { endpoint },
  });
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

export interface PdaAccount {
  id: string | null;
  baseId?: string;
  email?: string;
  active?: boolean;
  creationDate?: string;
  modificationDate?: string;
  multiregion?: boolean;
  unavailable?: boolean;
}

export async function getAccountBases(): Promise<PdaSubBaseDetail[]> {
  const data = await pdaFetch("/api/identity/v1/Accounts/AccountSubBaseDetail");
  return Array.isArray(data) ? data : (data?.data ?? []);
}

export async function getCreditBalance(baseId: string): Promise<PdaCreditBalanceResponse> {
  return pdaFetch(`/api/credit/v1/CreditBalance/base/${baseId}`);
}

export async function getAccount(accountId: string): Promise<PdaAccount> {
  return pdaFetch(`/api/identity/v1/Accounts/${accountId}`);
}

export async function getCreditMovements() {
  return pdaFetch("/api/credit/v1/Credit/CreditConsumeMovement");
}
