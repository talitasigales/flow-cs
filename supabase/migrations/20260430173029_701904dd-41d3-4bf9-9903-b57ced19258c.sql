ALTER TABLE public.pending_enrollments ADD COLUMN IF NOT EXISTS secondary_email text NULL;

CREATE INDEX IF NOT EXISTS idx_pending_enrollments_secondary_email ON public.pending_enrollments (lower(secondary_email));
CREATE INDEX IF NOT EXISTS idx_pending_enrollments_secondary_email_program ON public.pending_enrollments (lower(secondary_email), program_id);

-- Trigger: normalize emails (lowercase/trim) and ensure secondary != primary
CREATE OR REPLACE FUNCTION public.normalize_pending_enrollment_emails()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS NOT NULL THEN
    NEW.email := lower(btrim(NEW.email));
  END IF;
  IF NEW.secondary_email IS NOT NULL THEN
    NEW.secondary_email := lower(btrim(NEW.secondary_email));
    IF NEW.secondary_email = '' THEN
      NEW.secondary_email := NULL;
    ELSIF NEW.secondary_email = NEW.email THEN
      NEW.secondary_email := NULL;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS pending_enrollments_normalize_emails ON public.pending_enrollments;
CREATE TRIGGER pending_enrollments_normalize_emails
BEFORE INSERT OR UPDATE ON public.pending_enrollments
FOR EACH ROW
EXECUTE FUNCTION public.normalize_pending_enrollment_emails();