import { supabase } from "@/integrations/supabase/client";

async function pdaFetch(endpoint: string) {
  const { data, error } = await supabase.functions.invoke("pda-proxy", {
    body: { endpoint },
  });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function getAccountBases() {
  return pdaFetch("/api/identity/v1/Accounts/AccountSubBaseDetail");
}

export async function getCreditBalance(baseId: string) {
  return pdaFetch(`/api/credit/v1/CreditBalance/base/${baseId}`);
}

export async function getCreditMovements() {
  return pdaFetch("/api/credit/v1/Credit/CreditConsumeMovement");
}
