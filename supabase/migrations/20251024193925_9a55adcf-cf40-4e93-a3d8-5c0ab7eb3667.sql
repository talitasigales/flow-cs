-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policy: Users can view their own roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create storage bucket for module materials
INSERT INTO storage.buckets (id, name, public)
VALUES ('module-materials', 'module-materials', true);

-- Storage policies for module materials
CREATE POLICY "Anyone can view module materials"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'module-materials');

CREATE POLICY "Admins can upload module materials"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'module-materials' 
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can update module materials"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'module-materials' 
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can delete module materials"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'module-materials' 
    AND public.has_role(auth.uid(), 'admin')
  );

-- Create module_materials table
CREATE TABLE public.module_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('file', 'link', 'pdf')),
  url TEXT,
  file_path TEXT,
  file_size BIGINT,
  uploaded_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on module_materials
ALTER TABLE public.module_materials ENABLE ROW LEVEL SECURITY;

-- RLS policies for module_materials
CREATE POLICY "Authenticated users can view module materials"
  ON public.module_materials
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert module materials"
  ON public.module_materials
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update module materials"
  ON public.module_materials
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete module materials"
  ON public.module_materials
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_module_materials_updated_at
  BEFORE UPDATE ON public.module_materials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();