import { useState, useEffect } from "react";
import {
  getAccountBases,
  getBasesByUser,
  getCreditBalance,
  getCreditMovements,
  type PdaSubBaseDetail,
} from "@/lib/pdaApi";

export type SinaleiraStatus = "ok" | "warning" | "critical" | "expired";

export interface PdaBase {
  baseId: string;
  baseName: string;
  accountName: string;
  accountId: string;
  link: string;
  expirationDate: string | null;
  availableCredits: number;
  totalCredits: number;
  usedCredits: number;
  daysUntilExpiry: number;
  usedPercent: number;
  status: SinaleiraStatus;
  unavailable?: boolean;
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

async function mapWithConcurrency<T, R>(items: T[], concurrency: number, mapper: (item: T) => Promise<R>) {
  const results: R[] = [];
  for (let index = 0; index < items.length; index += concurrency) {
    const chunk = items.slice(index, index + concurrency);
    const chunkResults = await Promise.all(chunk.map(mapper));
    results.push(...chunkResults);
  }
  return results;
}

export function useSinaleiraPda() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bases, setBases] = useState<PdaBase[]>([]);
  const [movements, setMovements] = useState<PdaMovement[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  async function fetchData(force = false) {
    try {
      setLoading(true);
      setError(null);

      // 1) Lista de bases + expirações: rápido (cache de 6h). Renderiza assim que chegar.
      const [subBases, basesByUser] = await Promise.all([
        getAccountBases(force),
        getBasesByUser(force).catch((e: any) => {
          console.warn("[Sinaleira PDA] GetBasesByUser indisponível:", e.message);
          return [];
        }),
      ]);

      const expirationMap = new Map<string, string | null>();
      for (const item of basesByUser) {
        const id = item.baseId ?? item.BaseId;
        if (!id) continue;
        const exp =
          item.creditsExpirationDate ??
          item.CreditsExpirationDate ??
          item.expirationDate ??
          item.ExpirationDate ??
          null;
        expirationMap.set(id, exp);
      }

      const basesMap = new Map<string, PdaSubBaseDetail>();
      for (const item of subBases) {
        if (!item.baseId) continue;
        if (!basesMap.has(item.baseId)) basesMap.set(item.baseId, item);
      }
      const uniqueBases = Array.from(basesMap.values());

      // Render inicial sem saldos: usuário já vê as bases.
      const skeleton: PdaBase[] = uniqueBases.map((b) => {
        const expirationDate = expirationMap.get(b.baseId) ?? null;
        const daysUntilExpiry = expirationDate
          ? Math.ceil((new Date(expirationDate).getTime() - Date.now()) / 86400000)
          : Infinity;
        return {
          baseId: b.baseId,
          baseName: (b.baseName || "").trim(),
          accountName: b.subBaseName || b.link,
          accountId: b.accountId,
          link: b.link,
          expirationDate,
          availableCredits: 0,
          totalCredits: 0,
          usedCredits: 0,
          usedPercent: 0,
          daysUntilExpiry,
          status: calcStatus(daysUntilExpiry, 0),
          unavailable: true,
        };
      });
      setBases(skeleton);
      setLastUpdated(new Date());
      setLoading(false);

      // 2) Saldos em background: atualiza cada base individualmente conforme chega.
      mapWithConcurrency(uniqueBases, 5, async (b) => {
        const balRes = await getCreditBalance(b.baseId, force).catch(() => null);
        const entries = balRes?.clientCreditBalance ?? [];
        const remaining = entries.reduce((s, e) => s + (e.remainingCredits ?? 0), 0);
        const spent = entries.reduce((s, e) => s + (e.spentCredits ?? 0), 0);
        const total = remaining + spent;
        const usedPercent = total > 0 ? Math.round((spent / total) * 100) : 0;
        const expirationDate: string | null = expirationMap.get(b.baseId) ?? null;
        const daysUntilExpiry = expirationDate
          ? Math.ceil((new Date(expirationDate).getTime() - Date.now()) / 86400000)
          : Infinity;
        const unavailable = balRes === null;

        setBases((prev) =>
          prev.map((p) =>
            p.baseId === b.baseId
              ? {
                  ...p,
                  availableCredits: remaining,
                  totalCredits: total,
                  usedCredits: spent,
                  usedPercent,
                  daysUntilExpiry,
                  status: calcStatus(daysUntilExpiry, usedPercent),
                  unavailable,
                }
              : p,
          ),
        );
      }).then(() => {
        setLastUpdated(new Date());
      });

      // 3) Movimentações: também em background.
      getCreditMovements(force)
        .then((movs) => {
          const movsArr = Array.isArray(movs) ? movs : ((movs as any)?.data ?? []);
          setMovements(
            movsArr.map((m: any) => ({
              date: m.date || m.createdAt,
              baseId: m.baseId,
              baseName: m.baseName,
              type: m.movementType || m.type,
              amount: m.amount || m.credits,
            })),
          );
        })
        .catch((e: any) => {
          console.warn("[Sinaleira PDA] Movimentações indisponíveis:", e.message);
        });
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, []);
  return { loading, error, bases, movements, lastUpdated, refresh: fetchData };
}
