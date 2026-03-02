

## Plan: Admin Knowledge Base Management Page

### What
Create a new admin-only page where admins can view, add, edit, and delete knowledge base entries that power Nanda's responses.

### Approach

**1. New page: `src/pages/AdminKnowledgeBase.tsx`**
- Admin guard using `useIsAdmin` hook (same pattern as AdminUsers)
- Display existing knowledge base entries in a table (title, category, keywords count, content preview, actions)
- "Add New" button opens a dialog with form fields: title, category, content (textarea), keywords (comma-separated input)
- Edit button opens the same dialog pre-filled
- Delete button with confirmation dialog
- All CRUD operations use the Supabase client directly (RLS already allows admin full access via `has_role` policy)

**2. Update routing: `src/App.tsx`**
- Add route `/admin/knowledge-base` pointing to the new page

**3. Update sidebar: `src/components/AppSidebar.tsx`**
- Add "Base de Conhecimento" to the admin menu items (under Administração section)

### Technical Details

- The `knowledge_base` table already has proper RLS: admins have ALL access, authenticated users have SELECT
- No database migrations needed
- CRUD uses `supabase.from('knowledge_base')` with `as any` cast (same pattern used elsewhere since the type isn't in the generated types)
- Form validation with required fields: title, category, content
- Keywords stored as text array (user inputs comma-separated, code splits into array)
- Categories offered as a select dropdown with existing categories (Fundamentos, Modelos PDI, Guia PDI, Metodologias, Plataforma, Diferenciais, Aplicação) plus option to type custom

