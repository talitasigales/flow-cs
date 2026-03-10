
ALTER TABLE public.program_materials 
ADD COLUMN IF NOT EXISTS video_urls jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.program_materials.video_urls IS 'Array of {url, title} objects for multiple video links per material';
