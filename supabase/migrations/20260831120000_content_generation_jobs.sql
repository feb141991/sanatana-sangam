-- Durable content-generation jobs for daily quiz, daily digest, and Dharm Veer.
-- This migration is intentionally unapplied; production activation requires review.

create table if not exists public.quiz_generation_jobs (
  id uuid primary key default gen_random_uuid(),
  quiz_date date not null,
  tradition text not null check (tradition in ('hindu', 'sikh', 'buddhist', 'jain')),
  language text not null check (language in ('en', 'hi', 'pa')),
  status text not null default 'pending'
    check (status in ('pending', 'claimed', 'generated', 'fallback', 'failed')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  max_attempts integer not null default 3 check (max_attempts > 0),
  available_at timestamptz not null default now(),
  lease_until timestamptz,
  last_error text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (quiz_date, tradition, language)
);

create index if not exists quiz_generation_jobs_claim_idx
  on public.quiz_generation_jobs (available_at, quiz_date, created_at)
  where status in ('pending', 'claimed');

create table if not exists public.daily_digest_variants (
  id uuid primary key default gen_random_uuid(),
  spiritual_date date not null,
  tradition text not null,
  spiritual_level text not null,
  language text not null default 'en',
  panchang_signature text not null,
  content jsonb,
  status text not null default 'pending'
    check (status in ('pending', 'claimed', 'ready', 'fallback', 'failed')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  max_attempts integer not null default 3 check (max_attempts > 0),
  available_at timestamptz not null default now(),
  lease_until timestamptz,
  last_error text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (spiritual_date, tradition, spiritual_level, language, panchang_signature)
);

create index if not exists daily_digest_variants_claim_idx
  on public.daily_digest_variants (available_at, spiritual_date, created_at)
  where status in ('pending', 'claimed');

create table if not exists public.dharm_veer_generation_jobs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  status text not null default 'pending'
    check (status in ('pending', 'claimed', 'generated_pending_review', 'no_source', 'failed')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  max_attempts integer not null default 3 check (max_attempts > 0),
  available_at timestamptz not null default now(),
  lease_until timestamptz,
  last_error text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists dharm_veer_generation_jobs_claim_idx
  on public.dharm_veer_generation_jobs (available_at, created_at)
  where status in ('pending', 'claimed');

alter table public.quiz_generation_jobs enable row level security;
alter table public.quiz_generation_jobs force row level security;
alter table public.daily_digest_variants enable row level security;
alter table public.daily_digest_variants force row level security;
alter table public.dharm_veer_generation_jobs enable row level security;
alter table public.dharm_veer_generation_jobs force row level security;

revoke all on public.quiz_generation_jobs from anon, authenticated;
revoke all on public.daily_digest_variants from anon, authenticated;
revoke all on public.dharm_veer_generation_jobs from anon, authenticated;

create or replace function public.claim_quiz_generation_jobs(
  p_batch_limit integer default 3,
  p_lease_minutes integer default 5
)
returns setof public.quiz_generation_jobs
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.quiz_generation_jobs
  set status = 'pending', lease_until = null, updated_at = now()
  where status = 'claimed' and lease_until < now() and attempt_count < max_attempts;

  update public.quiz_generation_jobs
  set status = 'failed', lease_until = null, completed_at = now(),
      last_error = coalesce(last_error, 'retry_exhausted'), updated_at = now()
  where status in ('pending', 'claimed') and attempt_count >= max_attempts;

  return query
  with claimed as (
    select id from public.quiz_generation_jobs
    where status = 'pending' and available_at <= now() and attempt_count < max_attempts
    order by quiz_date, created_at
    limit greatest(1, least(p_batch_limit, 12))
    for update skip locked
  )
  update public.quiz_generation_jobs jobs
  set status = 'claimed', attempt_count = attempt_count + 1,
      lease_until = now() + make_interval(mins => greatest(1, p_lease_minutes)),
      updated_at = now()
  from claimed where jobs.id = claimed.id
  returning jobs.*;
end;
$$;

create or replace function public.claim_dharm_veer_generation_jobs(
  p_batch_limit integer default 1,
  p_lease_minutes integer default 10
)
returns setof public.dharm_veer_generation_jobs
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.dharm_veer_generation_jobs
  set status = 'pending', lease_until = null, updated_at = now()
  where status = 'claimed' and lease_until < now() and attempt_count < max_attempts;

  return query
  with claimed as (
    select id from public.dharm_veer_generation_jobs
    where status = 'pending' and available_at <= now() and attempt_count < max_attempts
    order by created_at
    limit greatest(1, least(p_batch_limit, 3))
    for update skip locked
  )
  update public.dharm_veer_generation_jobs jobs
  set status = 'claimed', attempt_count = attempt_count + 1,
      lease_until = now() + make_interval(mins => greatest(1, p_lease_minutes)),
      updated_at = now()
  from claimed where jobs.id = claimed.id
  returning jobs.*;
end;
$$;

grant execute on function public.claim_quiz_generation_jobs(integer, integer) to service_role;
grant execute on function public.claim_dharm_veer_generation_jobs(integer, integer) to service_role;

