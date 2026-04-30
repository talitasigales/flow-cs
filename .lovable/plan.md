## Plano: Botões de questionários pré-jornada no Master Líder

### Objetivo
Exibir, no topo da página do programa **Master Líder** (slug `master-lider`), um card destacado com 2 botões para acesso aos questionários externos (Resiliência e Dilemas de Gestão) **antes** do conteúdo da jornada. Marcar localmente quando o usuário clica em cada um.

### Implementação

**1. Novo componente** `src/components/academy/PreJourneyQuestionnaires.tsx`
- Card com glassmorphism (padrão visual do projeto), título "Antes de iniciar sua jornada".
- Dois botões lado a lado (responsivo: empilha no mobile):
  - "Questionário de Resiliência" → abre URL externa em nova aba (`target="_blank"`, `rel="noopener noreferrer"`).
  - "Questionário Dilemas de Gestão" → idem.
- URLs como **placeholders** (constantes no topo do arquivo, fáceis de editar):
  ```ts
  const RESILIENCIA_URL = '#'; // TODO: substituir
  const DILEMAS_URL = '#';     // TODO: substituir
  ```
- Cada botão exibe um check verde (`CheckCircle2`) ao lado do label quando já foi acessado.
- Ao clicar, salva no `localStorage` a chave `master-lider:questionnaire:<id>:<userId>` com timestamp.
- Estado lido no mount via `useState` + `useEffect`.

**2. Integração condicional** em `src/pages/ProgramGeneric.tsx`
- Renderizar `<PreJourneyQuestionnaires />` somente quando `slug === 'master-lider'`, posicionado entre o `ProgramWelcomePopup` e o `ProgramDevelopmentContent`.
- Mantém a página genérica intacta para os outros programas.

### Detalhes técnicos
- Tracking apenas em `localStorage` (sem migration, sem alteração de banco).
- Chave por usuário evita vazamento entre contas no mesmo browser.
- Sem alterações no sidebar, rotas ou backend.

### Fora do escopo
- Persistência no banco / sincronização entre dispositivos.
- Validação se o usuário realmente respondeu (apenas registra o clique).
- Bloqueio da jornada caso não tenha respondido.