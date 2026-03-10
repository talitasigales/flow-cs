
-- Table to store welcome messages per program
CREATE TABLE public.program_welcome_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  message_type text NOT NULL DEFAULT 'text', -- 'text' or 'video'
  title text,
  content text, -- text content
  video_url text, -- uploaded video URL
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(program_id)
);

ALTER TABLE public.program_welcome_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage welcome messages" ON public.program_welcome_messages
  FOR ALL TO public USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can view active welcome messages" ON public.program_welcome_messages
  FOR SELECT TO authenticated USING (active = true);

-- Table to track which users have dismissed the welcome popup
CREATE TABLE public.program_welcome_dismissed (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  program_id uuid NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  dismissed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, program_id)
);

ALTER TABLE public.program_welcome_dismissed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own dismissals" ON public.program_welcome_dismissed
  FOR SELECT TO public USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own dismissals" ON public.program_welcome_dismissed
  FOR INSERT TO public WITH CHECK (auth.uid() = user_id);
