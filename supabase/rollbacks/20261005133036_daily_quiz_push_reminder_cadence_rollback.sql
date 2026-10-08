select cron.unschedule(jobid)
from cron.job
where jobname = 'quiz-reminder-candidates-every-10-min';

drop index if exists public.idx_profiles_quiz_reminders_enabled_user;
