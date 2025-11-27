import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Iniciando atualização completa da base de conhecimento...');

    // Limpar registros antigos (exceto o placeholder)
    const { error: deleteError } = await supabase
      .from('knowledge_base')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (deleteError) {
      console.error('Erro ao limpar base:', deleteError);
      throw deleteError;
    }

    // Base de conhecimento completa
    const knowledgeData = [
      // ========== EIXOS COMPORTAMENTAIS ==========
      {
        title: 'Os 5 Eixos REPNA do PDA',
        category: 'Fundamentos',
        content: `O PDA Assessment avalia 5 eixos comportamentais fundamentais, conhecidos pela sigla REPNA:

**R - RISCO**: Avalia a propensão a assumir riscos e buscar desafios
• Risco ALTO: Perfis arrojados, competitivos, diretos e orientados para resultados. Gostam de desafios e tomam decisões rapidamente.
• Risco BAIXO: Perfis cautelosos, diplomáticos, analíticos e ponderados. Preferem analisar bem antes de tomar decisões.

**E - EXTROVERSÃO**: Mede o grau de interação e necessidade de socialização
• Extroversão ALTA: Perfis sociáveis, comunicativos, entusiasmados e expressivos. Energizam-se com interações sociais.
• Extroversão BAIXA: Perfis reservados, discretos, observadores e introspectivos. Preferem interações mais profundas e individuais.

**P - PACIÊNCIA**: Avalia o ritmo de trabalho e capacidade de adaptação
• Paciência ALTA: Perfis pacientes, estáveis, colaborativos e previsíveis. Preferem rotinas e mudanças graduais.
• Paciência BAIXA: Perfis dinâmicos, impulsivos, ágeis e multitarefas. Gostam de variedade e mudanças rápidas.

**N - NORMAS**: Mede a receptividade a regras e procedimentos
• Normas ALTAS: Perfis metódicos, estruturados, detalhistas e sistemáticos. Valorizam processos e qualidade.
• Normas BAIXAS: Perfis independentes, inovadores, criativos e flexíveis. Preferem autonomia e liberdade.

**A - AUTOCONTROLE**: Avalia a inteligência emocional e controle de impulsos
• Autocontrole ALTO: Perfis lógicos, racionais, objetivos e controlados emocionalmente.
• Autocontrole BAIXO: Perfis emocionais, expressivos, passionais e intensos nos sentimentos.`,
        keywords: ['REPNA', 'eixos', 'risco', 'extroversão', 'paciência', 'normas', 'autocontrole', 'PDA', 'comportamento']
      },

      // ========== 8 MODELOS DE PDI ==========
      {
        title: 'PDI - Modelo Risco Alto',
        category: 'Modelos PDI',
        content: `**PERFIL**: Para pessoas com alta tolerância ao risco, orientadas para resultados, arrojadas e competitivas.

**5 COMPORTAMENTOS A DESENVOLVER**:
1. Costumo tomar decisões rapidamente, sem analisar adequadamente prós e contras
2. Minha postura direta, confrontativa e pouco diplomática me gera prejuízos nas relações
3. Por ter uma visão global, posso não dar atenção devida aos detalhes
4. Na busca por novos desafios, posso me descuidar do acompanhamento e do processo
5. Minha necessidade de conseguir resultados com velocidade, faz com que pressione as pessoas ao invés de envolvê-las

**EXEMPLOS DE DESENVOLVIMENTO**:
• Analisar com mais cuidado fatos e dados para tomada de decisões
• Ser mais diplomático(a) e cordial na abordagem com pessoas
• Dar atenção aos detalhes
• Estabelecer e seguir processos
• Envolver as pessoas para que juntos possam alcançar resultados

**PERGUNTAS REFLEXIVAS**:
• Descreva situações em que os comportamentos de pontuação mais alta trouxeram prejuízos para sua performance no trabalho
• Você se recorda de alguma situação que sentiu que flexibilizou seus comportamentos relacionados ao Risco alto? O que lhe motivou?
• Liste pessoas próximas que tem um perfil de Risco baixo e podem ajudar e mentorar você`,
        keywords: ['PDI', 'risco alto', 'arrojado', 'competitivo', 'desenvolvimento', 'comportamento']
      },
      {
        title: 'PDI - Modelo Risco Baixo',
        category: 'Modelos PDI',
        content: `**PERFIL**: Para pessoas cautelosas, diplomáticas, analíticas e orientadas para análise detalhada.

**5 COMPORTAMENTOS A DESENVOLVER**:
1. Sinto que demoro para tomar decisões, necessito me certificar de muitos dados e fatos para conseguir prosseguir
2. Percebo que preciso ter uma comunicação mais assertiva e direta
3. Encontro dificuldades de posicionar e defender minhas ideias e opiniões
4. Novos desafios me geram certo grau de desconforto, tendo a evitá-los
5. Posso não ter uma orientação tão focada em metas e resultados

**EXEMPLOS DE DESENVOLVIMENTO**:
• Ser menos cauteloso na tomada de decisões
• Ser mais direto e assertivo na abordagem com pessoas
• Conseguir posicionar ideias e opiniões contrárias com facilidade
• Estar mais aberto a assumir novos desafios
• Aumentar a capacidade de focar-se em metas e resultados

**PERGUNTAS REFLEXIVAS**:
• Descreva situações em que os comportamentos de pontuação mais alta trouxeram prejuízos para sua performance no trabalho
• Você se recorda de alguma situação que conseguiu flexibilizar esses comportamentos relacionados ao Risco baixo? O que lhe motivou?
• Liste pessoas próximas que têm um perfil de Risco alto e podem ajudar e mentorar você`,
        keywords: ['PDI', 'risco baixo', 'cauteloso', 'analítico', 'desenvolvimento', 'comportamento']
      },
      {
        title: 'PDI - Modelo Extroversão Alta',
        category: 'Modelos PDI',
        content: `**PERFIL**: Para pessoas sociáveis, comunicativas, entusiasmadas e expressivas.

**5 COMPORTAMENTOS A DESENVOLVER**:
1. Sinto que perco o foco com facilidade, me distraio facilmente
2. Acho difícil me concentrar em análises profundas de temas, planilhas ou dados
3. Ser muito verbal faz com que fale mais e escute menos
4. A minha necessidade de popularidade me faz ter dificuldade de dizer não
5. Ser muito entusiasmado(a) e otimista faz com que as vezes não preveja problemas potenciais

**EXEMPLOS DE DESENVOLVIMENTO**:
• Aumentar o foco e capacidade de concentração
• Ser mais criterioso e analítico ao tomar uma decisão
• Aumentar a capacidade de escuta
• Dizer não para pessoas próximas
• Conseguir ser mais observador nas interações com as pessoas

**PERGUNTAS REFLEXIVAS**:
• Descreva situações em que os comportamentos de pontuação mais alta trouxeram prejuízos para sua performance no trabalho
• Você se recorda de alguma situação que conseguiu flexibilizar esses comportamentos relacionados a Extroversão alta? O que lhe motivou?
• Liste pessoas próximas que têm um perfil de Extroversão baixa e podem ajudar e mentorar você`,
        keywords: ['PDI', 'extroversão alta', 'sociável', 'comunicativo', 'desenvolvimento', 'comportamento']
      },
      {
        title: 'PDI - Modelo Extroversão Baixa',
        category: 'Modelos PDI',
        content: `**PERFIL**: Para pessoas reservadas, discretas, observadoras e introspectivas.

**5 COMPORTAMENTOS A DESENVOLVER**:
1. Por ser discreto, tenho dificuldade de tomar a iniciativa de iniciar uma conversa
2. Sinto que minha timidez faz com que deixe de expressar corretamente minhas ideias e opiniões
3. Interajo pouco porque muitas vezes acho as conversas superficiais
4. Percebo que tenho dificuldade em convencer e influenciar as pessoas sobre um produto, ideia ou projeto
5. Prefiro trabalhar sozinho do que construir ideias e projetos em grupo

**EXEMPLOS DE DESENVOLVIMENTO**:
• Abrir-se para se relacionar com pessoas novas
• Tomar a iniciativa para iniciar uma conversa
• Capacidade de expor facilmente ideias e opiniões
• Argumentar de forma persuasiva sobre algo que deseja convencer alguém
• Capacidade de se expressar em grupos maiores

**PERGUNTAS REFLEXIVAS**:
• Descreva situações em que os comportamentos de pontuação mais alta trouxeram prejuízos para sua performance no trabalho
• Você se recorda de alguma situação que conseguiu flexibilizar esses comportamentos relacionados a Extroversão baixa? O que lhe motivou?
• Liste pessoas próximas que têm um perfil de Extroversão alta e podem ajudar e mentorar você`,
        keywords: ['PDI', 'extroversão baixa', 'reservado', 'discreto', 'desenvolvimento', 'comportamento']
      },
      {
        title: 'PDI - Modelo Paciência Alta',
        category: 'Modelos PDI',
        content: `**PERFIL**: Para pessoas pacientes, estáveis, colaborativas e que valorizam previsibilidade.

**5 COMPORTAMENTOS A DESENVOLVER**:
1. Fico frustrado(a) ou ansioso(a) quando confrontado(a) com a mudança
2. Acho difícil lidar com muitas tarefas ou atividades ao mesmo tempo
3. Quando estou sob pressão me sinto muito desconfortável e posso cometer erros
4. Percebo que sou tolerante demais e não faço minha opinião prevalecer
5. Me sinto desmotivado(a) quando não há um planejamento claro ou algum grau de previsibilidade

**EXEMPLOS DE DESENVOLVIMENTO**:
• Encarar a mudança com uma perspectiva positiva
• Conseguir assumir uma diversidade maior de tarefas ou um projeto novo
• Assumir um ritmo mais dinâmico ou móvel de trabalho
• Reduzir a tolerância conseguindo se posicionar perante as pessoas
• Adaptar-se melhor a ambientes imprevisíveis

**PERGUNTAS REFLEXIVAS**:
• Descreva situações em que os comportamentos de pontuação mais alta trouxeram prejuízos para sua performance no trabalho
• Você se recorda de alguma situação que conseguiu flexibilizar esses comportamentos relacionados a Paciência alta? O que lhe motivou?
• Liste pessoas próximas que têm um perfil de Paciência baixa e podem ajudar e mentorar você`,
        keywords: ['PDI', 'paciência alta', 'paciente', 'estável', 'desenvolvimento', 'comportamento']
      },
      {
        title: 'PDI - Modelo Paciência Baixa',
        category: 'Modelos PDI',
        content: `**PERFIL**: Para pessoas dinâmicas, ágeis, impulsivas e orientadas para ação.

**5 COMPORTAMENTOS A DESENVOLVER**:
1. Fico irritado(a) ou ansioso(a) quando as coisas não acontecem no meu ritmo
2. Acho difícil lidar com tarefas que exijam planejamento ou previsibilidade
3. Quando estou diante de atividades repetitivas ou rotineiras, me desmotivo
4. Sinto que tenho dificuldade de escuta
5. Encontro dificuldade em organizar minha agenda e meu tempo para dar conta de todas as minhas atividades

**EXEMPLOS DE DESENVOLVIMENTO**:
• Ser mais tolerante com o tempo e ritmo do outro
• Conseguir desenvolver uma escuta ativa
• Desenvolver a capacidade de planejar antes de ir para ação
• Organizar-se melhor diante das diversas demandas
• Estabelecer uma rotina que traga constância e finalização aos seus projetos

**PERGUNTAS REFLEXIVAS**:
• Descreva situações em que os comportamentos de pontuação mais alta trouxeram prejuízos para sua performance no trabalho
• Você se recorda de alguma situação que conseguiu flexibilizar esses comportamentos relacionados a Paciência baixa? O que lhe motivou?
• Liste pessoas próximas que tem um perfil de Paciência alta e podem ajudar e mentorar você`,
        keywords: ['PDI', 'paciência baixa', 'dinâmico', 'impulsivo', 'desenvolvimento', 'comportamento']
      },
      {
        title: 'PDI - Modelo Normas Altas',
        category: 'Modelos PDI',
        content: `**PERFIL**: Para pessoas metódicas, estruturadas, detalhistas e orientadas para procedimentos.

**5 COMPORTAMENTOS A DESENVOLVER**:
1. Fico frustrado(a) ou ansioso(a) quando as normas e regras não estão sendo cumpridas
2. Acho difícil desviar da estrutura rígida que sigo quando faço as coisas
3. Minha preocupação com detalhes faz com que demore mais para fazer entregas ou com que eu perca prazos
4. Me sinto perdido em ambientes que não tenham diretrizes claras
5. Acho difícil aceitar quando as regras devem mudar e posso ficar frustrado(a)

**EXEMPLOS DE DESENVOLVIMENTO**:
• Autonomia para definir processos e para ação
• Reduzir atenção aos detalhes
• Aumentar a visão global
• Criar objetivos e metas próprias
• Desprender-se de padrões aumentando a criatividade e inovação

**PERGUNTAS REFLEXIVAS**:
• Descreva situações em que os comportamentos de pontuação mais alta trouxeram prejuízos para sua performance no trabalho
• Você se recorda de alguma situação que conseguiu flexibilizar esses comportamentos relacionados as Normas altas? O que lhe motivou?
• Liste pessoas próximas que tem um perfil de Normas baixas e podem ajudar e mentorar você`,
        keywords: ['PDI', 'normas altas', 'metódico', 'estruturado', 'desenvolvimento', 'comportamento']
      },
      {
        title: 'PDI - Modelo Normas Baixas',
        category: 'Modelos PDI',
        content: `**PERFIL**: Para pessoas autônomas, inovadoras, criativas e que valorizam liberdade.

**5 COMPORTAMENTOS A DESENVOLVER**:
1. Fico frustrado(a) quando não tenho liberdade de questionar ou criar minhas próprias regras
2. Minha dificuldade em seguir normas pré-estabelecidas traz alguns prejuízos para o cumprimento do meu trabalho
3. Minha visão global faz com que, por vezes, não dê atenção a detalhes importantes de uma tarefa ou projeto
4. Depender de outra pessoa ou de um superior para agir me gera frustração
5. Acho difícil aceitar algumas regras impostas e posso ficar desmotivado(a)

**EXEMPLOS DE DESENVOLVIMENTO**:
• Aumentar a atenção aos detalhes e a qualidade
• Desenvolver a capacidade de seguir normas ou regras que sejam primordiais para execução do seu trabalho
• Aprofundar-se em questões técnicas relacionadas a sua entrega
• Respeitar processos estabelecidos
• Trabalhar em colaboração com equipes e hierarquias

**PERGUNTAS REFLEXIVAS**:
• Descreva situações em que os comportamentos de pontuação mais alta trouxeram prejuízos para sua performance no trabalho
• Você se recorda de alguma situação que conseguiu flexibilizar esses comportamentos relacionados as Normas baixas? O que lhe motivou?
• Liste pessoas próximas que tem um perfil de Normas altas e podem ajudar e mentorar você`,
        keywords: ['PDI', 'normas baixas', 'autônomo', 'inovador', 'desenvolvimento', 'comportamento']
      },

      // ========== GUIA DO PDI ==========
      {
        title: 'As 5 Etapas do PDI',
        category: 'Guia PDI',
        content: `O PDI (Plano de Desenvolvimento Individual) segue uma metodologia estruturada em 5 etapas:

**1. COMPATIBILIDADE COM O CARGO**
Mapear comportamentos compatíveis e incompatíveis do colaborador com o cargo atual para nortear o PDI.
• Essa etapa requer mapeamento prévio dos comportamentos desejados para o cargo
• Deve ser realizado pelo gestor do cargo junto com o RH
• É fundamental ter a capacitação necessária para construção de cargo na plataforma PDA

**2. DEVOLUTIVA PDA**
Promover o autoconhecimento através do relatório individual e compatibilidade com o cargo.
• Inicie com a devolutiva apenas do perfil, focando nos indicadores do gráfico
• Faça perguntas reflexivas sobre satisfação, desconfortos e desejos de desenvolvimento
• Apresente o relatório de compatibilidade destacando áreas com menor compatibilidade
• Alinhe expectativas de desenvolvimento e principais dificuldades

**3. CONSTRUÇÃO DO PLANO**
Identificar comportamentos específicos a desenvolver e construir o plano de ação.
• Utilize os modelos de PDI específicos para cada eixo comportamental
• Realize autoavaliação dos 5 comportamentos predominantes
• Responda às perguntas reflexivas para aprofundar autoconhecimento
• Identifique mentores que possam apoiar o desenvolvimento
• Defina objetivos SMART e ações usando a metodologia 70|20|10

**4. ACOMPANHAMENTO**
Realizar check-ins periódicos para avaliar progresso e ajustar o plano.
• Recomendamos 2 sessões de acompanhamento durante o período do PDI
• Use perguntas norteadoras para estruturar o check-in
• Documente aprendizados e ajustes necessários
• Celebre conquistas e reconheça esforços
• Mantenha foco no desenvolvimento comportamental

**5. FECHAMENTO**
Avaliar resultados, reconhecer crescimento e planejar próximos passos.
• Realize avaliação honesta do processo e dos resultados
• Reconheça e celebre progressos, mesmo os pequenos
• Identifique aprendizados aplicáveis em outras áreas
• Defina próximos passos para desenvolvimento contínuo
• Documente ganhos e competências desenvolvidas`,
        keywords: ['PDI', 'etapas', 'guia', 'metodologia', 'acompanhamento', 'desenvolvimento']
      },

      // ========== METODOLOGIAS ==========
      {
        title: 'Metodologia SMART',
        category: 'Metodologias',
        content: `A Metodologia SMART é fundamental para definir objetivos e ações de forma clara e alcançável no PDI:

**S - eSpecífica**
Especifique em detalhes o que você irá fazer. Seja claro e preciso sobre a ação.

**M - Mensurável**
Tenha critérios definidos para medir seu progresso em direção à meta. Como você saberá que alcançou?

**A - Alcançável**
Certifique-se de que sua ação é atingível. O objetivo deve ser desafiador mas realista.

**R - Relevante**
Seu objetivo deve ser importante e realista em relação à meta definida. Faz sentido para seu desenvolvimento?

**T - Temporal**
Estipule uma frequência e um prazo claramente definido, incluindo data de início e fim.

**EXEMPLO DE AÇÃO SMART**:
"Participar de 2 reuniões semanais de planejamento estratégico até o final do trimestre, anotando ao menos 3 pontos de aprendizado por reunião sobre tomada de decisão e visão estratégica."`,
        keywords: ['SMART', 'objetivos', 'metas', 'metodologia', 'ação', 'PDI']
      },
      {
        title: 'Modelo 70|20|10',
        category: 'Metodologias',
        content: `O Modelo 70|20|10 é a distribuição recomendada para o aprendizado e desenvolvimento no PDI:

**70% - EXPERIÊNCIAS E VIVÊNCIAS** (2 a 3 ações)
Aprendizado através de experiências próprias e vivências do cotidiano: ações e práticas dos novos comportamentos.
• Projetos desafiadores
• Novas responsabilidades
• Resolução de problemas reais
• Prática no dia a dia

**20% - APRENDIZADO SOCIAL** (1 a 2 ações)
Aprendizado com outras pessoas: mentoria, feedback, observação de modelos.
• Mentoria com profissionais mais experientes
• Feedback estruturado
• Job shadowing (observar profissionais em ação)
• Grupos de discussão

**10% - APRENDIZAGEM FORMAL** (1 ação)
Aprendizado através de treinamentos, cursos, leituras e certificações.
• Cursos presenciais ou online
• Workshops e palestras
• Leituras específicas
• Certificações

**POR QUE ESSA DISTRIBUIÇÃO?**
A pesquisa mostra que 70% do desenvolvimento real vem da prática e experiência, 20% do aprendizado social, e apenas 10% de treinamentos formais. Por isso, o PDI deve priorizar ações práticas do dia a dia!`,
        keywords: ['70-20-10', 'aprendizado', 'metodologia', 'experiência', 'mentoria', 'PDI']
      }
    ];

    // Inserir todos os documentos
    const { error: insertError } = await supabase
      .from('knowledge_base')
      .insert(knowledgeData);

    if (insertError) {
      console.error('Erro ao inserir dados:', insertError);
      throw insertError;
    }

    console.log(`Base de conhecimento atualizada com sucesso! ${knowledgeData.length} documentos inseridos.`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Base de conhecimento atualizada com ${knowledgeData.length} documentos`,
        documents: knowledgeData.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na função update-knowledge-complete:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
