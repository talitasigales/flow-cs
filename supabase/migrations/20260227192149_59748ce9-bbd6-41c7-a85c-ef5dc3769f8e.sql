
ALTER TABLE public.profiles ADD COLUMN lgpd_accepted boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN lgpd_accepted_at timestamp with time zone;
