
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove agendamento anterior se existir
DO $$
BEGIN
  PERFORM cron.unschedule('dilemmas-reminder-2026-06-04');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Agenda: 04/06/2026 às 12:00 UTC (09:00 BRT)
SELECT cron.schedule(
  'dilemmas-reminder-2026-06-04',
  '0 12 4 6 *',
  $cmd$
  DO $do$
  BEGIN
    IF current_date = DATE '2026-06-04' THEN
      PERFORM net.http_post(
        url := 'https://hapzzpwywnahovmddlej.supabase.co/functions/v1/send-dilemmas-reminder',
        headers := '{"Content-Type":"application/json","apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhcHp6cHd5d25haG92bWRkbGVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxMDA5OTYsImV4cCI6MjA4NDY3Njk5Nn0.GurSIxBtd-IosOQWN6dX0PJPF6SJouTDv1RSx9TlzpM","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhcHp6cHd5d25haG92bWRkbGVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxMDA5OTYsImV4cCI6MjA4NDY3Njk5Nn0.GurSIxBtd-IosOQWN6dX0PJPF6SJouTDv1RSx9TlzpM"}'::jsonb,
        body := '{}'::jsonb
      );
      PERFORM cron.unschedule('dilemmas-reminder-2026-06-04');
    END IF;
  END
  $do$;
  $cmd$
);
