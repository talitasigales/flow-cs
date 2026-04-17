export type HealthBand = 'healthy' | 'warning' | 'critical';

export interface TouchpointForScore {
  occurred_at: string;
  type: string;
  status: string;
}

export interface HealthResult {
  score: number;
  band: HealthBand;
  daysSinceLast: number | null;
  reasons: string[];
}

const daysBetween = (a: Date, b: Date) => Math.floor((a.getTime() - b.getTime()) / 86400000);

export function calculateHealthScore(
  status: string,
  touchpoints: TouchpointForScore[],
): HealthResult {
  const reasons: string[] = [];
  let score = 70;

  const realized = touchpoints
    .filter(t => t.status === 'realizado')
    .map(t => new Date(t.occurred_at))
    .sort((a, b) => b.getTime() - a.getTime());

  const now = new Date();
  const last = realized[0] ?? null;
  const daysSinceLast = last ? daysBetween(now, last) : null;

  if (daysSinceLast === null) {
    score -= 30;
    reasons.push('Nenhuma interação registrada');
  } else if (daysSinceLast <= 7) {
    score += 20;
    reasons.push(`Contato recente (${daysSinceLast}d)`);
  } else if (daysSinceLast <= 30) {
    score += 10;
  } else if (daysSinceLast <= 60) {
    // 0
  } else if (daysSinceLast <= 90) {
    score -= 15;
    reasons.push(`Sem contato há ${daysSinceLast}d`);
  } else {
    score -= 30;
    reasons.push(`Sem contato há ${daysSinceLast}d`);
  }

  const last90 = realized.filter(d => daysBetween(now, d) <= 90).length;
  if (last90 >= 6) score += 10;
  else if (last90 >= 3) score += 5;
  else if (last90 === 0) score -= 10;

  if (status === 'risco') {
    score -= 25;
    reasons.push('Status: Risco');
  } else if (status === 'churn') {
    score -= 40;
    reasons.push('Status: Churn');
  } else if (status === 'expansao') {
    score += 10;
  }

  const supportRecent = touchpoints.some(
    t => t.type === 'suporte' && t.status === 'realizado' && daysBetween(now, new Date(t.occurred_at)) <= 30,
  );
  if (supportRecent) {
    score -= 10;
    reasons.push('Suporte crítico recente');
  }

  score = Math.max(0, Math.min(100, score));
  const band: HealthBand = score >= 75 ? 'healthy' : score >= 50 ? 'warning' : 'critical';

  return { score, band, daysSinceLast, reasons };
}

export const TOUCHPOINT_TYPE_LABELS: Record<string, string> = {
  reuniao_estrategica: 'Reunião estratégica',
  onboarding: 'Onboarding',
  apresentacao: 'Apresentação de plataforma',
  construcao_cargo: 'Construção de cargo',
  visita: 'Visita presencial',
  follow_up: 'Follow-up',
  suporte: 'Suporte / problema',
  expansao: 'Expansão / upsell',
  outro: 'Outro',
};

export const TOUCHPOINT_STATUS_LABELS: Record<string, string> = {
  realizado: 'Realizado',
  agendado: 'Agendado',
  cancelado: 'Cancelado',
};

export const COMPANY_STATUS_LABELS: Record<string, string> = {
  onboarding: 'Onboarding',
  ativo: 'Ativo',
  risco: 'Risco',
  churn: 'Churn',
  expansao: 'Expansão',
};

export const INFLUENCE_LABELS: Record<string, string> = {
  decisor: 'Decisor',
  influenciador: 'Influenciador',
  usuario: 'Usuário',
};
