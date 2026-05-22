import { useState, useEffect } from "react";
import { getAccountBases, getCreditBalance, getCreditMovements } from "@/lib/pdaApi";

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

      const [accounts, movs] = await Promise.all([
        getAccountBases(),
        getCreditMovements().catch((e) => {
          console.warn("[Sinaleira PDA] Movimentações indisponíveis:", e.message);
          return [];
        }),
      ]);

      const accountsArr = Array.isArray(accounts) ? accounts : (accounts?.data ?? []);
      // PDA retorna lista plana: cada item é uma subBase. Agrupamos por baseId.
      const basesMap = new Map<string, any>();
      for (const item of accountsArr) {
        const baseId = item.baseId || item.id;
        if (!baseId) continue;
        if (!basesMap.has(baseId)) {
          basesMap.set(baseId, {
            baseId,
            baseName: (item.baseName || item.name || "").trim(),
            accountName: item.subBaseName || item.accountName || item.link || "",
            expirationDate: item.expirationDate,
          });
        }
      }
      const rawBases = Array.from(basesMap.values());

      const balances = await Promise.all(
        rawBases.map((b: any) => getCreditBalance(b.baseId).catch(() => ({})))
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
