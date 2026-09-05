-- A daily generation run must not spend its whole budget replaying an older
-- backlog while today's user-facing variants remain pending.
drop function if exists public.claim_quiz_generation_jobs(integer, integer);

create function public.claim_quiz_generation_jobs(
  p_batch_limit integer default 3,
  p_lease_minutes integer default 5,
  p_quiz_date date default null
)
returns setof public.quiz_generation_jobs
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.quiz_generation_jobs
  set status = 'pending', lease_until = null, updated_at = now()
  where status = 'claimed'
    and lease_until < now()
    and attempt_count < max_attempts
    and (p_quiz_date is null or quiz_date = p_quiz_date);

  update public.quiz_generation_jobs
  set status = 'failed', lease_until = null, completed_at = now(),
      last_error = coalesce(last_error, 'retry_exhausted'), updated_at = now()
  where status in ('pending', 'claimed')
    and attempt_count >= max_attempts
    and (p_quiz_date is null or quiz_date = p_quiz_date);

  return query
  with claimed as (
    select id
    from public.quiz_generation_jobs
    where status = 'pending'
      and available_at <= now()
      and attempt_count < max_attempts
      and (p_quiz_date is null or quiz_date = p_quiz_date)
    order by quiz_date, created_at
    limit greatest(1, least(p_batch_limit, 12))
    for update skip locked
  )
  update public.quiz_generation_jobs jobs
  set status = 'claimed', attempt_count = attempt_count + 1,
      lease_until = now() + make_interval(mins => greatest(1, p_lease_minutes)),
      updated_at = now()
  from claimed
  where jobs.id = claimed.id
  returning jobs.*;
end;
$$;

revoke all on function public.claim_quiz_generation_jobs(integer, integer, date) from public, anon, authenticated;
grant execute on function public.claim_quiz_generation_jobs(integer, integer, date) to service_role;
