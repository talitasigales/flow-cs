import { useState, useEffect } from "react";
import { getToken, getAccountBases, getCreditBalance, getCreditMovements } from "@/lib/pdaApi";

export type SinaleiraStatus = "ok" | "warning" | "critical" | "expired";

export interface PdaBase {
  baseId: string;
  baseName: string;
  accountName: string;
  expirationDate: string;
  availableCredits: number;
  totalCredits: number;
  usedCredits: number;
  daysUntilExpiry: number;
  usedPercent: number;
  status: SinaleiraStatus;
}

export interface PdaMovement {
  date: string;
  baseId: string;
  baseName: string;
  type: string;
  amount: number;
}

function calcStatus(daysUntilExpiry: number, usedPercent: number): SinaleiraStatus {
  if (daysUntilExpiry <= 0) return "expired";
  if (daysUntilExpiry <= 15 || usedPercent >= 90) return "critical";
  if (daysUntilExpiry <= 30 || usedPercent >= 75) return "warning";
  return "ok";
}

export function useSinaleiraPda() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bases, setBases] = useState<PdaBase[]>([]);
  const [movements, setMovements] = useState<PdaMovement[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  async function fetchData() {
    try {
      setLoading(true);
      setError(null);

      const token = await getToken();
      const [accounts, movs] = await Promise.all([
        getAccountBases(token),
        getCreditMovements(token),
      ]);

      const accountsArr = Array.isArray(accounts) ? accounts : (accounts?.data ?? []);
      const rawBases = accountsArr.flatMap((acc: any) =>
        (acc.bases || acc.subBases || []).map((b: any) => ({
          baseId: b.baseId || b.id,
          baseName: b.baseName || b.name,
          accountName: acc.accountName || acc.name,
          expirationDate: b.expirationDate || acc.expirationDate,
        }))
      );

      const balances = await Promise.all(
        rawBases.map((b: any) => getCreditBalance(token, b.baseId).catch(() => ({})))
      );

      const enriched: PdaBase[] = rawBases.map((b: any, i: number) => {
        const bal = balances[i] || {};
        const available = bal.availableCredits ?? bal.balance ?? 0;
        const total = bal.totalCredits ?? 0;
        const used = bal.usedCredits ?? Math.max(total - available, 0);
        const usedPercent = total > 0 ? Math.round((used / total) * 100) : 0;
        const daysUntilExpiry = b.expirationDate
          ? Math.ceil((new Date(b.expirationDate).getTime() - Date.now()) / 86400000)
          : Infinity;
        return {
          ...b,
          availableCredits: available,
          totalCredits: total,
          usedCredits: used,
          usedPercent,
          daysUntilExpiry,
          status: calcStatus(daysUntilExpiry, usedPercent),
        };
      });

      setBases(enriched);
      const movsArr = Array.isArray(movs) ? movs : (movs?.data ?? []);
      setMovements(
        movsArr.map((m: any) => ({
          date: m.date || m.createdAt,
          baseId: m.baseId,
          baseName: m.baseName,
          type: m.movementType || m.type,
          amount: m.amount || m.credits,
        }))
      );
      setLastUpdated(new Date());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, []);
  return { loading, error, bases, movements, lastUpdated, refresh: fetchData };
}
