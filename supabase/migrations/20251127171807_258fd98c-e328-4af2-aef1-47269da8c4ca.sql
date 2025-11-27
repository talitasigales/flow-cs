-- Atualizar base de conhecimento com informações sobre faixas SITUACIONAIS dos eixos REPNA

INSERT INTO public.knowledge_base (title, content, category, keywords)
VALUES (
  'Faixas de Valores dos Eixos REPNA - Incluindo Situacional',
  E'Os eixos REPNA do PDA Assessment são medidos em uma escala de 0 a 100, divididos em três faixas distintas:

📊 FAIXAS DE INTERPRETAÇÃO:

1️⃣ BAIXO (0 a 33):
Comportamento consistente e bem definido no polo baixo do eixo. A pessoa demonstra esse traço de forma clara e recorrente.

2️⃣ SITUACIONAL (34 a 67):
Comportamento ADAPTÁVEL e FLEXÍVEL. A pessoa ajusta seu comportamento conforme o contexto, demandas e situações específicas. Não possui um padrão fixo, sendo capaz de transitar entre os dois polos do eixo dependendo do ambiente.

3️⃣ ALTO (68 a 100):
Comportamento consistente e bem definido no polo alto do eixo. A pessoa demonstra esse traço de forma clara e recorrente.

🎯 EIXOS REPNA COM FAIXAS SITUACIONAIS:

R - RISCO (Propensão a assumir riscos):
• Alto (68-100): Arrojado, competitivo, busca desafios, age com ousadia
• SITUACIONAL (34-67): Equilibra ousadia e cautela. Avalia riscos contextuais e age de forma mais arrojada ou cautelosa conforme a situação demanda
• Baixo (0-33): Cauteloso, analítico, prefere segurança, evita riscos

E - EXTROVERSÃO (Grau de interação social):
• Alto (68-100): Sociável, comunicativo, energizado por interações
• SITUACIONAL (34-67): Adapta-se socialmente. Ora é mais extrovertido e comunicativo, ora prefere reserva e introspecção, dependendo do ambiente
• Baixo (0-33): Reservado, discreto, prefere interações mais limitadas

P - PACIÊNCIA (Ritmo e adaptação):
• Alto (68-100): Paciente, estável, ritmo constante, resistente a mudanças
• SITUACIONAL (34-67): Ajusta o ritmo conforme necessário. Pode ser paciente quando o contexto exige ou dinâmico quando precisa de agilidade
• Baixo (0-33): Dinâmico, impulsivo, ritmo acelerado, ágil nas mudanças

N - NORMAS (Receptividade a regras):
• Alto (68-100): Metódico, estruturado, segue processos, valoriza regras
• SITUACIONAL (34-67): Flexível quanto a normas. Pode seguir rigorosamente regras estabelecidas ou adaptá-las quando vê sentido prático
• Baixo (0-33): Independente, inovador, questiona normas, valoriza autonomia

A - AUTOCONTROLE (Inteligência emocional):
• Alto (68-100): Lógico, racional, controla emoções, decisões objetivas
• SITUACIONAL (34-67): Equilibra razão e emoção. Ora age com mais lógica, ora se permite ser guiado pela emoção conforme julga apropriado
• Baixo (0-33): Emocional, expressivo, decisões baseadas em sentimentos

💡 IMPORTÂNCIA DO PERFIL SITUACIONAL:
Pessoas com eixos situacionais (34-67) possuem GRANDE CAPACIDADE DE ADAPTAÇÃO. Elas podem ajustar seu comportamento conforme o contexto organizacional, equipe ou demanda específica. Isso é uma VANTAGEM em ambientes que exigem flexibilidade, mas pode gerar dúvidas sobre qual comportamento adotar em determinadas situações.

No desenvolvimento de PDIs para perfis situacionais, é importante:
✅ Ajudar a pessoa a reconhecer EM QUAIS CONTEXTOS cada comportamento é mais efetivo
✅ Desenvolver autoconsciência sobre quando escolher cada "lado" do eixo
✅ Trabalhar a clareza de critérios para decidir qual comportamento adotar',
  'PDA',
  ARRAY['REPNA', 'eixos', 'situacional', 'faixas', 'valores', 'adaptação', 'flexibilidade', 'contexto', 'comportamento', 'escala']
)
ON CONFLICT (id) DO NOTHING;