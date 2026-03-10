

## Plan: Módulos por Programa com Pre-work, Materiais e Exercícios

### Overview

Create a hierarchical structure: **Program → Modules → (Pre-work, Materials, Exercises)** with admin CRUD and user-facing navigation via tabs/accordions.

### 1. Database Changes

**New table: `program_modules`**
```sql
CREATE TABLE program_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_number INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Modify `program_materials`**: Add `module_id` column (nullable, for backward compat) and a `category` column to distinguish pre-work / material / exercise:
```sql
ALTER TABLE program_materials
  ADD COLUMN module_id UUID REFERENCES program_modules(id) ON DELETE CASCADE,
  ADD COLUMN category TEXT DEFAULT 'material'; -- 'prework', 'material', 'exercise'
```

RLS: same pattern — admins manage, authenticated view.

### 2. Admin UI (`AdminPrograms.tsx`)

Add a new tab **"Módulos"** (between Turmas and Materiais):
- List modules for selected program with drag/reorder or order input
- Dialog to create/edit a module (title, description, order)
- Delete module button

Modify the **"Materiais"** tab:
- Add a module selector dropdown (required when modules exist)
- Add a category selector: Pre-work / Material / Exercício
- Materials list grouped by module

### 3. User-Facing: Program Pages

**`ProgramLider360.tsx` and `ProgramGeneric.tsx`** (or unified into a single page):
- Fetch `program_modules` for the program, ordered by `order_number`
- Render each module as a Tab or Accordion item
- Inside each module, show 3 sections: **Pre-work**, **Materiais**, **Exercícios**
- For Líder 360: the existing questionnaire becomes an exercise within the appropriate module

**`MyDevelopment.tsx`**:
- Inside each enrollment accordion, show modules as nested tabs
- Each module tab shows its pre-work, materials, exercises
- Líder 360 questionnaire rendered inline in the relevant module's exercise section

### 4. Sidebar — No changes needed
Programs already appear as sub-items under Academy. Module navigation happens within each program page.

### Files Modified/Created

| File | Action |
|------|--------|
| Migration SQL | Create `program_modules`, alter `program_materials` |
| `src/pages/AdminPrograms.tsx` | Add "Módulos" tab, update "Materiais" tab with module/category selectors |
| `src/pages/MyDevelopment.tsx` | Show modules as nested tabs within each enrollment accordion |
| `src/pages/ProgramLider360.tsx` | Restructure into module-based tabs with pre-work/materials/exercises |
| `src/pages/ProgramGeneric.tsx` | Add module-based content display |

