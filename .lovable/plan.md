

## Plan: Update Matriz 9Box to Match Reference Layout

### What Changes

The reference image uses a completely different axis arrangement and quadrant naming than the current implementation:

**Current**: X = Compatibilidade (potential), Y = Desempenho (performance)
**Reference**: X = Desempenho (entrega técnica), Y = Potencial (liderança)

### New Quadrant Grid

```text
                    Insuficiente    Mediano          Excepcional
                    (X: 0-33)       (X: 34-66)       (X: 67-100)
                    
Muito bom (Y:67+)   Enigma          Forte Desemp.    Alto Potencial
Aceitável (Y:34-66) Questionável    Mantenedor       Forte Desemp.
Baixo     (Y:0-33)  Insuficiente    Eficaz           Comprometido
```

Colors from reference:
- **Enigma**: green (top-left)
- **Forte Desempenho** (top-center): green
- **Alto Potencial** (top-right): green
- **Questionável**: orange
- **Mantenedor**: orange
- **Forte Desempenho** (mid-right): green
- **Insuficiente**: red
- **Eficaz**: red
- **Comprometido**: blue

### Changes in `src/pages/Matriz9Box.tsx`

1. **`QUADRANTS` constant**: Rename all 9 quadrants to match reference (Enigma, Forte Desempenho, Alto Potencial, Questionável, Mantenedor, Forte Desempenho, Insuficiente, Eficaz, Comprometido) with matching colors and descriptions from the image.

2. **Axis labels**: 
   - `Y_LABELS` → `['MUITO BOM', 'ACEITÁVEL', 'BAIXO']` (Potencial)
   - `X_LABELS` → `['INSUFICIENTE', 'MEDIANO', 'EXCEPCIONAL']` (Desempenho)
   - Add axis titles: Y = "Potencial (liderança)", X = "Desempenho (entrega técnica)"

3. **`getQuadrant` function**: Swap mapping — X-axis now maps to `performance` (desempenho), Y-axis to `potential` (potencial/liderança). Row = `2 - getTier(potential)`, Col = `getTier(performance)`.

4. **`LEGEND` constant**: Update all entries with new names, descriptions matching the reference image text.

5. **Form labels**: Update the add/edit employee dialog to label fields as "Desempenho (entrega técnica)" and "Potencial (liderança)" for clarity.

6. **Metrics cards & filters**: Update filter labels to use "Desempenho" and "Potencial" terminology consistently.

### No Database Changes
The `performance` and `potential` columns remain — only the UI mapping and labels change.

