import { useState, useEffect } from "react";
import {
  getAccountBases,
  getCreditBalance,
  getCreditMovements,
  getAccount,
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

      const [subBases, movs] = await Promise.all([
        getAccountBases(),
        getCreditMovements().catch((e: any) => {
          console.warn("[Sinaleira PDA] Movimentações indisponíveis:", e.message);
          return [];
        }),
      ]);

      // Agrupa subBases por baseId (PDA retorna lista plana de subBases)
      const basesMap = new Map<string, PdaSubBaseDetail>();
      for (const item of subBases) {
        if (!item.baseId) continue;
        if (!basesMap.has(item.baseId)) basesMap.set(item.baseId, item);
      }
      const uniqueBases = Array.from(basesMap.values());

      // Para cada base: busca saldo + account (em paralelo, tolerando 403/404 por base)
      const enriched = await Promise.all(
        uniqueBases.map(async (b): Promise<PdaBase> => {
          const [balRes, accRes] = await Promise.all([
            getCreditBalance(b.baseId).catch(() => null),
            getAccount(b.accountId).catch(() => null),
          ]);

          // Soma todas as subBases retornadas em clientCreditBalance
          const entries = balRes?.clientCreditBalance ?? [];
          const remaining = entries.reduce((s, e) => s + (e.remainingCredits ?? 0), 0);
          const spent = entries.reduce((s, e) => s + (e.spentCredits ?? 0), 0);
          const total = remaining + spent;
          const usedPercent = total > 0 ? Math.round((spent / total) * 100) : 0;

          // PDA não expõe expirationDate em Accounts/{id}; usamos null até descobrirmos o endpoint
          const expirationDate: string | null = (accRes as any)?.expirationDate ?? null;
          const daysUntilExpiry = expirationDate
            ? Math.ceil((new Date(expirationDate).getTime() - Date.now()) / 86400000)
            : Infinity;

          const unavailable = balRes === null;

          return {
            baseId: b.baseId,
            baseName: (b.baseName || "").trim(),
            accountName: b.subBaseName || b.link,
            accountId: b.accountId,
            link: b.link,
            expirationDate,
            availableCredits: remaining,
            totalCredits: total,
            usedCredits: spent,
            usedPercent,
            daysUntilExpiry,
            status: calcStatus(daysUntilExpiry, usedPercent),
            unavailable,
          };
        })
      );

      setBases(enriched);

      const movsArr = Array.isArray(movs) ? movs : ((movs as any)?.data ?? []);
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
