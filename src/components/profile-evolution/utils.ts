import { ProfileEvolution } from './types';

export const getProfileValue = (profile: ProfileEvolution, key: string): number => {
  const mappings: Record<string, keyof ProfileEvolution> = {
    r: 'r_value',
    e: 'e_value',
    p: 'p_value',
    n: 'n_value',
    a: 'a_value',
    tomada_decisoes: 'decision_making',
    intensidade_perfil: 'profile_intensity',
    energia: 'energy',
    equilibrio_energia: 'energy_balance',
    modificacao_perfil: 'profile_modification' as any,
  };
  const dbKey = mappings[key] || key;
  return (profile[dbKey as keyof ProfileEvolution] as number) || 0;
};

export const getProfileColor = (dimension: string) => {
  switch (dimension) {
    case 'r':
      return 'bg-orange-500';
    case 'e':
      return 'bg-yellow-500';
    case 'p':
      return 'bg-blue-500';
    case 'n':
      return 'bg-green-500';
    case 'a':
      return 'bg-purple-600';
    case 'tomada_decisoes':
      return 'bg-cyan-500';
    case 'intensidade_perfil':
      return 'bg-pink-500';
    case 'energia':
      return 'bg-red-500';
    case 'equilibrio_energia':
      return 'bg-indigo-500';
    case 'modificacao_perfil':
      return 'bg-teal-500';
    default:
      return 'bg-primary';
  }
};

export const getProfileColorHex = (dimension: string) => {
  switch (dimension) {
    case 'r':
      return '#f97316';
    case 'e':
      return '#eab308';
    case 'p':
      return '#3b82f6';
    case 'n':
      return '#22c55e';
    case 'a':
      return '#9333ea';
    default:
      return '#3b82f6';
  }
};

export const getDimensionLabel = (dimension: string) => {
  switch (dimension) {
    case 'r':
      return 'R (Risco)';
    case 'e':
      return 'E (Extroversão)';
    case 'p':
      return 'P (Paciência)';
    case 'n':
      return 'N (Normas)';
    case 'a':
      return 'A (Autocontrole)';
    case 'tomada_decisoes':
      return 'Tomada de Decisões';
    case 'intensidade_perfil':
      return 'Intensidade do Perfil';
    case 'energia':
      return 'Energia';
    case 'equilibrio_energia':
      return 'Equilíbrio de Energia';
    case 'modificacao_perfil':
      return 'Modificação do Perfil';
    default:
      return dimension;
  }
};

export const calculateDelta = (
  profiles: ProfileEvolution[],
  yearA: number | null,
  yearB: number | null,
  dimension: string
) => {
  if (!yearA || !yearB) return { value: 0, percentage: 0, trend: 'neutral' as const };

  const profileA = profiles.find((p) => p.year === yearA);
  const profileB = profiles.find((p) => p.year === yearB);

  if (!profileA || !profileB) return { value: 0, percentage: 0, trend: 'neutral' as const };

  const valueA = getProfileValue(profileA, dimension);
  const valueB = getProfileValue(profileB, dimension);
  const diff = valueB - valueA;
  const percentage = valueA !== 0 ? Math.round((diff / valueA) * 100) : 0;

  return {
    value: diff,
    percentage,
    trend: diff > 0 ? ('up' as const) : diff < 0 ? ('down' as const) : ('neutral' as const),
  };
};

export const mapDatabaseToProfile = (item: any): ProfileEvolution => {
  // Parse YYYY-MM-DD safely without timezone shift
  const year = parseInt(String(item.assessment_date).slice(0, 4), 10);
  return {
    id: item.id,
    employee_name: item.employee_name,
    assessment_date: item.assessment_date,
    r_value: item.r_value,
    e_value: item.e_value,
    p_value: item.p_value,
    n_value: item.n_value,
    a_value: item.a_value,
    decision_making: item.decision_making,
    profile_intensity: item.profile_intensity,
    energy: item.energy,
    energy_balance: item.energy_balance,
    notes: item.notes,
    created_at: item.created_at,
    year,
    analysis_result: {
      employee_name: item.employee_name,
      r: item.r_value || 0,
      e: item.e_value || 0,
      p: item.p_value || 0,
      n: item.n_value || 0,
      a: item.a_value || 0,
      tomada_decisoes: item.decision_making || 0,
      intensidade_perfil: item.profile_intensity || 0,
      energia: item.energy || 0,
      equilibrio_energia: item.energy_balance || 0,
      modificacao_perfil: (item as any).profile_modification || 0,
      notes: item.notes,
    },
  };
};
