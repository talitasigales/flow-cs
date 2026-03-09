

## Plan: Meu Desenvolvimento com exercícios por programa + controle de visibilidade Academy

### Overview

Three main changes:
1. **MyDevelopment page**: Show enrolled programs with their exercises/materials inline (Líder 360 shows the questionnaire directly)
2. **Sidebar Academy visibility**: Users not enrolled in any program only see "Calendário de Turmas" (no "Meu Desenvolvimento")
3. **Admin-only controls** are already in place for turmas/matrículas/respostas via `AdminPrograms.tsx`

### 1. Database: `program_materials` table

Create a new table to store materials/exercises per program that admins can manage:

```sql
CREATE TABLE program_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  file_type TEXT, -- 'link', 'pdf', 'doc', etc.
  order_number INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE program_materials ENABLE ROW LEVEL SECURITY;
-- Admins manage, authenticated view
CREATE POLICY "Admins can manage program materials" ON program_materials FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can view program materials" ON program_materials FOR SELECT TO authenticated USING (true);
```

### 2. `MyDevelopment.tsx` — Expand to show exercises per program

- For each enrollment card, fetch `workshop_responses` (for Líder 360) and `program_materials` for the program.
- For Líder 360 (`slug === 'lider-360'`): embed the questionnaire form directly (reuse the same QUESTIONS/PDA logic from `ProgramLider360.tsx`), showing current answers and allowing save.
- For other programs: show a list of materials/links from `program_materials`.
- Each enrollment becomes an expandable accordion showing the program name, class info, and its exercises/materials.

### 3. `AppSidebar.tsx` — Conditional Academy sub-items

Change the Academy collapsible rendering:
- Always show "Calendário de Turmas"
- Only show "Meu Desenvolvimento" + enrolled program links if `isEnrolled` is true
- Always show the Academy section (remove the `isEnrolled` gate)

### 4. `AdminPrograms.tsx` — Add Materials management tab

Add a 5th tab "Materiais" where admins can:
- Add/remove materials (title, description, file URL, type) per selected program
- This is admin-only (page already gates on `isAdmin`)

### Files Modified/Created

| File | Action |
|------|--------|
| Migration SQL | Create `program_materials` table |
| `src/pages/MyDevelopment.tsx` | Rewrite with accordion per enrollment, embed Líder 360 questionnaire, show materials |
| `src/components/AppSidebar.tsx` | Show Academy always; "Meu Desenvolvimento" only if enrolled |
| `src/pages/AdminPrograms.tsx` | Add "Materiais" tab for managing program materials |

### No changes needed for
- `ProgramLider360.tsx` — kept as standalone page for direct access
- Auth/RLS — admin controls already gated properly

