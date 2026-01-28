export type Axis = 'R' | 'E' | 'P' | 'N' | 'A';

export interface JobQuestion {
  id: number;
  question: string;
  axes: Axis[];
}

export const jobConstructionQuestions: JobQuestion[] = [
  {
    id: 1,
    question: "A função exige interação proativa e colaborativa com outras áreas ou departamentos?",
    axes: ['E']
  },
  {
    id: 2,
    question: "É fundamental que a pessoa seja persuasiva, influente ou convincente?",
    axes: ['E', 'R']
  },
  {
    id: 3,
    question: "O trabalho exige conhecimento técnico aprofundado e especializado?",
    axes: ['N']
  },
  {
    id: 4,
    question: "A execução exige alto padrão de excelência, qualidade e atenção aos detalhes?",
    axes: ['N', 'P']
  },
  {
    id: 5,
    question: "O sucesso depende da construção de relacionamentos e comunicação eficaz?",
    axes: ['E', 'A']
  },
  {
    id: 6,
    question: "O cargo exige concentração profunda e atenção aos detalhes por períodos prolongados?",
    axes: ['P', 'N']
  },
  {
    id: 7,
    question: "Envolve exercer liderança direta ou grande responsabilidade sobre processos/pessoas?",
    axes: ['R', 'E']
  },
  {
    id: 8,
    question: "Existem processos claros, regras e procedimentos formais a seguir rigorosamente?",
    axes: ['N', 'P']
  },
  {
    id: 9,
    question: "Há oportunidades de superar desafios e ser reconhecido pelos resultados?",
    axes: ['R']
  },
  {
    id: 10,
    question: "O ocupante recebe feedback estruturado periodicamente sobre desempenho?",
    axes: ['A', 'N']
  },
  {
    id: 11,
    question: "Demanda comunicação constante e interação com diversos grupos?",
    axes: ['E']
  },
  {
    id: 12,
    question: "Inclui atendimento receptivo ao cliente com postura servil e gentil?",
    axes: ['P', 'A']
  },
  {
    id: 13,
    question: "Exige tomar decisões importantes que envolvam assumir riscos calculados?",
    axes: ['R']
  },
  {
    id: 14,
    question: "Exige foco constante em superar desafios e alcançar metas ambiciosas?",
    axes: ['R']
  },
  {
    id: 15,
    question: "Requer ouvir atentamente e transmitir informações de forma calma e paciente?",
    axes: ['P', 'A']
  },
  {
    id: 16,
    question: "O ambiente oferece e valoriza segurança, estabilidade e constância?",
    axes: ['P']
  },
  {
    id: 17,
    question: "Necessário foco na execução precisa e cumprimento de atividades com direcionamento claro?",
    axes: ['N', 'P']
  },
  {
    id: 18,
    question: "Envolve seguir rotinas estabelecidas, planejamento cuidadoso e organização?",
    axes: ['N', 'P']
  },
  {
    id: 19,
    question: "Necessário lidar frequentemente com conflitos, mantendo posicionamento firme?",
    axes: ['R', 'E']
  },
  {
    id: 20,
    question: "Oportunidades frequentes de representar a empresa em reuniões/eventos/apresentações?",
    axes: ['E', 'R']
  }
];

export const axisLabels: Record<Axis, string> = {
  R: 'Risco',
  E: 'Extroversão',
  P: 'Paciência',
  N: 'Normas',
  A: 'Autocontrole'
};

export const axisDescriptions: Record<Axis, string> = {
  R: 'Orientação para resultados, competitividade e tomada de decisão',
  E: 'Sociabilidade, comunicação e influência interpessoal',
  P: 'Estabilidade, constância e ritmo de trabalho',
  N: 'Conformidade com regras, precisão e atenção aos detalhes',
  A: 'Controle emocional e autogestão'
};
