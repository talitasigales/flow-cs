-- ============================================
-- MIGRAÇÃO CONSOLIDADA - ESTRUTURA COMPLETA
-- ============================================

-- 1. ENUM PARA ROLES
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- 2. FUNÇÃO UPDATE_UPDATED_AT
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TABELAS PRINCIPAIS
-- ============================================

-- 3. PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  analysis_result JSONB,
  password_changed BOOLEAN DEFAULT false,
  last_password_change TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. MODULES
CREATE TABLE public.modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Modules are viewable by authenticated users" ON public.modules
  FOR SELECT TO authenticated USING (true);

CREATE TRIGGER update_modules_updated_at
  BEFORE UPDATE ON public.modules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. USER_PROGRESS
CREATE TABLE public.user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, module_id)
);

ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress" ON public.user_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress" ON public.user_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" ON public.user_progress
  FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_user_progress_updated_at
  BEFORE UPDATE ON public.user_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. MATRIZ_9BOX
CREATE TABLE public.matriz_9box (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  employee_name TEXT NOT NULL,
  performance INTEGER NOT NULL CHECK (performance >= 0 AND performance <= 100),
  potential INTEGER NOT NULL CHECK (potential >= 0 AND potential <= 100),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.matriz_9box ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own matriz data" ON public.matriz_9box
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own matriz data" ON public.matriz_9box
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own matriz data" ON public.matriz_9box
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own matriz data" ON public.matriz_9box
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_matriz_9box_updated_at
  BEFORE UPDATE ON public.matriz_9box
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. PROFILE_EVOLUTION
CREATE TABLE public.profile_evolution (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  employee_name TEXT NOT NULL,
  assessment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  r_value INTEGER CHECK (r_value >= 0 AND r_value <= 100),
  e_value INTEGER CHECK (e_value >= 0 AND e_value <= 100),
  p_value INTEGER CHECK (p_value >= 0 AND p_value <= 100),
  n_value INTEGER CHECK (n_value >= 0 AND n_value <= 100),
  a_value INTEGER CHECK (a_value >= 0 AND a_value <= 100),
  decision_making INTEGER CHECK (decision_making >= 0 AND decision_making <= 100),
  profile_intensity INTEGER CHECK (profile_intensity >= 0 AND profile_intensity <= 100),
  energy INTEGER CHECK (energy >= 0 AND energy <= 100),
  energy_balance INTEGER CHECK (energy_balance >= -100 AND energy_balance <= 100),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profile_evolution ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own evolution" ON public.profile_evolution
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own evolution" ON public.profile_evolution
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own evolution" ON public.profile_evolution
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own evolution" ON public.profile_evolution
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_profile_evolution_updated_at
  BEFORE UPDATE ON public.profile_evolution
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- SISTEMA DE PDI
-- ============================================

-- 8. PDIS
CREATE TABLE public.pdis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  employee_name TEXT NOT NULL,
  pda_axis TEXT NOT NULL,
  current_stage INTEGER NOT NULL DEFAULT 1 CHECK (current_stage >= 1 AND current_stage <= 5),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  target_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  behavior_assessments JSONB,
  reflective_answers JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pdis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pdis" ON public.pdis
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pdis" ON public.pdis
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pdis" ON public.pdis
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own pdis" ON public.pdis
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_pdis_updated_at
  BEFORE UPDATE ON public.pdis
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 9. PDI_MENTORS
CREATE TABLE public.pdi_mentors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pdi_id UUID REFERENCES public.pdis(id) ON DELETE CASCADE NOT NULL,
  mentor_name TEXT NOT NULL,
  mentor_role TEXT,
  contact_info TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pdi_mentors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view mentors of own pdis" ON public.pdi_mentors
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.pdis WHERE pdis.id = pdi_mentors.pdi_id AND pdis.user_id = auth.uid())
  );

CREATE POLICY "Users can insert mentors to own pdis" ON public.pdi_mentors
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.pdis WHERE pdis.id = pdi_mentors.pdi_id AND pdis.user_id = auth.uid())
  );

CREATE POLICY "Users can update mentors of own pdis" ON public.pdi_mentors
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.pdis WHERE pdis.id = pdi_mentors.pdi_id AND pdis.user_id = auth.uid())
  );

CREATE POLICY "Users can delete mentors of own pdis" ON public.pdi_mentors
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.pdis WHERE pdis.id = pdi_mentors.pdi_id AND pdis.user_id = auth.uid())
  );

-- 10. PDI_ACTIONS
CREATE TABLE public.pdi_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pdi_id UUID REFERENCES public.pdis(id) ON DELETE CASCADE NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('experience', 'social', 'formal')),
  description TEXT NOT NULL,
  specific TEXT,
  measurable TEXT,
  achievable TEXT,
  relevant TEXT,
  time_bound TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  evidence TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pdi_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view actions of own pdis" ON public.pdi_actions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.pdis WHERE pdis.id = pdi_actions.pdi_id AND pdis.user_id = auth.uid())
  );

CREATE POLICY "Users can insert actions to own pdis" ON public.pdi_actions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.pdis WHERE pdis.id = pdi_actions.pdi_id AND pdis.user_id = auth.uid())
  );

CREATE POLICY "Users can update actions of own pdis" ON public.pdi_actions
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.pdis WHERE pdis.id = pdi_actions.pdi_id AND pdis.user_id = auth.uid())
  );

CREATE POLICY "Users can delete actions of own pdis" ON public.pdi_actions
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.pdis WHERE pdis.id = pdi_actions.pdi_id AND pdis.user_id = auth.uid())
  );

CREATE TRIGGER update_pdi_actions_updated_at
  BEFORE UPDATE ON public.pdi_actions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 11. PDI_CHECKINS
CREATE TABLE public.pdi_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pdi_id UUID REFERENCES public.pdis(id) ON DELETE CASCADE NOT NULL,
  checkin_number INTEGER NOT NULL,
  checkin_date DATE NOT NULL DEFAULT CURRENT_DATE,
  what_worked TEXT,
  best_moment TEXT,
  what_didnt_work TEXT,
  obstacles TEXT,
  biggest_effort TEXT,
  who_can_help TEXT,
  new_action_ideas TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pdi_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view checkins of own pdis" ON public.pdi_checkins
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.pdis WHERE pdis.id = pdi_checkins.pdi_id AND pdis.user_id = auth.uid())
  );

CREATE POLICY "Users can insert checkins to own pdis" ON public.pdi_checkins
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.pdis WHERE pdis.id = pdi_checkins.pdi_id AND pdis.user_id = auth.uid())
  );

CREATE POLICY "Users can update checkins of own pdis" ON public.pdi_checkins
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.pdis WHERE pdis.id = pdi_checkins.pdi_id AND pdis.user_id = auth.uid())
  );

CREATE POLICY "Users can delete checkins of own pdis" ON public.pdi_checkins
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.pdis WHERE pdis.id = pdi_checkins.pdi_id AND pdis.user_id = auth.uid())
  );

CREATE TRIGGER update_pdi_checkins_updated_at
  BEFORE UPDATE ON public.pdi_checkins
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 12. PDI_CLOSURES
CREATE TABLE public.pdi_closures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pdi_id UUID REFERENCES public.pdis(id) ON DELETE CASCADE NOT NULL UNIQUE,
  closure_date DATE NOT NULL DEFAULT CURRENT_DATE,
  final_status TEXT,
  main_learnings TEXT,
  what_accomplished TEXT,
  what_not_accomplished TEXT,
  satisfaction_score INTEGER CHECK (satisfaction_score >= 0 AND satisfaction_score <= 100),
  what_was_missing TEXT,
  next_steps TEXT,
  gains_obtained TEXT,
  still_needs_development TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pdi_closures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view closures of own pdis" ON public.pdi_closures
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.pdis WHERE pdis.id = pdi_closures.pdi_id AND pdis.user_id = auth.uid())
  );

CREATE POLICY "Users can insert closures to own pdis" ON public.pdi_closures
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.pdis WHERE pdis.id = pdi_closures.pdi_id AND pdis.user_id = auth.uid())
  );

CREATE POLICY "Users can update closures of own pdis" ON public.pdi_closures
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.pdis WHERE pdis.id = pdi_closures.pdi_id AND pdis.user_id = auth.uid())
  );

CREATE TRIGGER update_pdi_closures_updated_at
  BEFORE UPDATE ON public.pdi_closures
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- SISTEMA DE ADMINISTRAÇÃO
-- ============================================

-- 13. USER_ROLES
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 14. HAS_ROLE FUNCTION (Security Definer)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles" ON public.user_roles
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles" ON public.user_roles
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles" ON public.user_roles
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- 15. USER_INVITES
CREATE TABLE public.user_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  role app_role NOT NULL DEFAULT 'user',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all invites" ON public.user_invites
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert invites" ON public.user_invites
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update invites" ON public.user_invites
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete invites" ON public.user_invites
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- 16. AUDIT_LOGS
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all logs" ON public.audit_logs
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert logs" ON public.audit_logs
  FOR INSERT WITH CHECK (true);

-- 17. LOG_USER_ACTION FUNCTION
CREATE OR REPLACE FUNCTION public.log_user_action(
  _action TEXT,
  _table_name TEXT DEFAULT NULL,
  _record_id UUID DEFAULT NULL,
  _old_data JSONB DEFAULT NULL,
  _new_data JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_data, new_data)
  VALUES (auth.uid(), _action, _table_name, _record_id, _old_data, _new_data)
  RETURNING id INTO log_id;
  RETURN log_id;
END;
$$;

-- 18. MODULE_MATERIALS
CREATE TABLE public.module_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  file_type TEXT,
  order_number INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.module_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Materials viewable by authenticated users" ON public.module_materials
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert materials" ON public.module_materials
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update materials" ON public.module_materials
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete materials" ON public.module_materials
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_module_materials_updated_at
  BEFORE UPDATE ON public.module_materials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- BASE DE CONHECIMENTO (NANDA)
-- ============================================

-- 19. KNOWLEDGE_BASE
CREATE TABLE public.knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  keywords TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Knowledge base viewable by authenticated users" ON public.knowledge_base
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage knowledge base" ON public.knowledge_base
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_knowledge_base_updated_at
  BEFORE UPDATE ON public.knowledge_base
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- HANDLE NEW USER (Auto Profile Creation)
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- ADMIN POLICIES FOR PROFILES
-- ============================================

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- STORAGE BUCKET
-- ============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('module-materials', 'module-materials', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view module materials" ON storage.objects
  FOR SELECT USING (bucket_id = 'module-materials');

CREATE POLICY "Admins can upload module materials" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'module-materials' 
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can update module materials" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'module-materials' 
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can delete module materials" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'module-materials' 
    AND public.has_role(auth.uid(), 'admin')
  );

-- ============================================
-- DADOS INICIAIS DOS MÓDULOS
-- ============================================

INSERT INTO public.modules (order_number, title, description, video_url, thumbnail_url) VALUES
(1, 'Fundamentos do PDA e Autoconhecimento', 'Teoria de Marston, leitura e interpretação de relatórios PDA, compreendendo o perfil natural versus adaptado.', 'https://www.youtube.com/embed/3bWBK32N-PY', '/images/modulo-1-cover.jpg'),
(2, 'Seleção e Onboarding Inteligente', 'Como o PDA auxilia em processo seletivo assertivo, construção de cargos comportamentais e integração de novos colaboradores.', 'https://youtu.be/7OmYICFxqQ4', '/images/modulo-2-cover.jpg'),
(3, 'Desenvolvimento e Engajamento', 'PDI comportamental, estratégias de engajamento baseadas no perfil e desenvolvimento de talentos.', NULL, '/images/modulo-3-cover.jpg'),
(4, 'Demandas de Equipe e Cultura Organizacional', 'Leitura comportamental de equipes para resultados, alinhamento cultural e gestão de conflitos.', NULL, '/images/modulo-4-cover.jpg'),
(5, 'Desenvolvendo Líderes com o PDA', 'Do potencial à performance: como desenvolver líderes usando dados comportamentais.', NULL, '/images/modulo-5-cover.jpg'),
(6, 'RH como Consultor Interno', 'Transformando dados comportamentais em decisões estratégicas para o negócio.', NULL, '/images/modulo-6-cover.jpg');

-- ============================================
-- DADOS INICIAIS DA KNOWLEDGE BASE
-- ============================================

INSERT INTO public.knowledge_base (category, title, content, keywords) VALUES
('pda', 'O que é REPNA', 'REPNA é um acrônimo que representa os 5 eixos comportamentais do PDA Assessment: R (Risco/Dominância), E (Extroversão), P (Paciência), N (Normas/Conformidade) e A (Autocontrole). Cada eixo pode ter intensidade alta (68-100), situacional (34-67) ou baixa (0-33).', ARRAY['repna', 'pda', 'eixos', 'comportamental']),
('pda', 'Eixo R - Risco', 'O eixo R mede a tolerância ao risco e orientação para resultados. Risco Alto: pessoas orientadas a resultados, competitivas, diretas. Risco Baixo: pessoas cautelosas, analíticas, que preferem analisar antes de agir.', ARRAY['risco', 'dominancia', 'resultados']),
('pda', 'Eixo E - Extroversão', 'O eixo E mede a sociabilidade e comunicação. Extroversão Alta: pessoas comunicativas, persuasivas, entusiasmadas. Extroversão Baixa: pessoas reservadas, focadas, que preferem trabalhar sozinhas.', ARRAY['extroversao', 'comunicacao', 'sociabilidade']),
('pda', 'Eixo P - Paciência', 'O eixo P mede a tolerância a mudanças e ritmo de trabalho. Paciência Alta: pessoas estáveis, persistentes, que valorizam rotina. Paciência Baixa: pessoas dinâmicas, multitarefa, que buscam variedade.', ARRAY['paciencia', 'estabilidade', 'ritmo']),
('pda', 'Eixo N - Normas', 'O eixo N mede a orientação para regras e procedimentos. Normas Altas: pessoas detalhistas, organizadas, que seguem processos. Normas Baixas: pessoas autônomas, criativas, que questionam regras.', ARRAY['normas', 'conformidade', 'regras', 'processos']),
('pda', 'Eixo A - Autocontrole', 'O eixo A mede o equilíbrio entre razão e emoção na tomada de decisões. Indica como a pessoa lida com pressão e estresse.', ARRAY['autocontrole', 'equilibrio', 'emocional']),
('pdi', 'O que é PDI', 'PDI (Plano de Desenvolvimento Individual) é uma ferramenta estruturada para desenvolver competências comportamentais. Baseado no PDA, identifica gaps e define ações usando metodologia SMART e modelo 70|20|10.', ARRAY['pdi', 'desenvolvimento', 'plano']),
('pdi', 'Metodologia SMART', 'SMART é um acrônimo para criar objetivos: S-Específico (o que exatamente fazer), M-Mensurável (como medir progresso), A-Alcançável (é realista?), R-Relevante (conectado ao objetivo maior), T-Temporal (prazo definido).', ARRAY['smart', 'objetivos', 'metas']),
('pdi', 'Modelo 70|20|10', 'Distribuição de aprendizado: 70% experiências práticas (2-3 ações no dia a dia), 20% aprendizado social (1 ação com mentores), 10% aprendizado formal (1 ação de cursos/livros).', ARRAY['70-20-10', 'aprendizado', 'desenvolvimento']);