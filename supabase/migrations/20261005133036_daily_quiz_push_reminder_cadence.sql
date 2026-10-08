-- Keeps the per-user ten-minute quiz producer limited to opted-in profiles and
-- invokes it just after the existing resolver tick so the resolver sees new
-- candidates on its next run. The bearer secret is kept in Supabase Vault.
create index if not exists idx_profiles_quiz_reminders_enabled_user
  on public.profiles (id)
  where quiz_reminder_enabled is true;

-- Be safe if this migration is repaired/reapplied: there must be one named job.
select cron.unschedule(jobid)
from cron.job
where jobname = 'quiz-reminder-candidates-every-10-min';

select cron.schedule(
  'quiz-reminder-candidates-every-10-min',
  '5,15,25,35,45,55 * * * *',
  $cron$
  select net.http_get(
    url := 'https://www.shoonaya.com/api/cron/quiz-reminder-candidates',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'notification_dispatch_secret'
      )
    ),
    timeout_milliseconds := 25000
  );
  $cron$
);
