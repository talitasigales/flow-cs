

## Plan: Swap 9Box Matrix Axes (Y=Desempenho, X=Compatibilidade)

### Problem
Currently the matrix has **Desempenho (Performance) on the X-axis** (columns) and **Fit com a Função on the Y-axis** (rows). The user wants them **swapped**: Desempenho on Y, Compatibilidade/Fit on X.

### Changes in `src/pages/Matriz9Box.tsx`

1. **Swap grid iteration (desktop view, ~line 714-794)**:
   - Outer loop (rows): change from iterating `roleFit` values `[3,2,1]` to iterating `performance` values `[3,2,1]`
   - Inner loop (columns): change from iterating `performance` values `[1,2,3]` to iterating `roleFit` values `[1,2,3]`
   - Update `getEntriesForCell` call params accordingly

2. **Swap axis labels**:
   - Y-axis label (~line 699): change from "Fit com a Função" to "Desempenho"
   - X-axis label (~line 800): change from "Desempenho" to "Compatibilidade com o Cargo"

3. **CATEGORIES definitions stay the same** -- their `performance` and `roleFit` values are already semantically correct; only the visual axis placement changes.

4. **No database changes needed** -- the `performance` and `potential` (fit) columns remain as-is.

