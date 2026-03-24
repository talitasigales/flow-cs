-- Enroll existing users in NR1 class
INSERT INTO program_enrollments (user_id, program_id, class_id) VALUES
('f839d918-fec2-4d08-b9fd-17d2183e4acc', '8f1cbc71-c437-49e9-8604-f77b3fdcb321', '3a9275ac-9f54-42f5-b088-42c7f7c6efdc'),
('66941636-b1b4-49d7-9840-c68ad3c58d04', '8f1cbc71-c437-49e9-8604-f77b3fdcb321', '3a9275ac-9f54-42f5-b088-42c7f7c6efdc'),
('b3d52101-4340-4366-8585-b6c32993fd04', '8f1cbc71-c437-49e9-8604-f77b3fdcb321', '3a9275ac-9f54-42f5-b088-42c7f7c6efdc'),
('fcabd490-d946-4481-abcc-f3bd411a5644', '8f1cbc71-c437-49e9-8604-f77b3fdcb321', '3a9275ac-9f54-42f5-b088-42c7f7c6efdc'),
('d2c43a61-a147-4732-b66e-ed3769604c9c', '8f1cbc71-c437-49e9-8604-f77b3fdcb321', '3a9275ac-9f54-42f5-b088-42c7f7c6efdc'),
('cd64b83e-489e-403d-8923-3bde21b85cd9', '8f1cbc71-c437-49e9-8604-f77b3fdcb321', '3a9275ac-9f54-42f5-b088-42c7f7c6efdc'),
('031b857e-95ed-415b-8516-2bd8755b5c86', '8f1cbc71-c437-49e9-8604-f77b3fdcb321', '3a9275ac-9f54-42f5-b088-42c7f7c6efdc'),
('7e5e69e2-8118-4d41-8d9b-a401f868d6f5', '8f1cbc71-c437-49e9-8604-f77b3fdcb321', '3a9275ac-9f54-42f5-b088-42c7f7c6efdc')
ON CONFLICT DO NOTHING;

-- Insert pending enrollments for emails without accounts (both personal and corporate)
-- These will auto-enroll when the user registers with either email
INSERT INTO pending_enrollments (email, program_id, class_id) VALUES
('cpetrus@hotmail.com', '8f1cbc71-c437-49e9-8604-f77b3fdcb321', '3a9275ac-9f54-42f5-b088-42c7f7c6efdc'),
('daiana.rocha@becooper.coop.br', '8f1cbc71-c437-49e9-8604-f77b3fdcb321', '3a9275ac-9f54-42f5-b088-42c7f7c6efdc'),
('daniel.cerione@becooper.coop.br', '8f1cbc71-c437-49e9-8604-f77b3fdcb321', '3a9275ac-9f54-42f5-b088-42c7f7c6efdc'),
('daniela-borba@procergs.rs.gov.br', '8f1cbc71-c437-49e9-8604-f77b3fdcb321', '3a9275ac-9f54-42f5-b088-42c7f7c6efdc'),
('eliane-hasse@procergs.rs.gov.br', '8f1cbc71-c437-49e9-8604-f77b3fdcb321', '3a9275ac-9f54-42f5-b088-42c7f7c6efdc'),
('fernanda.pinho@becooper.coop.br', '8f1cbc71-c437-49e9-8604-f77b3fdcb321', '3a9275ac-9f54-42f5-b088-42c7f7c6efdc'),
('fernanda@becooper.coop.br', '8f1cbc71-c437-49e9-8604-f77b3fdcb321', '3a9275ac-9f54-42f5-b088-42c7f7c6efdc'),
('iagoluiz-rocha@hotmail.com', '8f1cbc71-c437-49e9-8604-f77b3fdcb321', '3a9275ac-9f54-42f5-b088-42c7f7c6efdc'),
('ivo.lara@becooper.coop.br', '8f1cbc71-c437-49e9-8604-f77b3fdcb321', '3a9275ac-9f54-42f5-b088-42c7f7c6efdc'),
('jselicaires@gmail.com', '8f1cbc71-c437-49e9-8604-f77b3fdcb321', '3a9275ac-9f54-42f5-b088-42c7f7c6efdc'),
('kenny.teschiedel@gmail.com', '8f1cbc71-c437-49e9-8604-f77b3fdcb321', '3a9275ac-9f54-42f5-b088-42c7f7c6efdc'),
('kenny_teschiedel@sicredi.com.br', '8f1cbc71-c437-49e9-8604-f77b3fdcb321', '3a9275ac-9f54-42f5-b088-42c7f7c6efdc'),
('leandro-gil@procergs.rs.gov.br', '8f1cbc71-c437-49e9-8604-f77b3fdcb321', '3a9275ac-9f54-42f5-b088-42c7f7c6efdc'),
('lizianestracktrentin@gmail.com', '8f1cbc71-c437-49e9-8604-f77b3fdcb321', '3a9275ac-9f54-42f5-b088-42c7f7c6efdc'),
('marcelo-assis@procergs.rs.gov.br', '8f1cbc71-c437-49e9-8604-f77b3fdcb321', '3a9275ac-9f54-42f5-b088-42c7f7c6efdc'),
('marcia.rudunike.rh@construtorafieng.com.br', '8f1cbc71-c437-49e9-8604-f77b3fdcb321', '3a9275ac-9f54-42f5-b088-42c7f7c6efdc'),
('michelle.ansai@hotmail.com', '8f1cbc71-c437-49e9-8604-f77b3fdcb321', '3a9275ac-9f54-42f5-b088-42c7f7c6efdc'),
('paulo.lavezo@becooper.coop.br', '8f1cbc71-c437-49e9-8604-f77b3fdcb321', '3a9275ac-9f54-42f5-b088-42c7f7c6efdc'),
('rh02@construtorafieng.com.br', '8f1cbc71-c437-49e9-8604-f77b3fdcb321', '3a9275ac-9f54-42f5-b088-42c7f7c6efdc'),
('rh03@construtorafieng.com.br', '8f1cbc71-c437-49e9-8604-f77b3fdcb321', '3a9275ac-9f54-42f5-b088-42c7f7c6efdc'),
('roberta.marques@becooper.coop.br', '8f1cbc71-c437-49e9-8604-f77b3fdcb321', '3a9275ac-9f54-42f5-b088-42c7f7c6efdc'),
('silvia-oliveira@procergs.rs.gov.br', '8f1cbc71-c437-49e9-8604-f77b3fdcb321', '3a9275ac-9f54-42f5-b088-42c7f7c6efdc'),
('simone.faria@becooper.coop.br', '8f1cbc71-c437-49e9-8604-f77b3fdcb321', '3a9275ac-9f54-42f5-b088-42c7f7c6efdc'),
('supervisao.norte@construtorafieng.com.br', '8f1cbc71-c437-49e9-8604-f77b3fdcb321', '3a9275ac-9f54-42f5-b088-42c7f7c6efdc')
ON CONFLICT (email, program_id) DO NOTHING;