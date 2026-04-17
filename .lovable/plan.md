
## Plano: CS Timeline & Touchpoints (CRM interno)

### Objetivo
Criar um módulo CRM interno (estilo HubSpot) para o time de Customer Success gerenciar empresas-cliente, contatos e timeline de interações (touchpoints), com health score, alertas, filtros e controle de acesso por papéis.

### Escopo da entrega (v1)
Para manter a primeira entrega objetiva e funcional, vou implementar tudo do briefing exceto a camada de "Inteligência" (sugestões automáticas/padrões de churn por IA) — que fica como passo 2 após validação dos dados.

---

### 1. Banco de dados (Supabase)

**Novo enum de papel CS:**
```sql
create type cs_role as enum ('cs_admin', 'cs_editor', 'cs_viewer');
```

**Tabelas:**

- `cs_user_access` — quem do time tem acesso ao módulo CS  
  `id, user_id (uniq), cs_role, created_at`

- `cs_companies` — contas/empresas-cliente  
  `id, name, segment, status (onboarding|ativo|risco|churn|expansao), start_date, owner_user_id, notes, created_at, updated_at`

- `cs_contacts` — stakeholders por empresa  
  `id, company_id (FK), name, role_title, email, phone, influence (decisor|influenciador|usuario), is_active, created_at`

- `cs_touchpoints` — núcleo do sistema (timeline)  
  `id, company_id (FK), owner_user_id, type (reuniao_estrategica|onboarding|apresentacao|construcao_cargo|visita|follow_up|suporte|expansao|outro), occurred_at, status (realizado|agendado|cancelado), description, tags (text[]), attachments (jsonb), created_at, updated_at`

- `cs_touchpoint_contacts` — N:N entre touchpoint e contatos envolvidos  
  `touchpoint_id, contact_id` (PK composta)

**RLS (princípio: somente quem está em `cs_user_access` enxerga; carteira opcional):**
- `cs_admin`: acesso total a tudo (CRUD).
- `cs_editor`: vê empresas onde é `owner_user_id` OU vê todas se admin global; pode criar/editar touchpoints e contatos das empresas que vê.
- `cs_viewer`: somente SELECT nas empresas/contatos/touchpoints que o filtro de carteira permitir.
- Função `has_cs_role(_user_id, _role)` SECURITY DEFINER para evitar recursão.
- Função `cs_can_view_company(_user_id, _company_id)` que retorna true se admin CS, ou se é owner, ou se viewer com acesso global (configurável).

**Auditoria:** anexar trigger `audit_trigger_func()` (já existente) em `cs_companies`, `cs_contacts`, `cs_touchpoints` — entram automaticamente em `audit_logs` e na tela de Logs (com mapeamento amigável: "Empresa CS", "Contato CS", "Touchpoint CS").

**Storage:** reutilizar bucket `program-materials` em pasta `cs-attachments/{company_id}/...` para anexos.

---

### 2. Health Score (calculado client-side em v1)

Regras simples e transparentes (0–100):
- Base: 70.
- Recência último touchpoint: ≤7d +20, ≤30d +10, ≤60d 0, ≤90d -15, >90d -30.
- Volume últimos 90d: ≥6 +10, 3–5 +5, 1–2 0, 0 -10.
- Status do cliente: `risco` -25, `churn` -40, `expansao` +10.
- Presença de touchpoint tipo `suporte` nos últimos 30d: -10.

Faixas: ≥75 saudável (verde), 50–74 atenção (amarelo), <50 crítico (vermelho).

**Alertas** (derivados, sem tabela própria):
- Sem contato há >45d.
- Sem onboarding registrado e empresa criada há >14d.
- Queda: nº touchpoints últimos 30d < 50% dos 30d anteriores.

---

### 3. Frontend — Rotas e telas

Rotas novas (todas dentro de `AppLayout`, gated por `cs_user_access`):

```
/cs                        → Dashboard CS (lista de empresas + KPIs)
/cs/empresas/:companyId    → Detalhe da empresa (tabs: Visão geral | Contatos | Timeline)
/cs/touchpoints/novo       → Modal/rota para criar touchpoint rápido
/admin/cs-access           → Admin global gerencia quem tem acesso e papel CS
```

**Componentes principais:**
- `pages/cs/CSDashboard.tsx` — KPIs (nº clientes por status, nº em risco, sem contato >X dias), tabela de empresas com filtros (status, owner, health, busca por nome de empresa/contato).
- `pages/cs/CompanyDetail.tsx` — header com nome/status/owner/health badge; tabs.
- `components/cs/CompanyFormDialog.tsx` — criar/editar empresa.
- `components/cs/ContactsTab.tsx` + `ContactFormDialog.tsx` — CRUD de contatos.
- `components/cs/TouchpointTimeline.tsx` — feed cronológico (agrupado por mês), com ícone por tipo, badge de status, tags, contatos envolvidos, anexos.
- `components/cs/TouchpointFormDialog.tsx` — criar/editar touchpoint, multiselect de contatos, upload de anexos.
- `components/cs/TimelineFilters.tsx` — filtro por tipo, período, owner.
- `components/cs/HealthBadge.tsx` + `lib/cs/healthScore.ts` — cálculo + badge colorida.
- `components/cs/AlertsBanner.tsx` — alertas automáticos no topo do dashboard.
- `pages/admin/AdminCSAccess.tsx` — admin escolhe usuários e papéis CS.
- `hooks/useCSAccess.ts` — retorna `{ hasAccess, csRole, canEdit, canManage }`.

**Sidebar:** novo grupo "Customer Success" (ícone `Headset` ou `LineChart`) visível apenas se `useCSAccess().hasAccess` — com sub-itens "Dashboard CS" e (se `cs_admin` global) "Acesso CS". Adicionar item admin "Acesso CS" em `adminMenuItems`.

---

### 4. Integração com plataforma existente

- **Logs de auditoria:** estender `AdminLogs.tsx` mapping para `cs_companies`/`cs_contacts`/`cs_touchpoints` aparecerem como recurso filtrável "Empresas CS / Contatos CS / Touchpoints CS".
- **Modelos CSV:** adicionar templates em `exportUtils.ts` para importação em massa de empresas e contatos (botão "Modelo CSV" no dashboard CS) — segue o padrão já adotado.
- **Construção de cargos:** o tipo de touchpoint `construcao_cargo` permitirá referenciar a tabela `job_constructions` no campo `description`/metadata (link opcional na v2).

---

### 5. UX/UI
- Visual coerente com a identidade da plataforma (laranja HSL 20 90% 52%, fundo navy, glassmorphism nos cards).
- Timeline tipo feed vertical com linha do tempo lateral, ícone colorido por tipo de touchpoint, e destaque vermelho para touchpoints de `suporte` ou empresas em `risco`/`churn`.
- Cards de empresa com health badge e "última interação há Xd".
- Tabela responsiva (mesmo padrão de `Members.tsx`/`AdminUsers.tsx`).

---

### 6. Detalhes técnicos

- Tipos: usar `as any` no client Supabase para as novas tabelas até `types.ts` ser regenerado (padrão já adotado no projeto — ver memória `supabase-type-workaround`).
- Query keys React Query: `['cs','companies', filtros ordenados]`, `['cs','company', id]`, `['cs','touchpoints', companyId]` — seguindo memória `query-key-stabilization`.
- Logs de uso: chamar `log_user_action('CS_TOUCHPOINT_CREATE'|'CS_COMPANY_CREATE'|...)` nas mutações principais.
- Sem Edge Functions na v1 — tudo via RLS + client direto.

---

### 7. Entregáveis

1. Migration SQL: enum, 5 tabelas, RLS policies, funções `has_cs_role`/`cs_can_view_company`, triggers de auditoria.
2. Hook `useCSAccess` + gating no sidebar.
3. Telas: `/cs`, `/cs/empresas/:id`, `/admin/cs-access`.
4. Componentes de timeline, formulários, health score e alertas.
5. Atualização de `AdminLogs.tsx` para mostrar recursos CS.
6. Templates CSV de empresas e contatos em `exportUtils.ts`.

### Fora do escopo (v2)
- Sugestões automáticas de próximos passos via IA.
- Detecção de padrões de churn via ML.
- Recomendação de cadência por IA.
- Importação em massa via UI (templates ficam prontos para uso manual).
