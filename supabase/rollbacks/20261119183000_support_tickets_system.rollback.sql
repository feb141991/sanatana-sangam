-- Rollback: Support Tickets & Help System Schema
-- File: supabase/rollbacks/20261119183000_support_tickets_system.rollback.sql
-- Removes the retention job and both tables. Tickets and messages are deleted and cannot be restored.
begin;
do $$
declare v_job_id bigint;
begin
  for v_job_id in select jobid from cron.job where jobname = 'purge-support-tickets-daily' loop
    perform cron.unschedule(v_job_id);
  end loop;
end;
$$;
DROP TABLE IF EXISTS public.support_ticket_messages CASCADE;
DROP TABLE IF EXISTS public.support_tickets CASCADE;
commit;
