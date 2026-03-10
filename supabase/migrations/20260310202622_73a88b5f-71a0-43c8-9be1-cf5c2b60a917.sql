
INSERT INTO public.module_exercises (module_id, title, description, exercise_type, order_number, questions)
VALUES (
  '191e4656-2e03-476d-83f8-65a524d4667b',
  'Questionário de Autoconhecimento',
  'Responda com honestidade e profundidade. O objetivo é ampliar sua consciência sobre como você lidera.',
  'open_text',
  1,
  '[
    {"id": "q1", "text": "1. Como você descreveria seu estilo de gestão?", "type": "open_text"},
    {"id": "q2", "text": "2. O que você acredita que faz muito bem como líder?", "type": "open_text"},
    {"id": "q3", "text": "3. Em que situações você sente que sua liderança é mais forte?", "type": "open_text"},
    {"id": "q4", "text": "4. Em que contextos você percebe que perde desempenho ou clareza?", "type": "open_text"},
    {"id": "q5", "text": "5. Se seu time pudesse descrevê-lo com sinceridade absoluta, o que diria?", "type": "open_text"},
    {"id": "q6", "text": "6. O que você tem feito intencionalmente para evoluir como líder?", "type": "open_text"},
    {"id": "q7_strength", "text": "Com base no seu relatório PDA, qual seu ponto forte para liderança?", "type": "open_text"},
    {"id": "q8_development", "text": "Com base no seu relatório PDA, qual sua oportunidade de desenvolvimento?", "type": "open_text"},
    {"id": "q9_pda_axes", "text": "Selecione o eixo do PDA relacionado e o nível (baixo/alto) para cada eixo que se aplica:", "type": "checklist", "options": ["Risco baixo", "Risco alto", "Extroversão baixo", "Extroversão alto", "Paciência baixo", "Paciência alto", "Norma baixo", "Norma alto", "Autocontrole baixo", "Autocontrole alto"]}
  ]'::jsonb
);
