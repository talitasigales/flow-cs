

# Programa Bússola -- Plano de Implementação

## Contexto

O Bússola é um programa de orientação vocacional para jovens do ensino medio, conduzido por psicologos. Tem 5 encontros de 60min cada, com pre/pos-trabalhos entre encontros. Existem dois perfis de usuario distintos: **Jovem** (acesso restrito apenas ao Bussola) e **Psicologo** (acessa o conteudo do jovem + guia proprio + visao de acompanhamento).

Os jovens nao devem ter acesso ao restante da plataforma (Dashboard, Ferramentas, Comunidade, etc.), pois sao de um ICP completamente diferente.

---

## 1. Modelo de Dados (Migrations)

### 1.1 Nova role `young` no enum `app_role`
Adicionar `'young'` ao enum `app_role` para identificar usuarios jovens. Usuarios com essa role terao navegacao restrita.

### 1.2 Nova role `psychologist` no enum `app_role`
Para psicologos que acompanham jovens.

### 1.3 Tabela `bussola_sessions` (sessoes/encontros)
Registra o estado de cada encontro entre psicologo e jovem:
- `id`, `young_user_id`, `psychologist_user_id`, `program_id`, `encounter_number` (1-5)
- `status` (pending, scheduled, completed)
- `scheduled_date`, `completed_at`, `notes` (JSON do psicologo)

### 1.4 Tabela `bussola_workbooks` (cadernos do jovem)
Armazena as respostas dos formularios de cada encontro:
- `id`, `user_id`, `program_id`, `encounter_number`
- `data` (JSONB -- todas as respostas do formulario daquele encontro)
- `is_prework` (boolean -- distingue pre-trabalho de trabalho do encontro)
- `updated_at`

### 1.5 Tabela `bussola_assignments` (vinculo psicologo-jovem)
- `id`, `psychologist_id`, `young_user_id`, `program_id`, `created_at`

RLS: psicologo ve apenas seus jovens, jovem ve apenas seu psicologo. Admin ve tudo.

---

## 2. Restricao de Acesso por Role

### 2.1 `AuthContext` -- redirect por role
Apos login, verificar role do usuario:
- Se `young`: redirecionar para `/bussola` em vez de `/dashboard`
- Se `psychologist`: redirecionar para `/bussola/painel` (painel de acompanhamento)
- Demais roles: fluxo atual (`/dashboard`)

### 2.2 Layout exclusivo para jovens: `BussolaLayout`
Um layout simplificado (sem a sidebar completa da plataforma):
- Header com logo Grou + avatar do jovem
- Sem acesso a sidebar de ferramentas/comunidade/trilhas
- Navegacao limitada: Jornada Bussola + Chat com Nanda (opcional)

### 2.3 Protecao de rotas
As rotas existentes (`/dashboard`, `/pdi`, `/community`, etc.) devem verificar se o usuario tem role `young` e redirecionar para `/bussola` se sim.

---

## 3. Interface do Jovem (`/bussola`)

### 3.1 Pagina principal -- Jornada Bussola
Visual gamificado com timeline vertical dos 5 encontros:
- **Boas-Vindas** (sempre disponivel) -- compromisso + instrucoes
- **Encontro 1**: Autoconhecimento + Matriz de Decisoes
- **Encontro 2**: Construindo Competencias
- **Encontro 3**: Desenhando Caminhos
- **Encontro 4**: Lidando com Pressao
- **Encontro 5**: Plano de Acao + Carta ao Eu do Futuro

Cada encontro tem 3 estados visuais:
- **Trancado** (cinza, cadeado) -- proximo encontro ainda nao agendado/liberado
- **Ativo** (destaque, pulsante) -- pre-trabalho ou pos-trabalho disponivel
- **Concluido** (check verde)

### 3.2 Formularios digitais por encontro
Cada encontro abre uma pagina com formularios interativos que transpoe os documentos DOCX:

**Pre-trabalho E1**: Checklist do TOV
**Encontro 1**: Pontos fortes (text), areas para desenvolver (text), inteligencias multiplas (checklist), areas de interesse (text), carreiras sugeridas (text), Matriz de Decisao (tabela dinamica com criterios, pesos, notas por carreira, calculo automatico), Ranking final, Reflexao (textarea)
**Pre-trabalho E2**: Entrevista com profissional + listar 10 competencias
**Encontro 2**: Gap Analysis (tabela: competencia, nivel atual 0-10 slider, nivel necessario 0-10 slider, gap calculado, prioridade A/M/B), Top 3 gaps, Plano de Desenvolvimento 90 dias (3 blocos: como/onde/ate quando), Compromisso
**Pre-trabalho E3**: Pesquisar 4 rotas + preencher Desenhando Caminhos
**Encontro 3**: 4 Rotas de Formacao (formularios estruturados A/B/C/D), Comparativo (tabela), Rota escolhida, Roadmap ate 25 anos (tabela idade/ano/acoes), Plano B
**Pre-trabalho E4**: Conversar com familia, listar 3 pressoes/medos
**Encontro 4**: Conversa familiar (textarea), 3 pressoes mapeadas (descricao/impacto/controle), 3 maiores medos, Reestruturacao cognitiva (pensamento sabotador/desafio/alternativo), Ferramentas: respiracao, rede de apoio, frase motivacional
**Pre-trabalho E5**: Revisar encontros 1-4, preencher plano de acao
**Encontro 5**: Revisao da jornada, Mapa 2026-2027 (tabela quando/o-que/como-medir), 3 acoes prioritarias 90 dias, Carta ao Eu do Futuro (textarea especial), Compromisso final (checklist)

Todos salvam automaticamente (auto-save com debounce) via `bussola_workbooks`.

### 3.3 Compromisso inicial
Tela de boas-vindas com campo de assinatura digital (nome digitado) e data, marcando o inicio formal da jornada.

---

## 4. Interface do Psicologo (`/bussola/painel`)

### 4.1 Painel de acompanhamento
Lista de jovens atribuidos com:
- Nome, status geral (encontro atual), proximo agendamento
- Indicador de pre-trabalhos entregues/pendentes

### 4.2 Visao do jovem (read-only)
Psicologo pode ver todas as respostas do jovem em cada encontro para conduzir a sessao.

### 4.3 Guia do Psicologo
Conteudo do `Guia_do_Psicólogo.docx` transposto como referencia inline -- roteiros minuto-a-minuto, perguntas provocativas, checklists pos-encontro, tudo acessivel dentro da interface ao lado dos dados do jovem.

### 4.4 Registro de sessao
Apos cada encontro, psicologo marca como concluido e pode adicionar anotacoes clinicas (privadas, nao visiveis ao jovem).

---

## 5. Rotas e Navegacao

```text
/bussola                    -- Jornada do jovem (BussolaLayout)
/bussola/encontro/:number   -- Formulario do encontro N
/bussola/painel             -- Painel do psicologo
/bussola/painel/:youngId    -- Visao do jovem especifico
```

---

## 6. Programa e Dados Iniciais

- Criar programa "Bussola" na tabela `programs` (slug: `bussola`)
- Criar 5 modulos associados (Encontro 1-5)
- Configurar welcome message com conteudo das Boas-Vindas

---

## 7. Resumo de Arquivos

| Acao | Arquivo |
|------|---------|
| Criar | `src/pages/bussola/BussolaJourney.tsx` (jornada principal do jovem) |
| Criar | `src/pages/bussola/BussolaEncounter.tsx` (formulario por encontro) |
| Criar | `src/pages/bussola/BussolaPsychologistPanel.tsx` (painel psicologo) |
| Criar | `src/pages/bussola/BussolaYoungView.tsx` (visao do jovem pelo psicologo) |
| Criar | `src/components/bussola/BussolaLayout.tsx` (layout simplificado) |
| Criar | `src/components/bussola/EncounterForm.tsx` (formularios dinamicos) |
| Criar | `src/components/bussola/JourneyTimeline.tsx` (timeline gamificada) |
| Criar | `src/components/bussola/DecisionMatrix.tsx` (Matriz de Decisao interativa) |
| Criar | `src/components/bussola/GapAnalysis.tsx` (tabela de Gap Analysis) |
| Criar | `src/components/bussola/RoutesComparison.tsx` (comparativo 4 rotas) |
| Criar | `src/components/bussola/RoadmapTable.tsx` (roadmap ate 25 anos) |
| Criar | `src/components/bussola/FutureLetterEditor.tsx` (carta ao eu do futuro) |
| Criar | `src/data/bussolaEncounters.ts` (estrutura dos formularios por encontro) |
| Criar | `src/data/bussolaPsychologistGuide.ts` (conteudo do guia) |
| Criar | `src/hooks/useBussolaWorkbook.ts` (CRUD + auto-save) |
| Editar | `src/App.tsx` (novas rotas /bussola/*) |
| Editar | `src/contexts/AuthContext.tsx` (redirect por role) |
| Editar | `src/pages/Auth.tsx` (redirect jovens para /bussola) |
| Criar | Migration SQL (enum, tabelas, dados iniciais, RLS) |

---

## Escopo da Primeira Iteracao

Dado o tamanho, sugiro implementar em fases:
1. **Fase 1**: DB (migration com tabelas + roles + programa), BussolaLayout, rota `/bussola`, timeline dos 5 encontros, redirect por role, formulario do Encontro 1 completo
2. **Fase 2**: Formularios dos Encontros 2-5
3. **Fase 3**: Painel do psicologo + guia integrado
4. **Fase 4**: Refinamentos (auto-save, calculos automaticos na Matriz de Decisao, exportacao PDF)

Posso comecar pela Fase 1 apos aprovacao.

