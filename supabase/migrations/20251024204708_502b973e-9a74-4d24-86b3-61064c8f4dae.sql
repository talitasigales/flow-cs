-- Inserir informações sobre pontuações e interpretação dos eixos PDA
INSERT INTO public.knowledge_base (title, content, category, keywords)
VALUES (
  'Interpretação de Pontuações PDA - Faixas de Comportamento',
  'As pontuações no PDA Assessment são divididas em três faixas que indicam tendências de comportamento em cada eixo (R, E, P, N, A):

FAIXAS DE PONTUAÇÃO:
• 0-33: Considerado BAIXO - Indica uma tendência natural para o polo oposto da característica
• 34-66: Considerado SITUACIONAL - Indica flexibilidade e capacidade de adaptação conforme o contexto
• 67-100: Considerado ALTO - Indica uma tendência natural forte para aquela característica

INTERPRETAÇÃO POR EIXO:

R (Risco):
- Baixo (0-33): Cauteloso, diplomático, ponderado
- Situacional (34-66): Avalia riscos conforme contexto
- Alto (67-100): Arrojado, competitivo, direto

E (Extroversão):
- Baixo (0-33): Reservado, reflexivo, observador
- Situacional (34-66): Adapta-se socialmente conforme necessário
- Alto (67-100): Comunicativo, sociável, persuasivo

P (Paciência):
- Baixo (0-33): Dinâmico, ágil, busca variedade
- Situacional (34-66): Alterna entre ritmos conforme demanda
- Alto (67-100): Paciente, constante, persistente

N (Normas):
- Baixo (0-33): Flexível, adaptável, questionador
- Situacional (34-66): Equilibra estrutura e flexibilidade
- Alto (67-100): Metódico, preciso, seguidor de regras

A (Autocontrole):
- Baixo (0-33): Emocional, empático, intuitivo
- Situacional (34-66): INTELIGÊNCIA EMOCIONAL - Consegue balizar situações e escolher quando usar emoção ou racionalidade
- Alto (67-100): Lógico, prático, racional

DESTAQUE ESPECIAL - AUTOCONTROLE SITUACIONAL (34-66):
Esta é a faixa ideal de inteligência emocional. Pessoas com Autocontrole Situacional:
• Conseguem BALIZAR BEM AS SITUAÇÕES
• ESCOLHEM conscientemente quando tomar decisões com mais EMOÇÃO ou mais RACIONALIDADE
• Não são nem excessivamente emocionais nem excessivamente racionais
• Adaptam sua resposta emocional ao contexto
• São consideradas emocionalmente inteligentes
• Têm flexibilidade para usar tanto a lógica quanto a empatia conforme a situação demanda',
  'Interpretação',
  ARRAY['pontuação', 'faixas', 'baixo', 'situacional', 'alto', 'autocontrole', 'inteligência emocional', 'interpretação']
);