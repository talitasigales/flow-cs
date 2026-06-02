## Objetivo

Trocar a fonte de dados da Sinaleira PDA: em vez de chamar a API PDA ao vivo, ler de uma tabela `pda_sinaleira_snapshot` populada a partir da planilha. A coluna "Sinaleira" da planilha (🟢🟡🔴) é a verdade. Exibir o "Status / Alerta" como badge adicional.

## Passos

### 1. Criar tabela `pda_sinaleira_snapshot` no Supabase

Colunas:
- `account_name` (text) — Conta/Base
- `available_credits` (int) — Créditos restantes
- `used_credits_total` (int) — Créditos utilizados total
- `last_month_consumption` (int) — Consumo último mês
- `signal` (text) — 'ok' / 'warning' / 'critical' (derivado do emoji)
- `credits_expiration` (date, nullable)
- `account_expiration` (date, nullable)
- `account_type` (text) — Credits / CreditsPlan
- `alert` (text) — Status / Alerta
- `consulted_at` (date) — Data da consulta
- `snapshot_id` (uuid) — agrupa um lote de importação
- timestamps

RLS: leitura para usuários com acesso CS (`has_cs_access(auth.uid())`); INSERT/DELETE só admin via service_role na edge function.

### 2. Edge function `import-sinaleira-snapshot`

- Recebe `{ csv: string }` em POST (apenas admin).
- Faz parse do CSV, deriva `signal` do emoji (🟢=ok, 🟡=warning, 🔴=critical), converte datas dd/mm/yyyy → ISO, ignora colunas corrompidas (Meses/Meta/Comparativo).
- Cria um novo `snapshot_id`, insere todas as linhas, e apaga snapshots anteriores (mantém só o mais recente).

### 3. Importar a planilha atual

Já que a planilha está aqui, eu importo o CSV de 988 linhas direto após o deploy via chamada da função (uma vez).

### 4. Adaptar a Sinaleira (frontend)

- Novo hook `useSinaleiraSnapshot()` que lê de `pda_sinaleira_snapshot` (ordenado pelo `consulted_at` mais recente).
- Reescrever `SinaleiraPda.tsx` para:
  - Mostrar Conta, Saldo, Consumo último mês, Expiração + dias restantes, Sinaleira (🟢🟡🔴 vindo da planilha), Tipo de conta e badge de Alerta ao lado.
  - Remover seções de "Meta mensal" e "Ritmo" (não recalculadas) e o painel de "Movimentações" (não vem na planilha).
  - Manter filtros: busca, sinaleira, expira de/até, créditos mín/máx, e adicionar filtro "Só com alerta".
  - Cards de resumo (Verde/Amarelo/Vermelho) com a contagem baseada no `signal` da planilha.
  - Botão "Importar nova planilha (CSV)" para admins — upload de arquivo que chama a edge function.
  - Exibir "Última atualização: {consulted_at do snapshot}".

### 5. Limpeza

- Manter `useSinaleiraPda` e o `pda-proxy` (usados em outros lugares? verificar) ou marcar como deprecated. Se exclusivos da Sinaleira, removo o uso mas mantenho o código para não quebrar nada inesperado.

## Considerações técnicas

- O parse do emoji é feito por inclusão de substring (`includes('🟢')` etc.) — robusto a espaços.
- Datas dd/mm/yyyy convertidas com regex; campos vazios viram null.
- A planilha tem 988 linhas — insert em chunks de 500.
- Não mexo na API PDA nem nas tabelas existentes.
