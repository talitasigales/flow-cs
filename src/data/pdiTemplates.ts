export interface PDAAxis {
  name: string;
  icon: string;
  color: string;
  description: string;
  behaviors: string[];
  developmentExamples: string[];
  reflectiveQuestions: string[];
  oppositeAxis: string;
}

export const PDA_AXES: Record<string, PDAAxis> = {
  risco_alto: {
    name: 'Risco Alto',
    icon: 'TrendingUp',
    color: 'hsl(25, 95%, 53%)', // Orange
    description: 'Para perfis com alta tolerância ao risco e orientação para resultados',
    behaviors: [
      'Costumo tomar decisões rapidamente, sem analisar adequadamente prós e contras.',
      'Minha postura direta, confrontativa e pouco diplomática me gera prejuízos nas relações.',
      'Por ter uma visão global, posso não dar atenção devida aos detalhes.',
      'Na busca por novos desafios, posso me descuidar do acompanhamento e do processo.',
      'Minha necessidade de conseguir resultados com velocidade, faz com que pressione as pessoas ao invés de envolvê-las.'
    ],
    developmentExamples: [
      'Analisar com mais cuidado fatos e dados para tomada de decisões',
      'Ser mais diplomático(a) e cordial na abordagem com pessoas',
      'Dar atenção aos detalhes',
      'Estabelecer e seguir processos',
      'Envolver as pessoas para que juntos possam alcançar resultados'
    ],
    reflectiveQuestions: [
      'Descreva situações em que os comportamentos de pontuação mais alta trouxeram prejuízos para sua performance no trabalho.',
      'Você se recorda de alguma situação que sentiu que flexibilizou seus comportamentos relacionados ao Risco alto? O que lhe motivou a ter esse comportamento?',
      'Liste pessoas próximas que tem um perfil de Risco baixo e podem ajudar e mentorar você para enfrentar desafios.'
    ],
    oppositeAxis: 'risco_baixo'
  },
  risco_baixo: {
    name: 'Risco Baixo',
    icon: 'TrendingDown',
    color: 'hsl(25, 95%, 53%)', // Orange
    description: 'Para perfis cautelosos e orientados para análise detalhada',
    behaviors: [
      'Sinto que demoro para tomar decisões, necessito me certificar de muitos dados e fatos para conseguir prosseguir.',
      'Percebo que preciso ter uma comunicação mais assertiva e direta.',
      'Encontro dificuldades de posicionar e defender minhas ideias e opiniões.',
      'Novos desafios me geram certo grau de desconforto, tendo a evitá-los.',
      'Posso não ter uma orientação tão focada em metas e resultados.'
    ],
    developmentExamples: [
      'Ser menos cauteloso na tomada de decisões',
      'Ser mais direto e assertivo na abordagem com pessoas',
      'Conseguir posicionar ideias e opiniões contrárias com facilidade',
      'Estar mais aberto a assumir novos desafios',
      'Aumentar a capacidade de focar-se em metas e resultados'
    ],
    reflectiveQuestions: [
      'Descreva situações em que os comportamentos de pontuação mais alta trouxeram prejuízos para sua performance no trabalho.',
      'Você se recorda de alguma situação que conseguiu flexibilizar esses comportamentos relacionados ao Risco baixo? O que lhe motivou a ter esse comportamento?',
      'Liste pessoas próximas que têm um perfil de Risco alto e podem ajudar e mentorar você para enfrentar desafios.'
    ],
    oppositeAxis: 'risco_alto'
  },
  extroversao_alta: {
    name: 'Extroversão Alta',
    icon: 'Users',
    color: 'hsl(45, 93%, 47%)', // Yellow
    description: 'Para perfis sociáveis e comunicativos',
    behaviors: [
      'Sinto que perco o foco com facilidade, me distraio facilmente.',
      'Acho difícil me concentrar em análises profundas de temas, planilhas ou dados.',
      'Ser muito verbal faz com que fale mais e escute menos.',
      'A minha necessidade de popularidade me faz ter dificuldade de dizer não.',
      'Ser muito entusiasmado(a) e otimista faz com que as vezes não preveja problemas potenciais.'
    ],
    developmentExamples: [
      'Aumentar o foco e capacidade de concentração',
      'Ser mais criterioso e analítico ao tomar uma decisão',
      'Aumentar a capacidade de escuta',
      'Dizer não para pessoas próximas',
      'Conseguir ser mais observador nas interações com as pessoas'
    ],
    reflectiveQuestions: [
      'Descreva situações em que os comportamentos de pontuação mais alta trouxeram prejuízos para sua performance no trabalho.',
      'Você se recorda de alguma situação que conseguiu flexibilizar esses comportamentos relacionados a Extroversão alta? O que lhe motivou a ter esse comportamento?',
      'Liste pessoas próximas que têm um perfil de Extroversão baixa e podem ajudar e mentorar você para enfrentar desafios.'
    ],
    oppositeAxis: 'extroversao_baixa'
  },
  extroversao_baixa: {
    name: 'Extroversão Baixa',
    icon: 'User',
    color: 'hsl(45, 93%, 47%)', // Yellow
    description: 'Para perfis reservados e discretos',
    behaviors: [
      'Por ser discreto, tenho dificuldade de tomar a iniciativa de iniciar uma conversa.',
      'Sinto que minha timidez faz com que deixe de expressar corretamente minhas ideias e opiniões.',
      'Interajo pouco porque muitas vezes acho as conversas superficiais.',
      'Percebo que tenho dificuldade em convencer e influenciar as pessoas sobre um produto, ideia ou projeto.',
      'Prefiro trabalhar sozinho do que construir ideias e projetos em grupo.'
    ],
    developmentExamples: [
      'Abrir-se para se relacionar com pessoas novas',
      'Tomar a iniciativa para iniciar uma conversa',
      'Capacidade de expor facilmente ideias e opiniões',
      'Argumentar de forma persuasiva sobre algo que deseja convencer alguém',
      'Capacidade de se expressar em grupos maiores'
    ],
    reflectiveQuestions: [
      'Descreva situações em que os comportamentos de pontuação mais alta trouxeram prejuízos para sua performance no trabalho.',
      'Você se recorda de alguma situação que conseguiu flexibilizar esses comportamentos relacionados a Extroversão baixa? O que lhe motivou a ter esse comportamento?',
      'Liste pessoas próximas que têm um perfil de Extroversão alta e podem ajudar e mentorar você para enfrentar desafios.'
    ],
    oppositeAxis: 'extroversao_alta'
  },
  paciencia_alta: {
    name: 'Paciência Alta',
    icon: 'Clock',
    color: 'hsl(217, 91%, 60%)', // Blue
    description: 'Para perfis pacientes e orientados para estabilidade',
    behaviors: [
      'Fico frustrado(a) ou ansioso(a) quando confrontado(a) com a mudança.',
      'Acho difícil lidar com muitas tarefas ou atividades ao mesmo tempo.',
      'Quando estou sob pressão me sinto muito desconfortável e posso cometer erros.',
      'Percebo que sou tolerante demais e não faço minha opinião prevalecer.',
      'Me sinto desmotivado(a) quando não há um planejamento claro ou algum grau de previsibilidade.'
    ],
    developmentExamples: [
      'Encarar a mudança com uma perspectiva positiva',
      'Conseguir assumir uma diversidade maior de tarefas ou um projeto novo',
      'Assumir um ritmo mais dinâmico ou móvel de trabalho',
      'Reduzir a tolerância conseguindo se posicionar perante as pessoas',
      'Adaptar-se melhor a ambientes imprevisíveis'
    ],
    reflectiveQuestions: [
      'Descreva situações em que os comportamentos de pontuação mais alta trouxeram prejuízos para sua performance no trabalho.',
      'Você se recorda de alguma situação que conseguiu flexibilizar esses comportamentos relacionados a Paciência alta? O que lhe motivou a ter esse comportamento?',
      'Liste pessoas próximas que têm um perfil de Paciência baixa e podem ajudar e mentorar você para enfrentar desafios.'
    ],
    oppositeAxis: 'paciencia_baixa'
  },
  paciencia_baixa: {
    name: 'Paciência Baixa',
    icon: 'Zap',
    color: 'hsl(217, 91%, 60%)', // Blue
    description: 'Para perfis dinâmicos e orientados para ação',
    behaviors: [
      'Fico irritado(a) ou ansioso(a) quando as coisas não acontecem no meu ritmo.',
      'Acho difícil lidar com tarefas que exijam planejamento ou previsibilidade.',
      'Quando estou diante de atividades repetitivas ou rotineiras, me desmotivo.',
      'Sinto que tenho dificuldade de escuta.',
      'Encontro dificuldade em organizar minha agenda e meu tempo para dar conta de todas as minhas atividades.'
    ],
    developmentExamples: [
      'Ser mais tolerante com o tempo e ritmo do outro',
      'Conseguir desenvolver uma escuta ativa',
      'Desenvolver a capacidade de planejar antes de ir para ação',
      'Organizar-se melhor diante das diversas demandas',
      'Estabelecer uma rotina que traga constância e finalização aos seus projetos'
    ],
    reflectiveQuestions: [
      'Descreva situações em que os comportamentos de pontuação mais alta trouxeram prejuízos para sua performance no trabalho.',
      'Você se recorda de alguma situação que conseguiu flexibilizar esses comportamentos relacionados a Paciência baixa? O que lhe motivou a ter esse comportamento?',
      'Liste pessoas próximas que tem um perfil de Paciência alta e podem ajudar e mentorar você para enfrentar desafios.'
    ],
    oppositeAxis: 'paciencia_alta'
  },
  normas_altas: {
    name: 'Normas Altas',
    icon: 'Shield',
    color: 'hsl(142, 71%, 45%)', // Green
    description: 'Para perfis orientados para regras e procedimentos',
    behaviors: [
      'Fico frustrado(a) ou ansioso(a) quando as normas e regras não estão sendo cumpridas.',
      'Acho difícil desviar da estrutura rígida que sigo quando faço as coisas.',
      'Minha preocupação com detalhes faz com que demore mais para fazer entregas ou com que eu perca prazos.',
      'Me sinto perdido em ambientes que não tenham diretrizes claras.',
      'Acho difícil aceitar quando as regras devem mudar e posso ficar frustrado(a).'
    ],
    developmentExamples: [
      'Autonomia para definir processos e para ação',
      'Reduzir atenção aos detalhes',
      'Aumentar a visão global',
      'Criar objetivos e metas próprias',
      'Desprender-se de padrões aumentando a criatividade e inovação'
    ],
    reflectiveQuestions: [
      'Descreva situações em que os comportamentos de pontuação mais alta trouxeram prejuízos para sua performance no trabalho.',
      'Você se recorda de alguma situação que conseguiu flexibilizar esses comportamentos relacionados as Normas altas? O que lhe motivou a ter esse comportamento?',
      'Liste pessoas próximas que tem um perfil de Normas baixas e podem ajudar e mentorar você para enfrentar desafios.'
    ],
    oppositeAxis: 'normas_baixas'
  },
  normas_baixas: {
    name: 'Normas Baixas',
    icon: 'Lightbulb',
    color: 'hsl(142, 71%, 45%)', // Green
    description: 'Para perfis autônomos e inovadores',
    behaviors: [
      'Fico frustrado(a) quando não tenho liberdade de questionar ou criar minhas próprias regras.',
      'Minha dificuldade em seguir normas pré-estabelecidas traz alguns prejuízos para o cumprimento do meu trabalho.',
      'Minha visão global faz com que, por vezes, não dê atenção a detalhes importantes de uma tarefa ou projeto.',
      'Depender de outra pessoa ou de um superior para agir me gera frustração.',
      'Acho difícil aceitar algumas regras impostas e posso ficar desmotivado(a).'
    ],
    developmentExamples: [
      'Aumentar a atenção aos detalhes e a qualidade',
      'Desenvolver a capacidade de seguir normas ou regras que sejam primordiais para execução do seu trabalho',
      'Aprofundar-se em questões técnicas relacionadas a sua entrega',
      'Respeitar processos estabelecidos',
      'Trabalhar em colaboração com equipes e hierarquias'
    ],
    reflectiveQuestions: [
      'Descreva situações em que os comportamentos de pontuação mais alta trouxeram prejuízos para sua performance no trabalho.',
      'Você se recorda de alguma situação que conseguiu flexibilizar esses comportamentos relacionados as Normas baixas? O que lhe motivou a ter esse comportamento?',
      'Liste pessoas próximas que tem um perfil de Normas altas e podem ajudar e mentorar você para enfrentar desafios.'
    ],
    oppositeAxis: 'normas_altas'
  }
};

export interface GuideStep {
  number: number;
  title: string;
  description: string;
  tips: string[];
}

export const PDI_GUIDE: {
  steps: GuideStep[];
  methodology: {
    smart: {
      title: string;
      description: string;
      items: Array<{ letter: string; title: string; description: string }>;
    };
    learning70_20_10: {
      title: string;
      description: string;
      distribution: Array<{ percentage: string; title: string; description: string; actions: string }>;
    };
  };
  followUpQuestions: string[];
  closureQuestions: string[];
} = {
  steps: [
    {
      number: 1,
      title: 'Compatibilidade com o Cargo',
      description: 'Realizar o mapeamento dos comportamentos compatíveis e não compatíveis do colaborador com o cargo atual para que seja um norteador do PDI.',
      tips: [
        'Essa etapa é muito recomendável para que se tenha clareza dos comportamentos desejados para cada posição.',
        'Para realizar esta etapa é necessário um mapeamento prévio de todos os comportamentos desejados para o cargo, que deve ser realizado pelo gestor do cargo e RH.',
        'Possuir a capacitação necessária para construção de cargo dentro da plataforma PDA.'
      ]
    },
    {
      number: 2,
      title: 'Devolutiva PDA',
      description: 'Promover o autoconhecimento a partir do relatório individual mais o relatório de compatibilidade com o cargo para alinhar expectativas e conscientizar sobre o Eixo comportamental que necessita desenvolvimento.',
      tips: [
        'Inicie com a devolutiva apenas do perfil, focando nos indicadores do gráfico.',
        'Faça perguntas para promover o autoconhecimento:',
        '• O que você faz hoje que lhe gera mais satisfação e não exige grande esforço?',
        '• O que lhe gera maior desconforto ou lhe gera mais esforço na sua rotina de trabalho?',
        '• O que você gostaria de desenvolver que acredita que irá contribuir para o seu desenvolvimento na posição atual?',
        'Após ter apresentado todo o perfil e o colaborador ter validado as informações, apresente o relatório de compatibilidade com o cargo destacando as áreas (Eixos) com menor compatibilidade.',
        'Faça perguntas para alinhar as expectativas de desenvolvimento:',
        '• Analisando o perfil do seu cargo, quais são as suas maiores dificuldades?',
        '• Em que situações esse comportamento fica mais evidente?',
        '• Quais são seus pontos a serem melhorados (principais limitadores)?',
        'Oriente que o colaborador reflita sobre todos os pontos levantados e se observe até o próximo encontro.'
      ]
    },
    {
      number: 3,
      title: 'Construção do Plano',
      description: 'Identificar o comportamento específico que precisa ser desenvolvido a partir da escolha do Eixo comportamental e construir o plano de ação. Aplicação do instrumento do PDI.',
      tips: [
        'Utilize os modelos de PDI específicos para cada eixo comportamental.',
        'Realize a autoavaliação dos 5 comportamentos predominantes.',
        'Responda às perguntas reflexivas para aprofundar o autoconhecimento.',
        'Identifique mentores que possam apoiar o desenvolvimento.',
        'Defina objetivos SMART e ações usando a metodologia 70|20|10.'
      ]
    },
    {
      number: 4,
      title: 'Acompanhamento',
      description: 'Realizar check-ins periódicos para avaliar progresso, identificar obstáculos e ajustar o plano conforme necessário.',
      tips: [
        'Recomendamos realizar 2 sessões de acompanhamento durante o período do PDI.',
        'Use as perguntas norteadoras para estruturar o check-in.',
        'Documente os aprendizados e ajustes necessários.',
        'Celebre as conquistas e reconheça os esforços.',
        'Mantenha o foco no desenvolvimento comportamental, não apenas em resultados.'
      ]
    },
    {
      number: 5,
      title: 'Fechamento',
      description: 'Avaliar os resultados alcançados, reconhecer o crescimento e planejar os próximos passos do desenvolvimento contínuo.',
      tips: [
        'Realize uma avaliação honesta do processo e dos resultados.',
        'Reconheça e celebre os progressos, mesmo os pequenos.',
        'Identifique aprendizados que podem ser aplicados em outras áreas.',
        'Defina próximos passos para manter o desenvolvimento contínuo.',
        'Documente os ganhos e competências desenvolvidas.'
      ]
    }
  ],
  methodology: {
    smart: {
      title: 'Metodologia SMART',
      description: 'Para definir objetivos e ações de forma clara e alcançável',
      items: [
        {
          letter: 'S',
          title: 'eSpecífica',
          description: 'Especifique em detalhes o que você irá fazer.'
        },
        {
          letter: 'M',
          title: 'Mensurável',
          description: 'Tenha critérios definidos para medir seu progresso em direção a meta.'
        },
        {
          letter: 'A',
          title: 'Alcançável',
          description: 'Certifique-se que de que sua ação é atingível.'
        },
        {
          letter: 'R',
          title: 'Relevante',
          description: 'Seu objetivo deve ser importante e realista em relação a meta definida.'
        },
        {
          letter: 'T',
          title: 'Temporal',
          description: 'Estipule uma frequência e um prazo claramente definido, incluindo data de início e fim.'
        }
      ]
    },
    learning70_20_10: {
      title: 'Modelo 70|20|10',
      description: 'Distribuição recomendada para o aprendizado e desenvolvimento',
      distribution: [
        {
          percentage: '70%',
          title: 'Experiências e Vivências',
          description: 'A partir de experiências próprias e vivências do cotidiano: ações e práticas dos novos comportamentos',
          actions: '2 a 3 ações'
        },
        {
          percentage: '20%',
          title: 'Aprendizado Social',
          description: 'A partir do aprendizado através da interação com o outro: consulte e solicite apoio do(s) mentor(es) escolhidos como referência',
          actions: '1 ação'
        },
        {
          percentage: '10%',
          title: 'Aprendizado Formal',
          description: 'A partir do aprendizado formal: através de conteúdos disponíveis em livros, vídeos, cursos',
          actions: '1 ação'
        }
      ]
    }
  },
  followUpQuestions: [
    'O que deu certo?',
    'Qual foi o melhor momento?',
    'O que não deu certo?',
    'Quais foram os obstáculos?',
    'Qual foi seu maior esforço?',
    'O que/quem pode ajudar?',
    'Novas ideias de ação?'
  ],
  closureQuestions: [
    'Como está finalizando?',
    'Quais foram seus maiores aprendizados?',
    'O que realizou?',
    'O que não conseguiu realizar?',
    'Qual sua nota de satisfação (0-100)?',
    'O que faltou para chegar a 100%?',
    'O que fazer a partir de agora?',
    'Quais ganhos obteve?',
    'O que ainda precisa desenvolver?'
  ]
};
