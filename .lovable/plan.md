# Problema

Na plataforma PDA, **créditos disponíveis** e **data de vencimento** aparecem no nível da **conta** (Account / CreditsPlan = 100, Vencimento 05/05/2027), não no nível de cada base. Hoje a integração tenta puxar:

- `/api/credit/v1/CreditBalance/base/{baseId}` → retorna **403 Forbidden** (esse endpoint não é o correto para o tipo de conta CreditsPlan)
- `/api/credit/v1/Credit/CreditConsumeMovement` → retorna **500**

Por causa disso, o `pda-proxy` aplica fallback `{availableCredits: 0, totalCredits: 0}` e a Sinaleira mostra tudo zerado. **Nunca chamamos o endpoint que de fato contém os dados que o PDA mostra na tela de Client Edition.**

# O que faltou na integração

1. Não foi chamado o endpoint da **conta** (Account/CreditsPlan), que é onde a PDA armazena o saldo total e a data de vencimento do plano.
2. Não foi chamado o endpoint correto de **saldo agregado** da conta — `CreditBalance/base/{id}` só funciona para contas tipo "Base/SubBase", não para "CreditsPlan".
3. O endpoint de movimentações precisa de query params (`accountId`, `startDate`, `endDate`) — chamamos sem nenhum.

# Plano

## 1. Descobrir endpoints corretos via pda-proxy
Adicionar logging temporário e testar (via `curl_edge_functions`) os endpoints candidatos da PDA:
- `/api/identity/v1/Accounts/AccountDetail` (dados da conta + expirationDate)
- `/api/credit/v1/CreditBalance/account` ou `/CreditBalance` (saldo agregado)
- `/api/credit/v1/CreditPlan` ou similar (plano de créditos + vencimento)

## 2. Atualizar `src/lib/pdaApi.ts`
Adicionar funções:
- `getAccountDetail()` → dados gerais da conta (nome, link, expirationDate, accountType)
- `getAccountCreditBalance()` → créditos disponíveis/total/usados da conta inteira
- `getCreditMovements({ startDate, endDate })` → passar período (últimos 30 dias por padrão)

## 3. Refatorar `useSinaleiraPda.ts`
- Buscar **uma vez** os dados da conta (saldo + vencimento) em vez de iterar por base.
- Calcular `daysUntilExpiry` e `usedPercent` a partir do CreditsPlan da conta.
- Manter a lista de subBases apenas para exibição (nomes/links), sem chamar `CreditBalance/base/{id}`.
- Expor um novo objeto `account: { name, creditsPlan, available, total, used, expirationDate, daysUntilExpiry, status }` além de `bases[]`.

## 4. Atualizar a UI do CS Dashboard / Sinaleira
- Mostrar o card principal com **créditos da conta** e **vencimento do plano** (igual à tela do PDA).
- Manter a tabela de bases como detalhamento, sem números de crédito por base (já que PDA não expõe isso para CreditsPlan).

## 5. Remover fallback silencioso do pda-proxy para 403
- Trocar fallback por erro explícito, para evitar mascarar problemas de endpoint errado no futuro.
- Manter fallback apenas para 404 em `CreditConsumeMovement` quando não há movimentações.

# Detalhes técnicos

- A confirmação dos paths corretos será feita chamando `pda-proxy` com endpoints candidatos e lendo a resposta real da PDA — sem documentação, é tentativa guiada por padrão REST (`/Accounts/AccountDetail`, `/CreditBalance/account/{id}`).
- Caso nenhum endpoint adicional retorne 200, peço ao usuário a documentação da API PDA ou um print da seção de API/Swagger do PDA para mapear os paths exatos.
