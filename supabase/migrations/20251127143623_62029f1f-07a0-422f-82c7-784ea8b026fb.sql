-- Renomear coluna com nome incorreto para video_url
ALTER TABLE modules 
RENAME COLUMN "https://youtu.be/R-1j5dkuVf8?si=02rPgtKSeLECcIXC" TO video_url;