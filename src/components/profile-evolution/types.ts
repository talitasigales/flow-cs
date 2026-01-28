export interface ProfileEvolutionAnalysis {
  employee_name: string;
  r: number;
  e: number;
  p: number;
  n: number;
  a: number;
  tomada_decisoes: number;
  intensidade_perfil: number;
  energia: number;
  equilibrio_energia: number;
  modificacao_perfil: number;
  notes: string | null;
}

export interface ProfileEvolution {
  id: string;
  employee_name: string;
  assessment_date: string;
  r_value: number | null;
  e_value: number | null;
  p_value: number | null;
  n_value: number | null;
  a_value: number | null;
  decision_making: number | null;
  profile_intensity: number | null;
  energy: number | null;
  energy_balance: number | null;
  notes: string | null;
  created_at: string;
  year: number;
  analysis_result: ProfileEvolutionAnalysis;
}

export interface ProfileFormData {
  employee_name: string;
  year: number;
  r: number;
  e: number;
  p: number;
  n: number;
  a: number;
  tomada_decisoes: number;
  intensidade_perfil: number;
  energia: number;
  equilibrio_energia: number;
  modificacao_perfil: number;
  notes: string;
}

export const getDefaultFormData = (): ProfileFormData => ({
  employee_name: '',
  year: new Date().getFullYear(),
  r: 50,
  e: 50,
  p: 50,
  n: 50,
  a: 50,
  tomada_decisoes: 50,
  intensidade_perfil: 50,
  energia: 50,
  equilibrio_energia: 50,
  modificacao_perfil: 50,
  notes: '',
});
