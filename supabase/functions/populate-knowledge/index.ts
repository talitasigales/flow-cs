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

    // Verificar se já existem dados
    const { data: existing } = await supabase
      .from('knowledge_base')
      .select('id')
      .limit(1);

    if (existing && existing.length > 0) {
      return new Response(
        JSON.stringify({ message: 'Base de conhecimento já populada', count: existing.length }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Inserir os 4 documentos
    const { data, error } = await supabase
      .from('knowledge_base')
      .insert([
        {
          title: 'Manual do Analista PDA',
          content: 'O Sistema PDA é uma ferramenta fundamentada na "Teoria da Personalidade" de William M. Marston. O PDA analisa o Perfil Comportamental através de 4 eixos: DOMINÂNCIA (D) - força, determinação, competitividade, assertividade; INFLUÊNCIA (I) - sociabilidade, comunicação, entusiasmo, persuasão; ESTABILIDADE (S) - paciência, colaboração, consistência, diplomacia; CONFORMIDADE (C) - precisão, análise, qualidade, metodologia. Indicadores importantes: Intensidade do Eixo (IE), Tomada de Decisões (TD), Intensidade do Perfil (IP), Nível de Energia (NE), Equilíbrio de Energia (EE), Modificação do Perfil (MP), Tempo do Formulário (TF), Indicador de Consistência. Eixos combinados: quando D alto + I alto = perfil Condutor executivo; D alto + C alto = perfil Criativo; I alto + S alto = perfil Conselheiro; S alto + C alto = perfil Especialista.',
          category: 'Fundamentos',
          keywords: ['PDA', 'DISC', 'perfil', 'comportamental', 'Marston', 'dominância', 'influência', 'estabilidade', 'conformidade', 'indicadores', 'eixos', 'combinados']
        },
        {
          title: 'Material Técnico PDA 2025',
          content: 'Guia técnico da plataforma PDA. Consumo de créditos: 1 crédito por aplicação completa. Orientações para preenchimento correto: responder com sinceridade, ambiente tranquilo sem interrupções, não pensar demais nas respostas. Relatórios disponíveis: Perfil Comportamental individual, Compatibilidade com Cargos, Compatibilidade com Competências, Líder x Liderado, Tendência Grupal, Compatibilidade de Cargos em Grupo. Perfil inválido: ocorre quando há inconsistência significativa nas respostas, pessoa não entendeu instruções, ou respondeu aleatoriamente. Prazo de validade: recomenda-se reaplicar a cada 2 anos em contexto organizacional. Como refazer: pode solicitar novo preenchimento pela plataforma.',
          category: 'Plataforma',
          keywords: ['plataforma', 'relatórios', 'créditos', 'validade', 'consistência', 'compatibilidade', 'cargos', 'preenchimento', 'orientações', 'inválido']
        },
        {
          title: 'Diferenciais do PDA Assessment',
          content: 'Diferenciais únicos do PDA Assessment: 1) Indicador de Intensidade do Perfil (IP) - mede a força do comportamento, perfis podem ser intensos ou moderados; 2) Indicador de Equilíbrio de Energia (EE) - identifica fadiga comportamental, estresse ou sobrecarga, quando pessoa está fora da zona de conforto; 3) Indicador de Consistência - valida confiabilidade das respostas através de perguntas cruzadas; 4) Eixo do Autocontrole - mede capacidade de adaptação comportamental e flexibilidade; 5) Relatórios especializados de compatibilidade detalhada com cargos e competências comportamentais; 6) Relatório de Times - analisa dinâmica grupal e complementaridade de perfis; 7) Validação Científica internacional reconhecida; 8) Economia: um único crédito por aplicação completa.',
          category: 'Diferenciais',
          keywords: ['indicadores', 'intensidade', 'equilíbrio', 'energia', 'consistência', 'autocontrole', 'validação', 'científica', 'diferenciais', 'exclusivo']
        },
        {
          title: 'Masterclass Construção de Cargo',
          content: 'Como criar perfil comportamental ideal para cargos usando PDA. Processo completo: 1) Definir funções principais do cargo; 2) Identificar competências técnicas e comportamentais necessárias; 3) Mapear perfil DISC ideal para a posição; 4) Estabelecer critérios de compatibilidade mínima. Relatório de Compatibilidade: cruza perfil real do candidato com perfil ideal do cargo, gera score percentual de aderência, aponta gaps comportamentais específicos, sugere pontos de atenção. Aplicações práticas: Recrutamento e Seleção (identificar fit cultural), Desenvolvimento de Pessoas (planos de desenvolvimento individual), Movimentação interna (promoções e transferências), Retenção de Talentos (alocar pessoas em posições adequadas ao perfil).',
          category: 'Aplicação',
          keywords: ['cargo', 'construção', 'recrutamento', 'seleção', 'compatibilidade', 'aderência', 'gaps', 'fit', 'desenvolvimento', 'talento']
        }
      ])
      .select();

    if (error) {
      console.error('Erro ao inserir conhecimento:', error);
      throw error;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Base de conhecimento populada com sucesso!',
        count: data?.length || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in populate-knowledge:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
