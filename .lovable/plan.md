

## Plan: Add Webinars Tab

### Overview
Create a "Webinars" section accessible from the sidebar where users can browse past webinars (with embedded video or link) and admins can manage them (add, edit, delete).

### 1. Database Migration
Create a `webinars` table:

```sql
CREATE TABLE public.webinars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  video_url text NOT NULL,
  thumbnail_url text,
  presenter text,
  webinar_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.webinars ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can view
CREATE POLICY "Authenticated can view webinars" ON public.webinars
  FOR SELECT TO authenticated USING (true);

-- Only admins can manage
CREATE POLICY "Admins can insert webinars" ON public.webinars
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update webinars" ON public.webinars
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete webinars" ON public.webinars
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Updated_at trigger
CREATE TRIGGER update_webinars_updated_at
  BEFORE UPDATE ON public.webinars
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 2. New Page: `src/pages/Webinars.tsx`
- Card grid layout showing webinars sorted by date (newest first)
- Each card: thumbnail (or video embed preview), title, description, presenter, date
- Click opens the video URL or shows an embedded player (YouTube/Vimeo iframe)
- Admin users see "Add Webinar" button and edit/delete controls on each card
- Add/edit dialog with fields: title, description, video URL, thumbnail URL (optional), presenter, date

### 3. Route and Sidebar
- Add route `/webinars` in `App.tsx`
- Add "Webinars" item in the sidebar under the main menu (using `Video` icon from lucide-react), positioned after "Trilhas de Sucesso"

### Files to create/modify
- **Create**: `src/pages/Webinars.tsx`
- **Modify**: `src/App.tsx` (add route)
- **Modify**: `src/components/AppSidebar.tsx` (add menu item)
- **Migration**: new webinars table

