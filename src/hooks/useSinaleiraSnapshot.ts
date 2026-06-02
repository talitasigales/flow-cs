import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type SinaleiraSignal = "ok" | "warning" | "critical" | "unknown";

export interface SinaleiraRow {
  id: string;
  account_name: string;
  available_credits: number;
  used_credits_total: number;
  last_month_consumption: number;
  signal: SinaleiraSignal;
  credits_expiration: string | null;
  account_expiration: string | null;
  account_type: string | null;
  alert: string | null;
  consulted_at: string | null;
  daysUntilExpiry: number;
  effectiveExpiration: string | null;
}

export function useSinaleiraSnapshot() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<SinaleiraRow[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await (supabase as any)
        .from("pda_sinaleira_snapshot")
        .select("*")
        .order("account_name", { ascending: true });
      if (error) throw error;
      const mapped: SinaleiraRow[] = (data || []).map((r: any) => {
        const eff = r.credits_expiration || r.account_expiration;
        const days = eff
          ? Math.ceil((new Date(eff).getTime() - Date.now()) / 86400000)
          : Infinity;
        return {
          ...r,
          signal: (r.signal || "unknown") as SinaleiraSignal,
          daysUntilExpiry: days,
          effectiveExpiration: eff,
        };
      });
      setRows(mapped);
      setLastUpdated(mapped[0]?.consulted_at ?? null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const importSnapshot = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke("import-sinaleira-snapshot", { body: {} });
    if (error) throw error;
    if ((data as any)?.error) throw new Error((data as any).error);
    await fetchData();
    return data;
  }, [fetchData]);

  return { loading, error, rows, lastUpdated, refresh: fetchData, importSnapshot };
}
