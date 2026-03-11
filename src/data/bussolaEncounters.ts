export interface BussolaEncounterMeta {
  number: number;
  title: string;
  subtitle: string;
  icon: string;
  preworkTitle?: string;
  preworkItems?: string[];
}

export const BUSSOLA_ENCOUNTERS: BussolaEncounterMeta[] = [
  {
    number: 0,
    title: 'Boas-Vindas',
    subtitle: 'Compromisso com a sua jornada',
    icon: '🌟',
  },
  {
    number: 1,
    title: 'Autoconhecimento e Decisão',
    subtitle: 'Quem sou eu + Qual carreira escolher',
    icon: '🧭',
    preworkTitle: 'Antes do Encontro 1',
    preworkItems: ['Fazer o TOV online'],
  },
  {
    number: 2,
    title: 'Construindo Competências',
    subtitle: 'Mapear gaps e plano de desenvolvimento',
    icon: '🔧',
    preworkTitle: 'Antes do Encontro 2',
    preworkItems: [
      'Entrevistar um profissional da área escolhida',
      'Listar 10 competências necessárias para a carreira',
    ],
  },
  {
    number: 3,
    title: 'Desenhando Caminhos',
    subtitle: '4 rotas de formação e roadmap até os 25 anos',
    icon: '🗺️',
    preworkTitle: 'Antes do Encontro 3',
    preworkItems: [
      'Pesquisar 4 rotas de formação (A, B, C, D)',
      'Preencher formulário Desenhando Caminhos',
    ],
  },
  {
    number: 4,
    title: 'Lidando com Pressão',
    subtitle: 'Mapeamento de pressões, medos e ferramentas de regulação',
    icon: '💪',
    preworkTitle: 'Antes do Encontro 4',
    preworkItems: [
      'Conversar com a família sobre o Roadmap',
      'Listar 3 pressões/medos que você sente',
      'Identificar 1 pensamento sabotador',
    ],
  },
  {
    number: 5,
    title: 'Plano de Ação e Compromissos',
    subtitle: 'Mapa 2026-2027, ações prioritárias e Carta ao Eu do Futuro',
    icon: '🚀',
    preworkTitle: 'Antes do Encontro 5',
    preworkItems: [
      'Revisar todas ferramentas (Encontros 1 a 4)',
      'Preencher Plano de Ação e Carta para o Eu do Futuro',
    ],
  },
];
