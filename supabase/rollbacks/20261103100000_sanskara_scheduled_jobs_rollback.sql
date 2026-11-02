-- Rollback for 20261103100000_sanskara_scheduled_jobs.sql. Stops the three daily jobs and drops their functions.
-- Rows the jobs already deleted (dependents past their window, purged timelines, old audit and request-log rows) are not
-- restored; dependents frozen and shares revoked by the sweep stay that way (frozen is derived again by sanskara_can).
begin;
select cron.unschedule(jobid) from cron.job
where jobname in ('sanskara-majority-sweep-daily', 'sanskara-consent-purge-daily', 'sanskara-retention-daily');
drop function if exists public.sanskara_job_majority_sweep(timestamptz, boolean, integer);
drop function if exists public.sanskara_job_consent_purge(timestamptz, boolean, integer);
drop function if exists public.sanskara_job_retention(timestamptz, boolean, integer);
commit;
