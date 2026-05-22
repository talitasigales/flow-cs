## Nova lógica da Sinaleira

Substituir a regra atual (baseada em `daysUntilExpiry` + `usedPercent`) pela comparação **Consumo do último mês ÷ Meta mensal**, onde:

```
Meta Mensal = Saldo Atual ÷ Meses Restantes de Licença
Comparativo = Consumo Último Mês ÷ Meta Mensal
```

Regras:
- 🟢 **Verde (ok)** — Comparativo > 1.10 (consumindo acima do necessário, vai precisar recarregar)
- 🟡 **Amarelo (warning)** — Comparativo entre 0.90 e 1.10 (no ritmo exato)
- 🔴 **Vermelho (critical)** — Comparativo < 0.90 (abaixo do ritmo, saldo vai sobrar)
- ⚫ **Expirado** — `daysUntilExpiry <= 0`
- **Sem dados** — Se não houver consumo do último mês ou meses restantes ≤ 0 ou saldo = 0 → tratar como `warning` com label "Sem dados" (ou neutro), pra não falsear a contagem.

## Onde mudar

### 1. `src/hooks/useSinaleiraPda.ts`

- Adicionar ao tipo `PdaBase`:
  - `lastMonthConsumption: number`
  - `monthlyTarget: number`
  - `consumptionRatio: number | null`
  - `monthsRemaining: number`
- Substituir `calcStatus(daysUntilExpiry, usedPercent)` por `calcStatus(daysUntilExpiry, ratio)` aplicando as faixas acima.
- Calcular `lastMonthConsumption` a partir de `movements`: somar `amount` (consumo) por `baseId` cujo `date` esteja nos últimos 30 dias (apenas tipos de consumo — ignorar recargas/créditos positivos; usar `Math.abs` se vierem negativos).
- Calcular `monthsRemaining = max(daysUntilExpiry / 30, 0)`.
- Calcular `monthlyTarget = monthsRemaining > 0 ? availableCredits / monthsRemaining : 0`.
- Como movimentações chegam após os saldos, recalcular status das bases num `useEffect`/passo extra quando `movements` chegam — atualizar `setBases` mesclando `lastMonthConsumption`, `monthlyTarget`, `consumptionRatio`, `status`.

### 2. `src/components/customer-success/SinaleiraPda.tsx`

- Na tabela "Bases", trocar a coluna **Uso** (atualmente `usedPercent`) por:
  - **Meta mensal** — `monthlyTarget.toLocaleString()` créditos/mês
  - **Consumo último mês** — `lastMonthConsumption.toLocaleString()`
  - **Ritmo** — badge mostrando o `consumptionRatio` em % (ex: "120%") com a cor da sinaleira
- Ajustar tooltip/legenda dos cards de métrica para refletir a nova semântica (Verde = no caminho / Amarelo = atenção / Vermelho = saldo sobrando).
- Manter filtro de "Uso (%)" mas apontando agora para `consumptionRatio` (renomear label para "Ritmo (%)").

### 3. Manter

- `expirationDate`, `availableCredits`, `totalCredits` e demais campos seguem como hoje.
- Filtros existentes continuam funcionando; apenas o filtro de uso passa a operar sobre o ratio.

## Observação sobre dados

A API `CreditConsumeMovement` retorna movimentações com `amount`. Vou assumir que valores de consumo são identificáveis pelo `type/movementType` (ex: contém "consume"/"consumo") ou pelo sinal. Se todos os registros do endpoint já forem consumos (como o próprio nome sugere), basta somar `amount` dos últimos 30 dias por base.
