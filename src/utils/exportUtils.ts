/**
 * Export utilities for generating CSV and downloading files
 */

export function downloadCSV(data: string, filename: string) {
  const blob = new Blob(['\ufeff' + data], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel UTF-8
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

export function escapeCSV(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  // Escape quotes and wrap in quotes if contains comma, quote, or newline
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function generateCSV(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const headerLine = headers.map(escapeCSV).join(',');
  const dataLines = rows.map(row => row.map(escapeCSV).join(','));
  return [headerLine, ...dataLines].join('\n');
}

// 9Box Matrix Export
export interface Matriz9BoxEntry {
  employee_name: string;
  performance: number;
  potential: number;
  notes: string;
}

export function exportMatriz9Box(entries: Matriz9BoxEntry[]): void {
  const headers = ['Nome', 'Desempenho (Compatibilidade PDA)', 'Potencial (Liderança)', 'Observações'];
  const rows = entries.map(entry => [
    entry.employee_name,
    entry.performance,
    entry.potential,
    entry.notes
  ]);
  const csv = generateCSV(headers, rows);
  downloadCSV(csv, `matriz_9box_${new Date().toISOString().split('T')[0]}.csv`);
}

// Profile Evolution Export
export interface ProfileEvolutionEntry {
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
  notes: string | null;
}

export function exportProfileEvolution(profiles: ProfileEvolutionEntry[]): void {
  const headers = [
    'Colaborador', 'Ano', 
    'Risco (R)', 'Extroversão (E)', 'Paciência (P)', 'Normas (N)', 'Autocontrole (A)',
    'Tomada de Decisões', 'Intensidade do Perfil', 'Energia', 
    'Equilíbrio de Energia', 'Modificação do Perfil', 'Observações'
  ];
  const rows = profiles.map(p => [
    p.employee_name,
    p.year,
    p.r,
    p.e,
    p.p,
    p.n,
    p.a,
    p.tomada_decisoes,
    p.intensidade_perfil,
    p.energia,
    p.equilibrio_energia,
    p.modificacao_perfil,
    p.notes
  ]);
  const csv = generateCSV(headers, rows);
  downloadCSV(csv, `evolucao_perfil_pda_${new Date().toISOString().split('T')[0]}.csv`);
}

// PDI Export
export interface PDIEntry {
  employee_name: string;
  pda_axis: string;
  status: string;
  current_stage: number;
  start_date: string | null;
  target_date: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Rascunho',
  devolutiva: 'Devolutiva',
  construcao: 'Construção',
  acompanhamento: 'Acompanhamento',
  fechamento: 'Fechamento',
  completed: 'Concluído'
};

export function exportPDIs(pdis: PDIEntry[], axisLabels: Record<string, string>): void {
  const headers = ['Colaborador', 'Eixo PDA', 'Status', 'Etapa Atual', 'Data Início', 'Data Meta'];
  const rows = pdis.map(pdi => [
    pdi.employee_name,
    axisLabels[pdi.pda_axis] || pdi.pda_axis,
    STATUS_LABELS[pdi.status] || pdi.status,
    `${pdi.current_stage}/5`,
    pdi.start_date ? new Date(pdi.start_date).toLocaleDateString('pt-BR') : '',
    pdi.target_date ? new Date(pdi.target_date).toLocaleDateString('pt-BR') : ''
  ]);
  const csv = generateCSV(headers, rows);
  downloadCSV(csv, `pdis_${new Date().toISOString().split('T')[0]}.csv`);
}

// Job Construction Result Export
export interface JobProfileScores {
  R: number;
  E: number;
  P: number;
  N: number;
  A: number;
}

function getClassification(score: number): string {
  if (score <= 33) return 'Baixo';
  if (score <= 67) return 'Situacional';
  return 'Alto';
}

export function exportJobProfile(scores: JobProfileScores): void {
  const headers = ['Eixo', 'Descrição', 'Score', 'Classificação'];
  const axisDescriptions: Record<string, string> = {
    R: 'Risco - Orientação para resultados',
    E: 'Extroversão - Sociabilidade e comunicação',
    P: 'Paciência - Estabilidade e constância',
    N: 'Normas - Conformidade e precisão',
    A: 'Autocontrole - Controle emocional'
  };
  
  const rows = (['R', 'E', 'P', 'N', 'A'] as const).map(axis => [
    axis,
    axisDescriptions[axis],
    scores[axis],
    getClassification(scores[axis])
  ]);
  
  const csv = generateCSV(headers, rows);
  downloadCSV(csv, `perfil_cargo_${new Date().toISOString().split('T')[0]}.csv`);
}
