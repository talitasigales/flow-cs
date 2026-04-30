INSERT INTO public.pending_enrollments (email, secondary_email, program_id, class_id) VALUES
('aline.neglia@jars.org.br', NULL, '8f1cbc71-c437-49e9-8604-f77b3fdcb321', 'cb8bd210-1d27-4269-8f2c-ba35282fd54f'),
('elaine.boening@jars.org.br', NULL, '8f1cbc71-c437-49e9-8604-f77b3fdcb321', 'cb8bd210-1d27-4269-8f2c-ba35282fd54f'),
('karina.leira@jars.org.br', NULL, '8f1cbc71-c437-49e9-8604-f77b3fdcb321', 'cb8bd210-1d27-4269-8f2c-ba35282fd54f'),
('marcelo.bassani@jars.org.br', NULL, '8f1cbc71-c437-49e9-8604-f77b3fdcb321', 'cb8bd210-1d27-4269-8f2c-ba35282fd54f'),
('nathaly.silveira@jars.org.br', NULL, '8f1cbc71-c437-49e9-8604-f77b3fdcb321', 'cb8bd210-1d27-4269-8f2c-ba35282fd54f'),
('pessoas@jars.org.br', NULL, '8f1cbc71-c437-49e9-8604-f77b3fdcb321', 'cb8bd210-1d27-4269-8f2c-ba35282fd54f'),
('anelise.oberherr@grupodass.com.br', 'aneliseoberherr@gmail.com', '8f1cbc71-c437-49e9-8604-f77b3fdcb321', 'cb8bd210-1d27-4269-8f2c-ba35282fd54f'),
('filipe.souza@origoenergia.com.br', 'castropsico@gmail.com', '8f1cbc71-c437-49e9-8604-f77b3fdcb321', 'cb8bd210-1d27-4269-8f2c-ba35282fd54f'),
('luana.gabriella@cresol.com.br', 'lupsgabi@gmail.com', '8f1cbc71-c437-49e9-8604-f77b3fdcb321', 'cb8bd210-1d27-4269-8f2c-ba35282fd54f'),
('alinesoares@frigelar.com.br', 'alinesoares1@hotmail.com', '8f1cbc71-c437-49e9-8604-f77b3fdcb321', 'cb8bd210-1d27-4269-8f2c-ba35282fd54f'),
('lucianesilva@frigelar.com.br', 'lucianeteresa05@gmail.com', '8f1cbc71-c437-49e9-8604-f77b3fdcb321', 'cb8bd210-1d27-4269-8f2c-ba35282fd54f'),
('danieliran@frigelar.com.br', 'danieliran5000@hotmail.com', '8f1cbc71-c437-49e9-8604-f77b3fdcb321', 'cb8bd210-1d27-4269-8f2c-ba35282fd54f'),
('juferson.felix@mohawkbr.com', NULL, '8f1cbc71-c437-49e9-8604-f77b3fdcb321', 'cb8bd210-1d27-4269-8f2c-ba35282fd54f'),
('debora.donato@unicred.com.br', NULL, '8f1cbc71-c437-49e9-8604-f77b3fdcb321', 'cb8bd210-1d27-4269-8f2c-ba35282fd54f'),
('yuri.buchtik@yara.com', NULL, '8f1cbc71-c437-49e9-8604-f77b3fdcb321', 'cb8bd210-1d27-4269-8f2c-ba35282fd54f'),
('renato.silva@origoenergia.com.br', 'renatoferrazs@gmail.com', '8f1cbc71-c437-49e9-8604-f77b3fdcb321', 'cb8bd210-1d27-4269-8f2c-ba35282fd54f')
ON CONFLICT (email, program_id) DO UPDATE SET class_id = EXCLUDED.class_id, secondary_email = COALESCE(public.pending_enrollments.secondary_email, EXCLUDED.secondary_email);