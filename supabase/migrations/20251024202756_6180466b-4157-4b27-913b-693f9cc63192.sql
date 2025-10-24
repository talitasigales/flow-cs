-- Update module descriptions with correct subtitles
UPDATE public.modules 
SET description = 'Entendendo a teoria de Marston. Leitura, interpretação de relatórios e análise do próprio perfil.'
WHERE module_order = 1;

UPDATE public.modules 
SET description = 'Como o PDA pode auxiliar em um processo seletivo mais assertivo?'
WHERE module_order = 2;

UPDATE public.modules 
SET description = 'Aplicando o PDA para planos de desenvolvimento individual e estratégias de engajamento.'
WHERE module_order = 3;

UPDATE public.modules 
SET description = 'Uma leitura comportamental para fortalecer resultados, colaboração e relações.'
WHERE module_order = 4;

UPDATE public.modules 
SET description = 'Do potencial à performance.'
WHERE module_order = 5;

UPDATE public.modules 
SET description = 'Transformando dados em decisões estratégicas com apoio do PDA Assessment.'
WHERE module_order = 6;