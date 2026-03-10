
-- Create specialists table
CREATE TABLE public.specialists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  bio text,
  avatar_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.specialists ENABLE ROW LEVEL SECURITY;

-- Admins can manage
CREATE POLICY "Admins can manage specialists" ON public.specialists
  FOR ALL TO public
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Authenticated can view
CREATE POLICY "Authenticated can view specialists" ON public.specialists
  FOR SELECT TO authenticated
  USING (true);

-- Seed existing specialists
INSERT INTO public.specialists (name, bio, avatar_url) VALUES
  ('Silvia Kirsten', 'Especialista em desenvolvimento de liderança e gestão comportamental.', '/images/specialists/silvia-kirsten.png'),
  ('Luciana Masiero', 'Especialista em gestão de pessoas e desenvolvimento organizacional.', '/images/specialists/luciana-masiero.png'),
  ('Julia Ferreira', 'Especialista em autogestão e perfil comportamental PDA.', '/images/specialists/julia-ferreira.png');
