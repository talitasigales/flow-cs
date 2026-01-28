import { jobConstructionQuestions, Axis } from '@/data/jobConstructionQuestions';

export interface JobProfileScores {
  R: number;
  E: number;
  P: number;
  N: number;
  A: number;
}

export type Answers = Record<number, boolean>;

/**
 * Calculate REPNA scores based on questionnaire answers
 * Formula: Score = (Yes answers for axis / Total questions for axis) × 100
 */
export function calculateJobProfileScores(answers: Answers): JobProfileScores {
  const axisCounts: Record<Axis, { yes: number; total: number }> = {
    R: { yes: 0, total: 0 },
    E: { yes: 0, total: 0 },
    P: { yes: 0, total: 0 },
    N: { yes: 0, total: 0 },
    A: { yes: 0, total: 0 }
  };

  // Count questions per axis and "yes" answers
  jobConstructionQuestions.forEach((question) => {
    const answer = answers[question.id];
    question.axes.forEach((axis) => {
      axisCounts[axis].total++;
      if (answer === true) {
        axisCounts[axis].yes++;
      }
    });
  });

  // Calculate percentage scores
  const scores: JobProfileScores = {
    R: Math.round((axisCounts.R.yes / axisCounts.R.total) * 100),
    E: Math.round((axisCounts.E.yes / axisCounts.E.total) * 100),
    P: Math.round((axisCounts.P.yes / axisCounts.P.total) * 100),
    N: Math.round((axisCounts.N.yes / axisCounts.N.total) * 100),
    A: Math.round((axisCounts.A.yes / axisCounts.A.total) * 100)
  };

  return scores;
}

/**
 * Get the behavioral classification for a score
 */
export function getScoreClassification(score: number): 'Baixo' | 'Situacional' | 'Alto' {
  if (score <= 33) return 'Baixo';
  if (score <= 67) return 'Situacional';
  return 'Alto';
}

/**
 * Validate questionnaire answers
 */
export function validateAnswers(answers: Answers): {
  isValid: boolean;
  answeredCount: number;
  noCount: number;
  errors: string[];
} {
  const answeredCount = Object.keys(answers).length;
  const noCount = Object.values(answers).filter((v) => v === false).length;
  const errors: string[] = [];

  if (answeredCount < 20) {
    errors.push(`Responda todas as 20 perguntas (${answeredCount}/20)`);
  }

  if (noCount < 5) {
    errors.push(`Mínimo de 5 respostas "Não" necessárias (${noCount}/5)`);
  }

  return {
    isValid: answeredCount === 20 && noCount >= 5,
    answeredCount,
    noCount,
    errors
  };
}
