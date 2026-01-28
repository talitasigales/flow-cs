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
 * Rules:
 * 1. R + E + P + N must sum to 200
 * 2. At least one axis must be 0 or 100
 * 3. Autocontrole (A) is always fixed at 50 (situational/balanced)
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

  // Calculate raw percentage scores for REPN (excluding A)
  const rawScores = {
    R: (axisCounts.R.yes / axisCounts.R.total) * 100,
    E: (axisCounts.E.yes / axisCounts.E.total) * 100,
    P: (axisCounts.P.yes / axisCounts.P.total) * 100,
    N: (axisCounts.N.yes / axisCounts.N.total) * 100
  };

  // Normalize REPN scores to sum to 200
  const normalizedScores = normalizeToSum200(rawScores);

  // Final scores with A fixed at 50
  const scores: JobProfileScores = {
    R: normalizedScores.R,
    E: normalizedScores.E,
    P: normalizedScores.P,
    N: normalizedScores.N,
    A: 50 // Always 50 (situational - emotional balance)
  };

  return scores;
}

/**
 * Normalize REPN scores to sum to 200, ensuring at least one 0 or 100
 */
function normalizeToSum200(rawScores: { R: number; E: number; P: number; N: number }): { R: number; E: number; P: number; N: number } {
  const axes: ('R' | 'E' | 'P' | 'N')[] = ['R', 'E', 'P', 'N'];
  const rawSum = rawScores.R + rawScores.E + rawScores.P + rawScores.N;
  
  // If raw sum is 0, distribute equally (50 each)
  if (rawSum === 0) {
    return { R: 50, E: 50, P: 50, N: 50 };
  }

  // Scale scores proportionally to sum to 200
  const scaleFactor = 200 / rawSum;
  let scaled = {
    R: rawScores.R * scaleFactor,
    E: rawScores.E * scaleFactor,
    P: rawScores.P * scaleFactor,
    N: rawScores.N * scaleFactor
  };

  // Find the highest and lowest scoring axes
  let maxAxis: 'R' | 'E' | 'P' | 'N' = 'R';
  let minAxis: 'R' | 'E' | 'P' | 'N' = 'R';
  
  axes.forEach(axis => {
    if (scaled[axis] > scaled[maxAxis]) maxAxis = axis;
    if (scaled[axis] < scaled[minAxis]) minAxis = axis;
  });

  // Round scores
  let rounded = {
    R: Math.round(scaled.R),
    E: Math.round(scaled.E),
    P: Math.round(scaled.P),
    N: Math.round(scaled.N)
  };

  // Ensure at least one 0 or 100 exists
  const hasZeroOrHundred = axes.some(axis => rounded[axis] === 0 || rounded[axis] === 100);
  
  if (!hasZeroOrHundred) {
    // Push the most extreme value to 0 or 100
    if (scaled[maxAxis] >= 50) {
      // Push highest to 100
      const diff = 100 - rounded[maxAxis];
      rounded[maxAxis] = 100;
      // Distribute the difference to other axes proportionally
      const otherAxes = axes.filter(a => a !== maxAxis);
      const otherSum = otherAxes.reduce((sum, a) => sum + rounded[a], 0);
      otherAxes.forEach(axis => {
        const proportion = otherSum > 0 ? rounded[axis] / otherSum : 1 / 3;
        rounded[axis] = Math.max(0, Math.round(rounded[axis] - (diff * proportion)));
      });
    } else {
      // Push lowest to 0
      const diff = rounded[minAxis];
      rounded[minAxis] = 0;
      // Distribute the difference to other axes
      const otherAxes = axes.filter(a => a !== minAxis);
      const otherSum = otherAxes.reduce((sum, a) => sum + rounded[a], 0);
      otherAxes.forEach(axis => {
        const proportion = otherSum > 0 ? rounded[axis] / otherSum : 1 / 3;
        rounded[axis] = Math.min(100, Math.round(rounded[axis] + (diff * proportion)));
      });
    }
  }

  // Adjust to ensure exact sum of 200
  let currentSum = rounded.R + rounded.E + rounded.P + rounded.N;
  let adjustment = 200 - currentSum;
  
  // Apply adjustment to the axis closest to 50 (least extreme) that won't break bounds
  if (adjustment !== 0) {
    const sortedByClosenessTo50 = [...axes].sort((a, b) => 
      Math.abs(rounded[a] - 50) - Math.abs(rounded[b] - 50)
    );
    
    for (const axis of sortedByClosenessTo50) {
      const newValue = rounded[axis] + adjustment;
      if (newValue >= 0 && newValue <= 100) {
        rounded[axis] = newValue;
        break;
      }
    }
  }

  // Clamp all values to 0-100
  axes.forEach(axis => {
    rounded[axis] = Math.max(0, Math.min(100, rounded[axis]));
  });

  return rounded;
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
