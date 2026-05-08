-- Habilita extensões para agendar disparos HTTP
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove agendamento antigo se existir (idempotente)
DO $$
DECLARE jid bigint;
BEGIN
  SELECT jobid INTO jid FROM cron.job WHERE jobname = 'weekly-newsletter-friday';
  IF jid IS NOT NULL THEN
    PERFORM cron.unschedule(jid);
  END IF;
END $$;

-- Agenda toda sexta-feira às 14:00 UTC (11:00 BRT)
SELECT cron.schedule(
  'weekly-newsletter-friday',
  '0 14 * * 5',
  $$
  SELECT net.http_post(
    url := 'https://hapzzpwywnahovmddlej.supabase.co/functions/v1/weekly-newsletter',
    headers := '{"Content-Type":"application/json","apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhcHp6cHd5d25haG92bWRkbGVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxMDA5OTYsImV4cCI6MjA4NDY3Njk5Nn0.GurSIxBtd-IosOQWN6dX0PJPF6SJouTDv1RSx9TlzpM"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);