CREATE TABLE IF NOT EXISTS public.platform_changelog (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'melhoria',
  area TEXT NOT NULL DEFAULT 'Geral',
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_platform_changelog_published_at ON public.platform_changelog(published_at DESC);

ALTER TABLE public.platform_changelog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view changelog"
ON public.platform_changelog FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert changelog"
ON public.platform_changelog FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update changelog"
ON public.platform_changelog FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete changelog"
ON public.platform_changelog FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_platform_changelog_updated_at
BEFORE UPDATE ON public.platform_changelog
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();