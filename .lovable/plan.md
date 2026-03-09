

## Plan: Corrigir Matriz 9Box — Cores, Eixos e Lógica

### Mudanças de Eixos

- **Eixo X** (colunas): **Compatibilidade com o Cargo PDA** → mapeia para `potential` no banco
  - Labels: BAIXA | MÉDIA | ALTA
- **Eixo Y** (linhas): **Desempenho** → mapeia para `performance` no banco
  - Labels: ALTO | MÉDIO | BAIXO

### Lógica `getQuadrant`
```
row = 2 - getTier(performance)   // Alto=topo, Baixo=base
col = getTier(potential)          // Baixa=esquerda, Alta=direita
```

### Grid Final com Cores

```text
                     BAIXA (0-33)           MÉDIA (34-66)          ALTA (67-100)
                     Compatib. PDA          Compatib. PDA          Compatib. PDA

ALTO (67-100)        Enigma [AMARELO]       Forte Desemp [VERDE]   Alto Potencial [AZUL]
MÉDIO (34-66)        Questionável [LARANJA] Mantenedor [AMARELO]   Forte Desemp [VERDE]
BAIXO (0-33)         Insuficiente [VERMELHO] Eficaz [LARANJA]      Comprometido [AMARELO]
```

### Cores Exatas
- **Amarelo** `#d4a017` — Enigma, Mantenedor, Comprometido
- **Laranja** `#e67a20` — Questionável, Eficaz
- **Vermelho** `#d32f2f` — Insuficiente
- **Verde** `#2e7d32` — Forte Desempenho (×2)
- **Azul** `#1565c0` — Alto Potencial

### Alterações em `src/pages/Matriz9Box.tsx`

1. **`QUADRANTS`**: Atualizar todas as 9 definições com cores e descrições corretas
2. **`getQuadrant()`**: `row = 2 - getTier(performance)`, `col = getTier(potential)`
3. **`Y_LABELS`**: `['ALTO', 'MÉDIO', 'BAIXO']`
4. **`X_LABELS`**: `['BAIXA', 'MÉDIA', 'ALTA']`
5. **Título do eixo Y**: "DESEMPENHO"
6. **Título do eixo X**: "COMPATIBILIDADE COM O CARGO PDA"
7. **`LEGEND`**: Atualizar cores e descrições
8. **Métricas**: "Média Desempenho" e "Média Compatibilidade"
9. **Filtros**: Renomear labels para "Desempenho" (Y) e "Compatibilidade" (X)
10. **Form labels**: "Desempenho (0-100)" e "Compatibilidade com o Cargo PDA (0-100)"
11. **Tooltip nos cards**: "D: X  C: Y" em vez de "D: X  P: Y"

### Alteração em `src/utils/pdfExportUtils.ts`
Atualizar labels no export PDF para refletir a nova nomenclatura.

### Sem mudanças no banco
Colunas `performance` e `potential` permanecem — apenas o mapeamento e labels mudam.

