

## Plan: Programas com Turmas, Matrícula em Massa e Calendário

### 1. Database Changes

**Inserir os 5 novos programas** na tabela `programs`:
- NR1 Aplicada à Liderança (`nr1-lideranca`)
- Certificação Analista PDA (`certificacao-pda`)
- Master Líder (`master-lider`)
- Entrevista por Competências (`entrevista-competencias`)
- Inteligência Comportamental para Vendas (`inteligencia-vendas`)

**Nova tabela `program_classes`** (turmas):
- `id`, `program_id` (FK programs), `name` (ex: "Turma 10-12 Mar/2026"), `start_date`, `end_date`, `created_at`
- RLS: admins manage, authenticated can view

**Alterar `program_enrollments`**: adicionar coluna `class_id` (uuid, nullable, FK program_classes) para vincular aluno a uma turma específica.

### 2. Admin: Gerenciar Turmas e Matrículas (`src/pages/AdminPrograms.tsx`)

Reescrever com 4 abas por programa:
- **Turmas**: CRUD de turmas (nome + datas) por programa selecionado
- **Matrículas**: listar alunos, filtrar por turma, adicionar individual (buscar por e-mail) + em massa (textarea de e-mails), sempre vinculado a programa + turma
- **Importar Turma**: manter funcionalidade existente, mas agora selecionar turma antes de importar
- **Respostas**: manter como está (para Líder 360)

Atualizar edge function `import-enrollments` para aceitar `class_id` opcional.

### 3. Páginas de Programa Genéricas

Criar `src/pages/ProgramGeneric.tsx` — página genérica para programas que não são Líder 360. Exibe:
- Nome e descrição do programa
- Calendário de turmas do programa
- Informações básicas

Atualizar `App.tsx`: rota `/programas/:slug` renderiza `ProgramLider360` se slug=lider-360, senão `ProgramGeneric`.

### 4. Calendário Público de Turmas (`src/pages/ProgramCalendar.tsx`)

Nova página acessível a todos os autenticados, listando:
- Todas as turmas futuras de todos os programas, agrupadas por mês
- Cards com: nome do programa, nome da turma, datas, link de inscrição (se houver)

Adicionar no sidebar como item "Calendário de Programas" (ícone CalendarDays) no menu principal, visível para todos.

### 5. Sidebar (`src/components/AppSidebar.tsx`)

- Manter "Programas e Workshops" collapsible com sub-itens dos programas matriculados
- Adicionar "Calendário de Programas" como item top-level visível a todos (antes de "Meu Perfil")

### 6. Rotas (`src/App.tsx`)

Novas rotas:
- `/programas/calendario` → ProgramCalendar
- `/programas/:slug` → dinâmico (Líder 360 ou genérico)

### Arquivos Modificados/Criados
- **Migration SQL**: criar `program_classes`, alterar `program_enrollments`, inserir 5 programas
- `src/pages/AdminPrograms.tsx` — reescrever com gestão de turmas
- `src/pages/ProgramGeneric.tsx` — novo
- `src/pages/ProgramCalendar.tsx` — novo
- `src/components/AppSidebar.tsx` — adicionar calendário
- `src/App.tsx` — novas rotas
- `supabase/functions/import-enrollments/index.ts` — aceitar class_id

