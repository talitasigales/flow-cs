

## Plan: Rebuild Matriz 9Box with Correct Logic

### Context
The 9Box matrix is currently blocked with a maintenance screen. The reference image shows the correct layout:
- **X-axis (Desempenho)**: PDA job compatibility — 3 levels: Insuficiente, Mediano, Excepcional
- **Y-axis (Potencial/Liderança)**: Leadership potential — 3 levels: Baixo, Aceitável, Muito bom
- **9 quadrants** with specific names and descriptions (Insuficiente, Eficaz, Comprometido, Questionável, Mantenedor, Forte Desempenho, Enigma, Forte Desempenho, Alto Potencial)

### Database
The existing `matriz_9box` table already has `performance` (0-100) and `potential` (0-100) columns — these map directly to the two axes. No schema changes needed.

### Quadrant Logic (0-100 scale → 3 tiers)
Each axis splits into thirds:
- **Baixo / Insuficiente**: 0–33
- **Aceitável / Mediano**: 34–66  
- **Muito bom / Excepcional**: 67–100

The 9 quadrants (row, col) from bottom-left to top-right:

| Potencial \ Desempenho | Insuficiente (0-33) | Mediano (34-66) | Excepcional (67-100) |
|---|---|---|---|
| **Muito bom (67-100)** | Enigma | Forte Desempenho | Alto Potencial |
| **Aceitável (34-66)** | Questionável | Mantenedor | Forte Desempenho |
| **Baixo (0-33)** | Insuficiente | Eficaz | Comprometido |

### Color scheme (from reference image)
- Insuficiente (bottom-left): Red
- Eficaz, Questionável: Orange  
- Comprometido, Mantenedor, Enigma: Green/Teal
- Forte Desempenho (both): Blue
- Alto Potencial: Green

### Page rebuild (`src/pages/Matriz9Box.tsx`)
Full rebuild replacing the maintenance screen:

1. **Visual 3×3 grid** matching the reference image with colored quadrant cards showing name + description + employee count/dots
2. **Employee management**: Admin can add employees (name, performance 0-100, potential 0-100, notes), edit, delete. Each employee dot appears in their corresponding quadrant.
3. **CSV import/export** (already have export in `exportUtils.ts`, keep compatible)
4. **Quadrant click** expands to show employees in that cell
5. **Axis labels**: X = "Desempenho (compatibilidade com cargo)", Y = "Potencial (liderança)"

### Files to modify
- **Rewrite**: `src/pages/Matriz9Box.tsx` — full page with grid visualization, CRUD dialogs, quadrant logic
- **Update**: `src/utils/exportUtils.ts` — update `Matriz9BoxEntry` interface to use `performance` and `potential` field names matching the DB

