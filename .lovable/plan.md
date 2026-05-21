## Objetivo

Permitir que um admin de CS importe, a partir de um único arquivo CSV, mais de 7.000 linhas contendo empresas e seus contatos, com deduplicação automática e atribuição de responsável (owner) por e-mail.

## Estrutura esperada do CSV

Um arquivo, uma linha por contato (empresa pode repetir). Colunas mínimas:

- `company_name` (obrigatório)
- `company_segment`, `company_status`, `company_start_date`, `company_notes` (opcionais)
- `owner_email` (obrigatório para atribuir owner — match com `profiles.email`)
- `contact_name` (obrigatório)
- `contact_email`, `contact_role`, `contact_phone`, `contact_influence` (opcionais)

Se uma empresa aparecer em várias linhas com dados divergentes (ex.: segmento diferente), prevalece a **primeira ocorrência** no arquivo (a segunda é ignorada para os campos da empresa, mas o contato é processado normalmente).

## Regras de deduplicação

- **Empresa**: chave = `lower(trim(name))`. Se já existe no banco → reaproveita; senão → cria.
- **Contato**: chave = `company_id + lower(trim(email))`. Se já existe → atualiza campos vazios; senão → cria. Contatos sem e-mail sempre são criados (não há como deduplicar com segurança).
- **Owner**: match por `lower(trim(owner_email))` em `profiles.email`. Sem match → empresa fica sem owner e entra no relatório de avisos.

## Fluxo de UI

Nova página `src/pages/admin/AdminCSImport.tsx` (acessível só para `cs_admin`/admin, link dentro do CS Dashboard).

1. **Upload CSV** (drag-drop). Parse no cliente com PapaParse (já leve, ~45kb).
2. **Pré-visualização**: tabela com primeiras 50 linhas + validação de colunas obrigatórias + contadores (X empresas únicas, Y contatos, Z owners não encontrados).
3. **Botão "Importar"** → envia o CSV em lotes de 500 linhas para a edge function `cs-import-companies`.
4. **Barra de progresso** + log de erros por linha.
5. **Download** de um CSV de relatório final (linhas com erro, owners não encontrados, duplicatas).

## Backend (edge function)

`supabase/functions/cs-import-companies/index.ts`:

- Recebe `{ rows: [...], dryRun: boolean }`.
- Valida JWT manualmente e confere `cs_admin`/admin via `has_role` / `is_cs_admin`.
- Usa `SERVICE_ROLE_KEY` para acelerar inserts (bypass RLS controlado pelo check de role acima).
- Para cada lote:
  1. Coleta nomes únicos → `SELECT id, lower(name) FROM cs_companies WHERE lower(name) IN (...)` para mapear existentes.
  2. Coleta `owner_email`s únicos → `SELECT user_id, lower(email) FROM profiles`.
  3. `INSERT ... ON CONFLICT DO NOTHING` em empresas novas (índice único funcional em `lower(name)` — ver migration).
  4. Coleta contatos com `(company_id, lower(email))` existentes → upsert.
- Retorna `{ companiesCreated, companiesReused, contactsCreated, contactsSkipped, errors: [{row, message}] }`.

## Migration necessária

```sql
-- Índice único case-insensitive para deduplicação de empresas
CREATE UNIQUE INDEX IF NOT EXISTS cs_companies_name_lower_unique
  ON public.cs_companies (lower(name));

-- Índice para acelerar dedup de contatos por empresa+email
CREATE INDEX IF NOT EXISTS cs_contacts_company_email_lower
  ON public.cs_contacts (company_id, lower(email));
```

> Atenção: se já houver empresas com nomes duplicados hoje, o índice falha. Antes de aplicar, rodo um SELECT para checar e, se houver, mostro a lista para você consolidar manualmente.

## Entregáveis

```text
src/pages/admin/AdminCSImport.tsx        (nova UI)
src/components/cs/CSImportPreview.tsx    (tabela de preview)
supabase/functions/cs-import-companies/  (nova edge function)
migration: índices únicos
link no CS Dashboard / sidebar admin
```

## Fora do escopo desta etapa

- Importação de touchpoints (próxima fase, conforme combinado).
- Sincronização recorrente com CRM externo (já existe `cs_integrations`/`cs_sync_logs` para isso, fora do escopo agora).

## Próximo passo sugerido

Antes de eu implementar: **me envie a planilha** (ou só as 20 primeiras linhas + cabeçalho) para eu confirmar o mapeamento exato das colunas e ajustar o parser. Se as colunas vierem em português ou com nomes diferentes, mapeio direto no importador — sem você precisar reformatar 7.000 linhas.