## Objetivo
Permitir que o admin visualize, em qualquer programa, **todos os alunos pendentes ou já matriculados em cada turma** — de forma rápida e cruzada.

Hoje:
- Aba **Matrículas** já filtra por turma (só matriculados).
- Aba **Pendentes** mostra a turma na coluna mas **não tem filtro por turma** e nem busca.
- Não existe uma visão única "por turma" mostrando os 2 grupos lado a lado.

## Mudanças (somente UI no `src/pages/AdminPrograms.tsx`)

### 1. Aba "Pendentes" — adicionar filtro por turma e busca
Espelhar o padrão da aba Matrículas:
- Acima da tabela: Select "Filtrar por turma" (`Todas as turmas` + lista de `classes`) + campo de busca por e-mail/nome.
- Filtro aplicado client-side sobre `pendingEnrollments` (já estão todos carregados do programa).
- Mostrar contador no header: "X pendentes" (atualiza com filtros).

### 2. Aba "Matrículas" — adicionar busca + contador
- Manter o select de turma existente.
- Adicionar campo de busca por nome/e-mail (client-side) para casar a UX com Pendentes.
- Mostrar contador "X matriculados".

### 3. Nova aba "Por Turma" (visão consolidada)
Inserir uma nova `TabsTrigger` chamada **"Visão por Turma"** no array de tabs do programa selecionado. Conteúdo:

- Select no topo: **Turma** (obrigatório; default = primeira turma com data futura, fallback = primeira da lista).
- Cards de resumo:
  - Card "Matriculados" — contagem
  - Card "Pendentes" — contagem
  - Card "Total" — soma
- Duas seções colapsáveis (abertas por padrão):
  - **Matriculados na turma** — tabela: Nome, E-mail, Data de matrícula, Último acesso. Botão remover (mesmo handler atual).
  - **Pendentes da turma** — tabela: E-mails (principal + secundário com badges), Data de cadastro. Botão remover (mesmo handler atual).
- Botão "Exportar CSV" no header de cada seção (gera CSV com colunas visíveis usando o helper já existente em `src/utils/exportUtils.ts` — ou um `Blob` simples se mais rápido).

Sem novos endpoints: ambos os dados já vêm das queries `enrollments` e `pendingEnrollments`, basta filtrar por `class_id` selecionado.

### 4. Ajuste no select "Filtrar por turma" das duas abas
Quando o admin tem o programa selecionado mas está na aba "Por Turma", o estado de turma usado lá é independente (`viewByClassId`) — não interferir no `selectedClassFilter` das outras abas.

## Detalhes técnicos
- Sem migrations, sem mudanças de edge function.
- Reaproveitar queries já existentes (`enrollments`, `pendingEnrollments`, `classes`).
- Filtros e busca em memória; nada de queries adicionais.
- Manter botões de ação (remover matrícula / remover pendente) idênticos aos das abas originais para consistência.
- Layout coerente com o resto da página (mesmos componentes `Card`, `Table`, `Badge`, `Select`).

## Fora do escopo
- Editar dados em massa por turma.
- Mover pendentes entre turmas (já é possível inferir, mas hoje não há UI; pode ser feito depois se pedido).
- Mudanças em rotas ou outras páginas.
