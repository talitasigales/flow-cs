# Reduzir chamadas à API PDA com cache

## Diagnóstico

Hoje, **cada abertura/refresh da Sinaleira gasta várias chamadas reais à API da PDA**:

- `GET AccountSubBaseDetail` — 1 chamada
- `GET GetBasesByUser/{userId}` — 1 chamada (resposta gigante)
- `GET CreditConsumeMovement` — 1 chamada
- `GET CreditBalance/base/{baseId}` — **N chamadas** (uma por base, hoje ~dezenas)

Total: ~`3 + N` requests por visualização. Não há cache: o edge function `pda-proxy` faz proxy direto, apenas cacheia o token de login. Qualquer usuário que abrir a página `/cs` dispara o ciclo completo. O botão "Atualizar" também.

## Solução: cache em Postgres com TTL

Criar tabela `pda_cache` consultada pelo edge function antes de chamar a PDA. TTL configurável por endpoint (padrão 6h, movimentações 1h). Suporte a `force=true` para refresh manual real (com rate limit).

### 1. Migração — tabela de cache

```sql
create table public.pda_cache (
  endpoint text primary key,
  payload jsonb not null,
  fetched_at timestamptz not null default now()
);
alter table public.pda_cache enable row level security;
-- sem policies: somente service_role (edge function) acessa
create index on public.pda_cache (fetched_at);
```

### 2. Edge function `pda-proxy`

- Aceitar `{ endpoint, force?: boolean }` no body.
- Antes do `fetchPda`, consultar `pda_cache` usando `SUPABASE_SERVICE_ROLE_KEY`.
- TTL por endpoint:
  - `AccountSubBaseDetail` → 6h
  - `GetBasesByUser` → 6h
  - `CreditBalance/base/*` → 1h
  - `CreditConsumeMovement` → 30 min
- Se cache válido e `!force` → retorna `payload` direto (campo extra `_cachedAt`).
- Após resposta OK da PDA, faz `upsert` em `pda_cache`.
- `force=true` ignora cache na leitura mas continua gravando. Limitar `force` a admins (checar JWT role) para evitar abuso.

### 3. Front-end

- `pdaApi.ts`: aceitar parâmetro opcional `force` em `pdaFetch` e propagar.
- `useSinaleiraPda.ts`: expor `refresh(force = false)`. Botão "Atualizar" padrão usa cache; segundo clique ou opção "Forçar atualização" envia `force=true`.
- Mostrar `lastUpdated` vindo do `_cachedAt` quando disponível, para o usuário saber a idade dos dados.

### 4. Observabilidade

- Log `[pda-proxy] cache hit/miss endpoint=... age=...s` para validar economia.

## Impacto esperado

Com TTL de 6h em bases e 1h em saldos, a Sinaleira passa de `3+N` calls por refresh para **0 calls** na maioria das aberturas, e ~`3+N` calls a cada 1–6h por workspace, independentemente de quantos usuários acessem.

## Pontos para confirmar

1. TTL aceitáveis (6h bases / 1h saldos / 30min movimentos)?
2. "Forçar atualização" restrito a admins, ou disponível para todos com debounce?
