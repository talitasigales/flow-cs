-- Criar tabela principal de PDIs
CREATE TABLE IF NOT EXISTS pdis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  employee_name TEXT NOT NULL,
  employee_role TEXT,
  employee_department TEXT,
  pda_axis TEXT NOT NULL CHECK (pda_axis IN ('risco_alto', 'risco_baixo', 'extroversao_alta', 'extroversao_baixa', 'paciencia_alta', 'paciencia_baixa', 'normas_altas', 'normas_baixas')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'devolutiva', 'construcao', 'acompanhamento', 'fechamento', 'completed')),
  current_step INTEGER DEFAULT 1 CHECK (current_step BETWEEN 1 AND 5),
  start_date DATE,
  target_date DATE,
  overall_progress INTEGER DEFAULT 0 CHECK (overall_progress BETWEEN 0 AND 100),
  behavior_ratings JSONB DEFAULT '[]',
  reflective_answers JSONB DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Criar tabela de mentores do PDI
CREATE TABLE IF NOT EXISTS pdi_mentors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pdi_id UUID REFERENCES pdis(id) ON DELETE CASCADE NOT NULL,
  mentor_name TEXT NOT NULL,
  mentor_role TEXT,
  contact_info TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Criar tabela de ações do PDI
CREATE TABLE IF NOT EXISTS pdi_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pdi_id UUID REFERENCES pdis(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  learning_type TEXT NOT NULL CHECK (learning_type IN ('experience', 'mentoring', 'formal')),
  what_to_do TEXT,
  how_to_do TEXT,
  why_to_do TEXT,
  where_to_do TEXT,
  when_to_do TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  due_date DATE,
  completed_at TIMESTAMPTZ,
  evidence TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Criar tabela de check-ins de acompanhamento
CREATE TABLE IF NOT EXISTS pdi_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pdi_id UUID REFERENCES pdis(id) ON DELETE CASCADE NOT NULL,
  checkin_number INTEGER DEFAULT 1,
  checkin_date DATE NOT NULL,
  what_worked TEXT,
  best_moment TEXT,
  what_didnt_work TEXT,
  obstacles TEXT,
  biggest_effort TEXT,
  who_can_help TEXT,
  new_ideas TEXT,
  overall_status TEXT CHECK (overall_status IN ('on_track', 'at_risk', 'delayed')),
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Criar tabela de fechamento do PDI
CREATE TABLE IF NOT EXISTS pdi_closures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pdi_id UUID REFERENCES pdis(id) ON DELETE CASCADE NOT NULL,
  closure_date DATE NOT NULL,
  how_finishing TEXT,
  learnings TEXT,
  what_accomplished TEXT,
  what_not_accomplished TEXT,
  satisfaction_score INTEGER CHECK (satisfaction_score BETWEEN 0 AND 100),
  what_was_missing TEXT,
  next_steps TEXT,
  gains TEXT,
  still_to_develop TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS nas tabelas
ALTER TABLE pdis ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdi_mentors ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdi_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdi_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdi_closures ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para pdis
CREATE POLICY "Usuários podem visualizar seus próprios PDIs"
  ON pdis FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins podem visualizar todos os PDIs"
  ON pdis FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Usuários podem inserir seus próprios PDIs"
  ON pdis FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios PDIs"
  ON pdis FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios PDIs"
  ON pdis FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas RLS para pdi_mentors
CREATE POLICY "Usuários podem visualizar mentores dos seus PDIs"
  ON pdi_mentors FOR SELECT
  USING (EXISTS (SELECT 1 FROM pdis WHERE pdis.id = pdi_mentors.pdi_id AND pdis.user_id = auth.uid()));

CREATE POLICY "Admins podem visualizar todos os mentores"
  ON pdi_mentors FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Usuários podem inserir mentores nos seus PDIs"
  ON pdi_mentors FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM pdis WHERE pdis.id = pdi_mentors.pdi_id AND pdis.user_id = auth.uid()));

CREATE POLICY "Usuários podem atualizar mentores dos seus PDIs"
  ON pdi_mentors FOR UPDATE
  USING (EXISTS (SELECT 1 FROM pdis WHERE pdis.id = pdi_mentors.pdi_id AND pdis.user_id = auth.uid()));

CREATE POLICY "Usuários podem deletar mentores dos seus PDIs"
  ON pdi_mentors FOR DELETE
  USING (EXISTS (SELECT 1 FROM pdis WHERE pdis.id = pdi_mentors.pdi_id AND pdis.user_id = auth.uid()));

-- Políticas RLS para pdi_actions
CREATE POLICY "Usuários podem visualizar ações dos seus PDIs"
  ON pdi_actions FOR SELECT
  USING (EXISTS (SELECT 1 FROM pdis WHERE pdis.id = pdi_actions.pdi_id AND pdis.user_id = auth.uid()));

CREATE POLICY "Admins podem visualizar todas as ações"
  ON pdi_actions FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Usuários podem inserir ações nos seus PDIs"
  ON pdi_actions FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM pdis WHERE pdis.id = pdi_actions.pdi_id AND pdis.user_id = auth.uid()));

CREATE POLICY "Usuários podem atualizar ações dos seus PDIs"
  ON pdi_actions FOR UPDATE
  USING (EXISTS (SELECT 1 FROM pdis WHERE pdis.id = pdi_actions.pdi_id AND pdis.user_id = auth.uid()));

CREATE POLICY "Usuários podem deletar ações dos seus PDIs"
  ON pdi_actions FOR DELETE
  USING (EXISTS (SELECT 1 FROM pdis WHERE pdis.id = pdi_actions.pdi_id AND pdis.user_id = auth.uid()));

-- Políticas RLS para pdi_checkins
CREATE POLICY "Usuários podem visualizar check-ins dos seus PDIs"
  ON pdi_checkins FOR SELECT
  USING (EXISTS (SELECT 1 FROM pdis WHERE pdis.id = pdi_checkins.pdi_id AND pdis.user_id = auth.uid()));

CREATE POLICY "Admins podem visualizar todos os check-ins"
  ON pdi_checkins FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Usuários podem inserir check-ins nos seus PDIs"
  ON pdi_checkins FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM pdis WHERE pdis.id = pdi_checkins.pdi_id AND pdis.user_id = auth.uid()));

CREATE POLICY "Usuários podem atualizar check-ins dos seus PDIs"
  ON pdi_checkins FOR UPDATE
  USING (EXISTS (SELECT 1 FROM pdis WHERE pdis.id = pdi_checkins.pdi_id AND pdis.user_id = auth.uid()));

-- Políticas RLS para pdi_closures
CREATE POLICY "Usuários podem visualizar fechamentos dos seus PDIs"
  ON pdi_closures FOR SELECT
  USING (EXISTS (SELECT 1 FROM pdis WHERE pdis.id = pdi_closures.pdi_id AND pdis.user_id = auth.uid()));

CREATE POLICY "Admins podem visualizar todos os fechamentos"
  ON pdi_closures FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Usuários podem inserir fechamentos nos seus PDIs"
  ON pdi_closures FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM pdis WHERE pdis.id = pdi_closures.pdi_id AND pdis.user_id = auth.uid()));

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_pdis_updated_at
  BEFORE UPDATE ON pdis
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pdi_actions_updated_at
  BEFORE UPDATE ON pdi_actions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();