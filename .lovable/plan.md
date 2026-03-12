

## Plano: Integração Dom Pagamentos Webhook para Bússola

### Resumo

Criar uma Edge Function que recebe webhooks do Dom Pagamentos quando um pagamento é aprovado (`CHARGE-APPROVED`). Com base no link de pagamento utilizado, o sistema cria automaticamente o usuário (se necessário), matricula no programa Bússola, e cria um `bussola_assignment` sem psicólogo vinculado (para atribuição manual posterior).

### Arquitetura

```text
Dom Pagamentos (CHARGE-APPROVED)
        │
        ▼  POST webhook
┌─────────────────────────┐
│  Edge Function          │
│  dom-webhook/index.ts   │
│                         │
│  1. Valida evento       │
│  2. Mapeia link → plano │
│  3. Cria/busca usuário  │
│  4. Matricula programa  │
│  5. Cria assignment     │
└─────────────────────────┘
```

### Detalhes Técnicos

**1. Nova tabela `bussola_payments`**
- Registra pagamentos recebidos para auditoria e evitar duplicatas
- Colunas: `id`, `dom_transaction_id`, `customer_email`, `customer_name`, `encounter_count`, `status`, `raw_payload`, `created_at`
- RLS: apenas admins podem visualizar

**2. Edge Function `dom-webhook`**
- Mapeamento dos link IDs para planos:
  - `5ec1b55b-93ad-483b-978c-cadfe610d0d2` → 1 encontro (avulso)
  - `1ea7977b-44bf-44dc-861e-aa0db9a65603` → 5 encontros (jornada completa)
- No evento `CHARGE-APPROVED`:
  1. Extrai email/nome do cliente do payload
  2. Verifica se já existe pagamento com mesmo `dom_transaction_id` (evita duplicatas)
  3. Cria usuário via `auth.admin.createUser` se não existir (com senha temporária)
  4. Busca o programa Bússola pelo slug
  5. Insere matrícula em `program_enrollments`
  6. Cria `bussola_assignment` com `psychologist_id = NULL` (será necessário tornar o campo nullable)
- `verify_jwt = false` (webhook externo, sem JWT)

**3. Alteração na tabela `bussola_assignments`**
- Tornar `psychologist_id` nullable (permitir assignments sem psicólogo)
- Adicionar política RLS para que a edge function (service_role) possa inserir

**4. Ajustes no painel do psicólogo**
- Mostrar jovens não atribuídos para que psicólogos possam "adotar" jovens que compraram pelo link

**5. Configuração necessária (pelo usuário)**
- No painel do Dom Pagamentos, configurar a URL do webhook:
  `https://hapzzpwywnahovmddlej.supabase.co/functions/v1/dom-webhook`
- Opcionalmente configurar um secret para validação de assinatura

### Observação importante

A documentação do Dom Pagamentos não detalha o payload exato do webhook. O edge function será implementado com logging extensivo para capturar o primeiro payload real e ajustar o parsing se necessário. Os campos esperados são: evento, ID da transação, email e nome do cliente, e ID do link de pagamento.

