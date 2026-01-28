

# Plano: Funcionalidade de Construção de Cargos

## Visao Geral

Criar uma nova funcionalidade chamada **"Construção de Cargos"** que permite aos usuarios responder um questionario de 20 perguntas (Sim/Nao) sobre as exigencias comportamentais de um cargo. O sistema analisa as respostas e gera um **Perfil de Cargo Sugerido** com scores de 0-100 para os 5 eixos REPNA (Risco, Extroversao, Paciencia, Normas, Autocontrole).

---

## Estrutura do Questionario

### 20 Perguntas com Resposta Sim/Nao

| # | Pergunta | Eixos Impactados |
|---|----------|------------------|
| 1 | A funcao exige interacao proativa e colaborativa com outras areas ou departamentos? | E (+) |
| 2 | E fundamental que a pessoa seja persuasiva, influente ou convincente? | E (+), R (+) |
| 3 | O trabalho exige conhecimento tecnico aprofundado e especializado? | N (+) |
| 4 | A execucao exige alto padrao de excelencia, qualidade e atencao aos detalhes? | N (+), P (+) |
| 5 | O sucesso depende da construcao de relacionamentos e comunicacao eficaz? | E (+), A (+) |
| 6 | O cargo exige concentracao profunda e atencao aos detalhes por periodos prolongados? | P (+), N (+) |
| 7 | Envolve exercer lideranca direta ou grande responsabilidade sobre processos/pessoas? | R (+), E (+) |
| 8 | Existem processos claros, regras e procedimentos formais a seguir rigorosamente? | N (+), P (+) |
| 9 | Ha oportunidades de superar desafios e ser reconhecido pelos resultados? | R (+) |
| 10 | O ocupante recebe feedback estruturado periodicamente sobre desempenho? | A (+), N (+) |
| 11 | Demanda comunicacao constante e interacao com diversos grupos? | E (+) |
| 12 | Inclui atendimento receptivo ao cliente com postura servil e gentil? | P (+), A (+) |
| 13 | Exige tomar decisoes importantes que envolvam assumir riscos calculados? | R (+) |
| 14 | Exige foco constante em superar desafios e alcancar metas ambiciosas? | R (+) |
| 15 | Requer ouvir atentamente e transmitir informacoes de forma calma e paciente? | P (+), A (+) |
| 16 | O ambiente oferece e valoriza seguranca, estabilidade e constancia? | P (+) |
| 17 | Necessario foco na execucao precisa e cumprimento de atividades com direcionamento claro? | N (+), P (+) |
| 18 | Envolve seguir rotinas estabelecidas, planejamento cuidadoso e organizacao? | N (+), P (+) |
| 19 | Necessario lidar frequentemente com conflitos, mantendo posicionamento firme? | R (+), E (-P) |
| 20 | Oportunidades frequentes de representar a empresa em reunioes/eventos/apresentacoes? | E (+), R (+) |

### Regra de Validacao
- Usuario deve responder todas as 20 perguntas
- Minimo de 5 respostas "Nao" (para garantir um perfil balanceado)

---

## Logica de Calculo

### Mapeamento Pergunta-Eixo

```text
Eixo R (Risco): Perguntas 2, 7, 9, 13, 14, 19, 20
Eixo E (Extroversao): Perguntas 1, 2, 5, 7, 11, 19, 20
Eixo P (Paciencia): Perguntas 4, 6, 8, 12, 15, 16, 17, 18
Eixo N (Normas): Perguntas 3, 4, 6, 8, 10, 17, 18
Eixo A (Autocontrole): Perguntas 5, 10, 12, 15
```

### Formula de Calculo
Para cada eixo:

```text
Score do Eixo = (Respostas "Sim" para perguntas do eixo / Total de perguntas do eixo) x 100
```

### Exemplo do PDF
Com as respostas do exemplo (12 "Nao", 8 "Sim"):
- Eixo R: 20
- Eixo E: 20
- Eixo P: 100
- Eixo N: 60
- Eixo A: 50

---

## Resultado/Output

### Tela de Resultado
1. **Logo Grou** no topo
2. **Titulo**: "Perfil de Cargo Sugerido"
3. **Tabela de Scores** (0-100):
   - Eixo R: [valor]
   - Eixo E: [valor]
   - Eixo P: [valor]
   - Eixo N: [valor]
   - Eixo A: [valor]
4. **Disclaimer**: "Este e um perfil de cargo sugerido baseado na metodologia PDA. Para uma analise completa ou adaptacao, consulte um Analista PDA certificado."
5. **Botao "Nova Analise"** para reiniciar o questionario

---

## Arquitetura Tecnica

### Novos Arquivos

```text
src/pages/
  JobConstruction.tsx          # Pagina principal com questionario
  JobConstructionResult.tsx    # Pagina de resultado

src/components/job-construction/
  QuestionCard.tsx             # Componente para cada pergunta
  ProgressIndicator.tsx        # Indicador de progresso (respondidas/total)
  ResultDisplay.tsx            # Exibicao dos scores REPNA

src/data/
  jobConstructionQuestions.ts  # Dados das 20 perguntas com mapeamento de eixos

src/utils/
  jobProfileCalculator.ts      # Logica de calculo dos scores
```

### Alteracoes em Arquivos Existentes

1. **src/App.tsx**
   - Adicionar rotas `/job-construction` e `/job-construction/result`

2. **src/components/AppSidebar.tsx**
   - Adicionar item de menu "Construcao de Cargos" com icone adequado (Briefcase ou Building2)

### Banco de Dados (Opcional - para salvar historico)
Nova tabela `job_profiles` para salvar cargos criados:

```text
- id (uuid)
- user_id (uuid)
- job_name (text) - Nome do cargo (opcional)
- answers (jsonb) - Respostas do questionario
- r_score (integer)
- e_score (integer)
- p_score (integer)
- n_score (integer)
- a_score (integer)
- created_at (timestamp)
```

---

## Fluxo do Usuario

```text
1. Usuario acessa "Construcao de Cargos" no menu lateral
     |
     v
2. Tela de Introducao com breve explicacao
     |
     v
3. Questionario com 20 perguntas (Sim/Nao)
   - Contador: "Respondidas: X de 20"
   - Validacao: "Respostas 'Nao': Y (min. 5)"
     |
     v
4. Botao "Identificar Perfil do Cargo" (habilitado quando valido)
     |
     v
5. Tela de Resultado com scores REPNA
     |
     v
6. Opcoes: "Nova Analise" ou "Salvar Cargo" (se implementar salvamento)
```

---

## Etapas de Implementacao

### Etapa 1: Estrutura de Dados
- Criar arquivo `jobConstructionQuestions.ts` com as 20 perguntas e mapeamento de eixos
- Criar arquivo `jobProfileCalculator.ts` com a logica de calculo

### Etapa 2: Componentes UI
- Criar `QuestionCard.tsx` para exibir cada pergunta com opcoes Sim/Nao
- Criar `ProgressIndicator.tsx` para mostrar progresso e validacao
- Criar `ResultDisplay.tsx` para exibir os scores finais

### Etapa 3: Paginas
- Criar `JobConstruction.tsx` com o questionario completo
- Criar `JobConstructionResult.tsx` com a exibicao do resultado

### Etapa 4: Integracao
- Adicionar rotas no `App.tsx`
- Adicionar item no menu lateral `AppSidebar.tsx`

### Etapa 5 (Opcional): Persistencia
- Criar migracao para tabela `job_profiles`
- Implementar salvamento de cargos
- Adicionar listagem de cargos salvos

---

## Design Visual

Seguir o mesmo padrao visual do projeto:
- Cards com bordas arredondadas e sombras suaves
- Botoes Sim/Nao estilizados como toggle buttons
- Cores primarias do tema (gradientes teal/cyan)
- Tabela de resultados com bordas e padding consistentes
- Logo Grou no header da pagina de resultado

