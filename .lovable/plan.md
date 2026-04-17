

## Plano: Integração RD Station CRM → CS Timeline & Touchpoints

### Objetivo
Importar empresas (organizations) e contatos (people) do RD Station CRM para o módulo CS, com sincronização contínua e geração automática de touchpoints a partir de eventos do funil.

### Escopo v1 (MVP — leitura RD → Plataforma)
Tudo do briefing **exceto**: sync bidirecional (item 5), playbooks automáticos e sugestões IA (item 10). Esses ficam para v2.

---

### 1. Autenticação RD CRM

RD Station CRM oferece **API Token pessoal** (mais simples) e **OAuth2** (multi-conta). Para v1 vamos com **API Token** — mais rápido de implementar e suficiente para uso interno do time CS.

- O admin gera o token em RD CRM → Configurações → Integrações → Tokens.
- Armazenamos via **Supabase Secret** `RD_CRM_TOKEN` (criptografado, nunca exposto ao client).
- Tela de admin permite testar conexão, ver status e revogar.
- Nota: já que estamos em projeto Supabase externo (não Lovable Cloud), vou pedir para o usuário adicionar o secret após confirmar o plano.

> Caminho OAuth2 fica registrado como upgrade futuro (v2) caso múltiplos usuários precisem conectar contas distintas.

---

### 2. Banco de dados (Supabase)

Migration nova com:

- `cs_integrations` — config global por integração  
  `id, provider ('rd_crm'), is_active, last_full_sync_at, last_delta_sync_at, sync_frequency_minutes (default 30), config jsonb, created_at, updated_at`

- `cs_sync_logs` — auditoria de cada execução  
  `id, provider, run_type ('full'|'delta'|'webhook'|'manual'), status ('success'|'partial'|'error'), companies_imported, contacts_imported, touchpoints_imported, errors jsonb, started_at, finished_at, triggered_by`

- Colunas novas em `cs_companies`:  
  `external_provider text, external_id text, external_data jsonb, last_synced_at timestamptz`  
  + índice único parcial `(external_provider, external_id) where external_provider is not null`

- Colunas novas em `cs_contacts`:  
  `external_provider text, external_id text, external_data jsonb, last_synced_at timestamptz`  
  + índice único parcial idem.

- Colunas novas em `cs_touchpoints`:  
  `external_provider text, external_id text, external_data jsonb`  
  + índice único parcial idem (idempotência de webhook/sync).

- Novo valor permitido para o campo `type` de `cs_touchpoints`: `'rd_crm_event'` (o campo é text livre, então não exige enum).

RLS: tabelas novas só admin global. Triggers de auditoria (já padrão do projeto) em `cs_integrations`.

---

### 3. Edge Functions (Supabase)

Três funções em `supabase/functions/`:

**`rd-crm-test-connection`** (POST, admin only)
- Faz chamada `GET /api/v1/accounts` com o token.
- Retorna `{ ok, account_name, error? }`.

**`rd-crm-sync`** (POST, admin only) — coração da integração
- Body: `{ run_type: 'full' | 'delta', resources?: ['companies','contacts','deals'] }`.
- Para `full`: pagina todas as organizations e contacts.
- Para `delta`: usa `last_delta_sync_at` da `cs_integrations` e filtra por `updated_at` na API do RD.
- Para cada organization:
  - Tenta match por `external_id` → se existe, faz UPDATE.
  - Senão tenta match por **domínio do email do contato principal** com `cs_companies.name` ou via metadata → se match, faz merge (preenche `external_id`).
  - Senão INSERT nova `cs_companies` com `status='ativo'`.
- Para cada contact: idem, vinculando a `company_id` correspondente.
- Para cada deal (negócio): cria `cs_touchpoints` com `type='rd_crm_event'`, `title='Negócio: <nome>'`, `description='Movido para etapa X'`, `occurred_at = updated_at`, `external_id = deal_id` (idempotente via upsert).
  - Eventos especiais: `closed_won` e `closed_lost` viram touchpoints destacados com tag.
- Grava `cs_sync_logs` com contadores.
- Atualiza `last_full_sync_at` ou `last_delta_sync_at`.

**`rd-crm-webhook`** (POST público, sem JWT)
- Recebe payloads de webhook do RD CRM (`deal.stage_updated`, `deal.won`, `deal.lost`, `contact.created`, etc.).
- Valida assinatura via header customizado (token compartilhado em secret `RD_CRM_WEBHOOK_SECRET`).
- Processa o evento individual (mesma lógica de upsert da sync).
- Grava log com `run_type='webhook'`.

**Polling automático:** cron Supabase chamando `rd-crm-sync` com `run_type='delta'` a cada 30min (ajustável via `cs_integrations.sync_frequency_minutes`). A configuração do cron é feita via SQL (`pg_cron` + `pg_net`) na mesma migration.

---

### 4. Mapeamento de dados

```
RD organization               →  cs_companies
  id                          →    external_id (provider='rd_crm')
  name                        →    name
  segment / custom_field      →    segment
  user.name (responsável)     →    notes (linha "Responsável RD: X")
  created_at                  →    start_date (se vazio)

RD contact                    →  cs_contacts
  id                          →    external_id
  name                        →    name
  emails[0]                   →    email
  phones[0]                   →    phone
  job_title                   →    role_title
  organization_id             →    company_id (lookup por external_id)

RD deal event                 →  cs_touchpoints
  id                          →    external_id
  organization_id             →    company_id
  deal_stage_name             →    description
  user.name                   →    owner_user_id (mapeado por email se existir; senão null + nota)
  updated_at                  →    occurred_at
  status (won/lost/open)      →    tags ['rd_won'|'rd_lost'|'rd_stage']
```

**Regras de merge:**
1. `external_id` igual → mesma entidade (update).
2. Senão, para empresas: domínio de email do contato principal vs. nome existente (case-insensitive, fuzzy simples).
3. Senão, para contatos: email igual → merge.
4. Senão → cria novo.
5. RD CRM é **source of truth** para campos comerciais (name, segment, status do funil); campos manuais da plataforma (`notes` interno do CS, `owner_user_id` interno) **não** são sobrescritos.

---

### 5. Frontend

**Nova página:** `/admin/integrations/rd-crm` (`src/pages/admin/AdminRDCRM.tsx`)
- Card "Status da conexão" — testa conexão, mostra `account_name`.
- Card "Última sincronização" — `last_full_sync_at`, `last_delta_sync_at`, contadores agregados.
- Botões: **Sincronização completa**, **Sincronização incremental agora**, **Desconectar**.
- Configurações: frequência de sync (15/30/60/120 min), recursos a sincronizar (checkboxes empresas/contatos/negócios).
- Tabela de logs (últimos 50): tipo, status, contadores, duração, erros expansíveis.
- URL de webhook copiável para colar no RD CRM.

**Sidebar:** adicionar item "Integrações" no grupo Administração (ícone `Plug`), só para admin global.

**Reaproveitar componentes existentes:** `Card`, `Table`, `Badge`, `Dialog` para confirmação.

**Indicador na lista de empresas (`/cs`)**: badge pequeno "RD" ao lado do nome quando `external_provider='rd_crm'`.

**Filtro na timeline da empresa**: já que `type='rd_crm_event'` é novo, adicionar mapping de ícone (`Zap`) e cor (azul) no `TouchpointTimeline.tsx`.

**`AdminLogs.tsx`**: mapear `cs_sync_logs` e `cs_integrations` para nomes amigáveis.

---

### 6. Rotas
```
/admin/integrations/rd-crm   → AdminRDCRM (admin only)
```
Em `App.tsx`.

---

### 7. Segurança
- Apenas `has_role(uid, 'admin')` consegue chamar `rd-crm-sync` e `rd-crm-test-connection` (validação no início da função).
- Webhook público mas valida assinatura HMAC ou token compartilhado.
- Token RD nunca vai para o client — só lido em edge functions via `Deno.env.get('RD_CRM_TOKEN')`.
- LGPD: emails/telefones já estão protegidos pelas RLS de `cs_contacts` (apenas usuários com acesso CS veem).
- Logs de auditoria via trigger padrão do projeto.

---

### 8. Entregáveis
1. Migration: 2 tabelas novas, 4 colunas em cada uma de 3 tabelas existentes, índices únicos parciais, cron job, RLS.
2. 3 Edge Functions (`rd-crm-test-connection`, `rd-crm-sync`, `rd-crm-webhook`) + entradas em `config.toml` com `verify_jwt = false`.
3. 2 secrets a serem adicionados: `RD_CRM_TOKEN`, `RD_CRM_WEBHOOK_SECRET`.
4. Página `AdminRDCRM.tsx` + rota + item de sidebar.
5. Atualização de `TouchpointTimeline.tsx` (tipo `rd_crm_event`) e `CSDashboard.tsx` (badge RD).
6. Atualização de `AdminLogs.tsx` (mapping dos novos recursos).

### Fora do escopo (v2)
- OAuth2 multi-conta.
- Sync bidirecional CS → RD.
- Playbook automático em Closed Won.
- Sugestões de próximos passos via IA.
- Mapeamento avançado de campos customizados via UI.

### O que vou pedir após aprovação
- Que você adicione os secrets `RD_CRM_TOKEN` (token gerado em RD CRM → Integrações) e `RD_CRM_WEBHOOK_SECRET` (string aleatória que você define).

