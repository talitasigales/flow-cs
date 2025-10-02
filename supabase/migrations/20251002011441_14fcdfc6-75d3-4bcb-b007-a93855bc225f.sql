-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  company TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create modules table
CREATE TABLE public.modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT,
  module_order INTEGER NOT NULL,
  materials JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

-- Policy for modules (all authenticated users can view)
CREATE POLICY "Authenticated users can view modules"
  ON public.modules FOR SELECT
  TO authenticated
  USING (true);

-- Create user_progress table
CREATE TABLE public.user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT false,
  video_watched BOOLEAN DEFAULT false,
  materials_downloaded TEXT[] DEFAULT ARRAY[]::TEXT[],
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, module_id)
);

-- Enable RLS
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- Policies for user_progress
CREATE POLICY "Users can view their own progress"
  ON public.user_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress"
  ON public.user_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
  ON public.user_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- Create matriz_9box table for saving user inputs
CREATE TABLE public.matriz_9box (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_name TEXT NOT NULL,
  performance_score INTEGER NOT NULL CHECK (performance_score >= 1 AND performance_score <= 9),
  role_fit_score INTEGER NOT NULL CHECK (role_fit_score >= 1 AND role_fit_score <= 9),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.matriz_9box ENABLE ROW LEVEL SECURITY;

-- Policies for matriz_9box
CREATE POLICY "Users can view their own matriz data"
  ON public.matriz_9box FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own matriz data"
  ON public.matriz_9box FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own matriz data"
  ON public.matriz_9box FOR DELETE
  USING (auth.uid() = user_id);

-- Create profile_evolution table for profile analysis
CREATE TABLE public.profile_evolution (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  file_url TEXT,
  analysis_result JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profile_evolution ENABLE ROW LEVEL SECURITY;

-- Policies for profile_evolution
CREATE POLICY "Users can view their own evolution data"
  ON public.profile_evolution FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own evolution data"
  ON public.profile_evolution FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_progress_updated_at
  BEFORE UPDATE ON public.user_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Insert initial modules
INSERT INTO public.modules (title, description, module_order, video_url, materials) VALUES
('Módulo 1: Introdução ao PDA', 'Fundamentos do PDA Assessment e como começar sua jornada', 1, '', '[]'),
('Módulo 2: Autoconhecimento', 'Compreenda seu perfil comportamental e seus eixos', 2, '', '[]'),
('Módulo 3: Aplicação Prática', 'Como utilizar o PDA no dia a dia', 3, '', '[]'),
('Módulo 4: Análise de Perfis', 'Técnicas de análise e comparação de perfis', 4, '', '[]'),
('Módulo 5: Gestão de Pessoas', 'Usando PDA para gestão e desenvolvimento de equipes', 5, '', '[]'),
('Módulo 6: Estratégias Avançadas', 'Dominando as ferramentas e recursos avançados', 6, '', '[]');