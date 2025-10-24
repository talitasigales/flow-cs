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

    // Limpar base atual
    await supabase.from('knowledge_base').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Inserir novo conteúdo com REPNA correto
    const { data, error } = await supabase
      .from('knowledge_base')
      .insert([
        {
          title: 'Os 5 Eixos REPNA do PDA',
          content: 'REPNA é a sigla para os cinco eixos comportamentais do Personal Development Analysis (PDA): Risco (R), Extroversão (E), Paciência (P), Normas (N) e Autocontrole (A). Essa ferramenta mapeia e analisa tendências no ambiente de trabalho, identificando pontos fortes, áreas de desenvolvimento e compatibilidade com cargos.\n\nR de RISCO: Avalia a propensão a assumir riscos. Tendência alta é mais arrojada, competitiva e direta. Tendência baixa é mais cautelosa, diplomática e ponderada.\n\nE de EXTROVERSÃO: Mede o grau de interação social. Tendência alta é comunicativa, sociável e persuasiva. Tendência baixa é mais reservada, analítica e introspectiva.\n\nP de PACIÊNCIA: Avalia a impulsividade e capacidade de espera. Tendência alta é mais paciente, constante e colaborativa. Tendência baixa é mais impulsiva, dinâmica e orientada a resultados rápidos.\n\nN de NORMAS: Mede a receptividade a regras e procedimentos. Tendência alta é mais voltada a regras, precisa e metódica. Tendência baixa é mais independente, obstinada e flexível.\n\nA de AUTOCONTROLE: Avalia a inteligência emocional e capacidade de reflexão. Tendência alta é mais lógica, prática e racional. Tendência baixa é mais emocional, empática e intuitiva.',
          category: 'Eixos Comportamentais',
          keywords: ['REPNA', 'risco', 'extroversão', 'paciência', 'normas', 'autocontrole', 'eixos', 'comportamental', 'PDA', 'R', 'E', 'P', 'N', 'A']
        },
        {
          title: 'Manual do Analista PDA',
          content: 'O Sistema PDA é uma ferramenta fundamentada na "Teoria da Personalidade" de William M. Marston. O PDA analisa o Perfil Comportamental através de 5 eixos REPNA: Risco (R), Extroversão (E), Paciência (P), Normas (N) e Autocontrole (A). Indicadores importantes: Intensidade do Eixo (IE), Tomada de Decisões (TD), Intensidade do Perfil (IP), Nível de Energia (NE), Equilíbrio de Energia (EE), Modificação do Perfil (MP), Tempo do Formulário (TF), Indicador de Consistência. Eixos combinados: quando R alto + E alto = perfil Condutor executivo; R alto + N alto = perfil Criativo; E alto + P alto = perfil Conselheiro; P alto + N alto = perfil Especialista.',
          category: 'Fundamentos',
          keywords: ['PDA', 'REPNA', 'perfil', 'comportamental', 'Marston', 'risco', 'extroversão', 'paciência', 'normas', 'autocontrole', 'indicadores', 'eixos', 'combinados']
        },
        {
          title: 'Material Técnico PDA 2025',
          content: 'Guia técnico da plataforma PDA. Consumo de créditos: 1 crédito por aplicação completa. Orientações para preenchimento correto: responder com sinceridade, ambiente tranquilo sem interrupções, não pensar demais nas respostas. Relatórios disponíveis: Perfil Comportamental individual (REPNA), Compatibilidade com Cargos, Compatibilidade com Competências, Líder x Liderado, Tendência Grupal, Compatibilidade de Cargos em Grupo. Perfil inválido: ocorre quando há inconsistência significativa nas respostas, pessoa não entendeu instruções, ou respondeu aleatoriamente. Prazo de validade: recomenda-se reaplicar a cada 2 anos em contexto organizacional.',
          category: 'Plataforma',
          keywords: ['plataforma', 'relatórios', 'créditos', 'validade', 'consistência', 'compatibilidade', 'cargos', 'preenchimento', 'REPNA']
        },
        {
          title: 'Diferenciais do PDA Assessment',
          content: 'Diferenciais únicos do PDA Assessment: 1) Indicador de Intensidade do Perfil (IP) - mede a força do comportamento nos eixos REPNA, perfis podem ser intensos ou moderados; 2) Indicador de Equilíbrio de Energia (EE) - identifica fadiga comportamental, estresse ou sobrecarga, quando pessoa está fora da zona de conforto; 3) Indicador de Consistência - valida confiabilidade das respostas através de perguntas cruzadas; 4) Eixo do Autocontrole (A) - mede capacidade de adaptação comportamental e flexibilidade; 5) Relatórios especializados de compatibilidade detalhada com cargos e competências comportamentais; 6) Relatório de Times - analisa dinâmica grupal e complementaridade de perfis REPNA; 7) Validação Científica internacional reconhecida.',
          category: 'Diferenciais',
          keywords: ['indicadores', 'intensidade', 'equilíbrio', 'energia', 'consistência', 'autocontrole', 'validação', 'científica', 'REPNA']
        },
        {
          title: 'Masterclass Construção de Cargo',
          content: 'Como criar perfil comportamental ideal para cargos usando PDA REPNA. Processo completo: 1) Definir funções principais do cargo; 2) Identificar competências técnicas e comportamentais necessárias; 3) Mapear perfil REPNA ideal para a posição (níveis de Risco, Extroversão, Paciência, Normas e Autocontrole); 4) Estabelecer critérios de compatibilidade mínima. Relatório de Compatibilidade: cruza perfil real do candidato com perfil ideal do cargo, gera score percentual de aderência, aponta gaps comportamentais específicos nos eixos REPNA. Aplicações: Recrutamento e Seleção (identificar fit cultural), Desenvolvimento de Pessoas (planos individuais), Retenção de Talentos.',
          category: 'Aplicação',
          keywords: ['cargo', 'construção', 'recrutamento', 'seleção', 'compatibilidade', 'aderência', 'gaps', 'REPNA', 'perfil']
        }
      ])
      .select();

    if (error) {
      console.error('Erro ao atualizar conhecimento:', error);
      throw error;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Base de conhecimento atualizada com REPNA!',
        count: data?.length || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in update-knowledge-repna:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
