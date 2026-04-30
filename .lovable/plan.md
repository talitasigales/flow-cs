## Plano: 2 e-mails de acesso por matrícula (corporativo + pessoal)

### Objetivo
Permitir que cada matrícula tenha **até 2 e-mails** (corporativo e pessoal). Quando o aluno fizer cadastro com **qualquer um dos dois**, ele é automaticamente vinculado à matrícula pendente do programa.

---

### 1. Banco de dados (migration)

**Tabela `pending_enrollments`** — adicionar coluna:
- `secondary_email text NULL`

Constraints/índices:
- Manter UNIQUE atual `(email, program_id)`.
- Adicionar índice em `secondary_email` para lookup rápido.
- Adicionar índice composto `(secondary_email, program_id)`.
- Validação: se `secondary_email` informado, deve ser diferente de `email` (trigger leve ou check via lower()).

**Sem alterações** em `program_enrollments` (continua vinculada a `user_id` único após ativação).

---

### 2. Edge function `register-user` (ativação automática)

Hoje busca pending por `email`. Vai passar a buscar:
```
WHERE program_id IS NOT NULL AND (
  lower(email) = :userEmail OR lower(secondary_email) = :userEmail
)
```
Mesma lógica de criar `program_enrollments` e deletar a `pending_enrollments` correspondente.

---

### 3. Edge function `import-enrollments` (matrícula individual + lote)

**Mudanças no payload aceito:**
- Continua aceitando `emails: string[]` (compat).
- Passa a aceitar também `entries: Array<{ name?: string; email: string; secondary_email?: string }>`.
- Normaliza ambos os e-mails (lowercase, trim).

**Lógica por entrada:**
1. Procurar `profiles` por `email` OU `secondary_email` (qualquer um).
2. Se achar perfil → inserir em `program_enrollments` (comportamento atual).
3. Se não achar → inserir em `pending_enrollments` com `email` (principal) + `secondary_email`.
4. Tratar duplicidade (`23505`) considerando que UMA das chaves pode já existir como pending.

**Resposta** continua com contadores `enrolled / pending / alreadyEnrolled / notFound`.

---

### 4. UI Admin — `AdminPrograms.tsx`

**Aba "Matrículas" — formulário individual:**
- Adicionar 2º campo "E-mail secundário (opcional)".
- Label do 1º campo: "E-mail principal" (corporativo OU pessoal — qualquer um).
- Tooltip explicando o caso de uso.

**Aba "Pendentes":**
- Coluna mostra os 2 e-mails empilhados, cada um com badge `Principal` / `Secundário` (cores neutras).
- Filtro de busca passa a procurar nos 2 campos.

**Aba "Matrículas" (lista de já matriculados):** sem mudança visual (já está vinculado a um `user_id` único).

**Modal "Importar via CSV":**
- Atualizar instruções para indicar 3 colunas: `nome, email_corporativo, email_pessoal` (com cabeçalho obrigatório).
- Botão "Modelo CSV" passa a baixar template com as 3 colunas e 2 linhas de exemplo.
- Parser:
  - Detecta cabeçalho (case-insensitive, aceita variações: `email`, `email corporativo`, `e-mail pessoal` etc.).
  - Para cada linha, monta `entry { name, email, secondary_email }`.
  - Se a linha tiver só 1 e-mail, `secondary_email` fica vazio.
- Valida e-mails com Zod antes de enviar; linhas inválidas viram erro com nº da linha.

### 5. Atualização em `src/utils/exportUtils.ts`
- Atualizar template CSV de matrículas para as 3 colunas: `nome,email_corporativo,email_pessoal`.

---

### 6. Detalhes técnicos
- Comparações de e-mail sempre em `lower(trim(...))`, tanto na edge function quanto na busca em `profiles`.
- `register-user` mantém deletar TODOS os pending matchados (por `email` ou `secondary_email`).
- Logs (`log_user_action`) mantidos como hoje.
- `exportUtils.ts` atualizado com novo template CSV.
- Sem necessidade de novos secrets.

---

### Fora do escopo
- Permitir que o próprio aluno gerencie e-mail secundário no perfil (somente admin define na matrícula).
- Mais de 2 e-mails por matrícula.
- Migrar matrículas já efetivadas para suportar e-mail alternativo (a tabela `program_enrollments` continua atrelada a `user_id`; o e-mail secundário só serve para a fase pré-ativação).