import { useState, useEffect } from "react";
import {
  getAccountBases,
  getBasesByUser,
  getCreditBalance,
  getCreditMovements,
  type PdaSubBaseDetail,
} from "@/lib/pdaApi";

export type SinaleiraStatus = "ok" | "warning" | "critical" | "expired" | "unknown";

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
  monthsRemaining: number;
  monthlyTarget: number;
  lastMonthConsumption: number;
  consumptionRatio: number | null;
  status: SinaleiraStatus;
  unavailable?: boolean;
}

export interface PdaMovement {
  date: string;
  baseId: string;
  baseName: string;
  type: string;
  amount: number;
  reason?: string;
}


/**
 * Sinaleira baseada no ritmo de consumo:
 *   Meta Mensal = Saldo Atual / Meses Restantes de Licença
 *   Ratio = Consumo Último Mês / Meta Mensal
 * - Verde (ok)       : ratio > 1.10  (consumindo acima do necessário)
 * - Amarelo (warn)   : 0.90 <= ratio <= 1.10 (no ritmo exato)
 * - Vermelho (crit)  : ratio < 0.90 (saldo vai sobrar)
 * - Expirado         : licença vencida
 * - Unknown          : sem dados suficientes
 */
function calcStatus(daysUntilExpiry: number, ratio: number | null): SinaleiraStatus {
  if (isFinite(daysUntilExpiry) && daysUntilExpiry <= 0) return "expired";
  if (ratio === null || !isFinite(ratio)) return "unknown";
  if (ratio > 1.1) return "ok";
  if (ratio >= 0.9) return "warning";
  return "critical";
}

function computeMetrics(
  availableCredits: number,
  daysUntilExpiry: number,
  lastMonthConsumption: number,
) {
  const monthsRemaining = isFinite(daysUntilExpiry) ? Math.max(daysUntilExpiry / 30, 0) : 0;
  const monthlyTarget = monthsRemaining > 0 ? availableCredits / monthsRemaining : 0;
  const consumptionRatio =
    monthlyTarget > 0 && lastMonthConsumption >= 0
      ? lastMonthConsumption / monthlyTarget
      : null;
  return { monthsRemaining, monthlyTarget, consumptionRatio };
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
  const [movementsAvailable, setMovementsAvailable] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  async function fetchData(force = false) {
    try {
      setLoading(true);
      setError(null);

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

      const skeleton: PdaBase[] = uniqueBases.map((b) => {
        const expirationDate = expirationMap.get(b.baseId) ?? null;
        const daysUntilExpiry = expirationDate
          ? Math.ceil((new Date(expirationDate).getTime() - Date.now()) / 86400000)
          : Infinity;
        const { monthsRemaining, monthlyTarget, consumptionRatio } = computeMetrics(0, daysUntilExpiry, 0);
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
          monthsRemaining,
          monthlyTarget,
          lastMonthConsumption: 0,
          consumptionRatio,
          status: calcStatus(daysUntilExpiry, consumptionRatio),
          unavailable: true,
        };
      });
      setBases(skeleton);
      setLastUpdated(new Date());
      setLoading(false);

      // Saldos em background
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
          prev.map((p) => {
            if (p.baseId !== b.baseId) return p;
            const { monthsRemaining, monthlyTarget, consumptionRatio } = computeMetrics(
              remaining,
              daysUntilExpiry,
              p.lastMonthConsumption,
            );
            return {
              ...p,
              availableCredits: remaining,
              totalCredits: total,
              usedCredits: spent,
              usedPercent,
              daysUntilExpiry,
              monthsRemaining,
              monthlyTarget,
              consumptionRatio,
              status: calcStatus(daysUntilExpiry, consumptionRatio),
              unavailable,
            };
          }),
        );
      }).then(() => setLastUpdated(new Date()));

      // Movimentações
      getCreditMovements(force)
        .then((movs) => {
          const movsArr = Array.isArray(movs) ? movs : ((movs as any)?.data ?? []);
          const normalized: PdaMovement[] = movsArr.map((m: any) => ({
            date: m.date || m.createdAt,
            baseId: m.baseId,
            baseName: m.baseName,
            type: m.movementType || m.type,
            amount: Number(m.amount ?? m.credits ?? 0),
          }));
          setMovements(normalized);
          const hasData = normalized.length > 0;
          setMovementsAvailable(hasData);

          if (!hasData) {
            // Sem dados de movimentação → sinaleira fica "sem dados" em vez de crítico falso
            setBases((prev) =>
              prev.map((p) => ({
                ...p,
                lastMonthConsumption: 0,
                consumptionRatio: null,
                status: isFinite(p.daysUntilExpiry) && p.daysUntilExpiry <= 0 ? "expired" : "unknown",
              })),
            );
            return;
          }

          // Agrega consumo dos últimos 30 dias por base
          const cutoff = Date.now() - 30 * 86400000;
          const consumptionByBase = new Map<string, number>();
          for (const m of normalized) {
            if (!m.baseId || !m.date) continue;
            const t = new Date(m.date).getTime();
            if (!isFinite(t) || t < cutoff) continue;
            consumptionByBase.set(m.baseId, (consumptionByBase.get(m.baseId) ?? 0) + Math.abs(m.amount));
          }

          setBases((prev) =>
            prev.map((p) => {
              const lastMonthConsumption = consumptionByBase.get(p.baseId) ?? 0;
              const { monthsRemaining, monthlyTarget, consumptionRatio } = computeMetrics(
                p.availableCredits,
                p.daysUntilExpiry,
                lastMonthConsumption,
              );
              return {
                ...p,
                lastMonthConsumption,
                monthsRemaining,
                monthlyTarget,
                consumptionRatio,
                status: calcStatus(p.daysUntilExpiry, consumptionRatio),
              };
            }),
          );
        })
        .catch((e: any) => {
          console.warn("[Sinaleira PDA] Movimentações indisponíveis:", e.message);
          setMovementsAvailable(false);
        });
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, []);
  return { loading, error, bases, movements, movementsAvailable, lastUpdated, refresh: fetchData };
}
