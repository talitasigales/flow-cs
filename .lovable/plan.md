## Objetivo
Fazer com que a visão de admin de Programas exiba claramente os pendentes de matrícula já implementados, sem esconder as abas novas quando houver muitas opções na barra.

## O que vou ajustar
1. Reorganizar a navegação de abas em `src/pages/AdminPrograms.tsx` para que `Pendentes` e `Visão por Turma` fiquem sempre acessíveis.
2. Ajustar o layout do `TabsList` para evitar quebra ruim de linha / clipping em larguras como a do seu print.
3. Validar que a contagem e o conteúdo dos pendentes continuam vindo das queries já existentes (`pendingEnrollments`) sem alterar regra de negócio.
4. Verificar visualmente no preview que, no programa `NR1 Aplicada à Liderança`, as abas aparecem e podem ser abertas.

## Resultado esperado
- A aba `Pendentes` fica visível.
- A aba `Visão por Turma` fica visível.
- O admin consegue acessar os 35 pendentes do NR1 já existentes no banco.
- Sem mudanças de banco ou Edge Functions.

## Detalhes técnicos
- Foco apenas em frontend.
- Manter a lógica atual de dados e filtros.
- A correção deve atuar só na composição responsiva/ergonômica da barra de tabs e, se necessário, na ordem/prioridade visual das abas para não esconder as mais operacionais.