CREATE TABLE public.pdi_shares (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pdi_id uuid NOT NULL REFERENCES public.pdis(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  created_by uuid NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  expires_at timestamp with time zone,
  hide_notes boolean NOT NULL DEFAULT true,
  view_count integer NOT NULL DEFAULT 0,
  last_viewed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pdi_shares TO authenticated;
GRANT ALL ON public.pdi_shares TO service_role;

ALTER TABLE public.pdi_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view their pdi shares"
ON public.pdi_shares FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.pdis p WHERE p.id = pdi_shares.pdi_id AND p.user_id = auth.uid()));

CREATE POLICY "Owners can create pdi shares"
ON public.pdi_shares FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid() AND EXISTS (SELECT 1 FROM public.pdis p WHERE p.id = pdi_shares.pdi_id AND p.user_id = auth.uid()));

CREATE POLICY "Owners can update their pdi shares"
ON public.pdi_shares FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.pdis p WHERE p.id = pdi_shares.pdi_id AND p.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.pdis p WHERE p.id = pdi_shares.pdi_id AND p.user_id = auth.uid()));

CREATE POLICY "Owners can delete their pdi shares"
ON public.pdi_shares FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.pdis p WHERE p.id = pdi_shares.pdi_id AND p.user_id = auth.uid()));

CREATE INDEX idx_pdi_shares_pdi_id ON public.pdi_shares(pdi_id);

CREATE TRIGGER update_pdi_shares_updated_at
BEFORE UPDATE ON public.pdi_shares
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();