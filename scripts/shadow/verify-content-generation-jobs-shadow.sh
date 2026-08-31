#!/usr/bin/env bash
set -euo pipefail

DB_NAME="shoonaya_content_jobs_shadow_$$"
PSQL="${PSQL:-/opt/homebrew/bin/psql}"

cleanup() {
  "$PSQL" -d postgres -c "drop database if exists ${DB_NAME};" >/dev/null 2>&1 || true
}
trap cleanup EXIT

"$PSQL" -d postgres -c "create database ${DB_NAME};" >/dev/null
"$PSQL" -d "$DB_NAME" -v ON_ERROR_STOP=1 <<'SQL' >/dev/null
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin; end if;
end $$;
SQL

"$PSQL" -d "$DB_NAME" -v ON_ERROR_STOP=1 \
  -f supabase/migrations/20260831120000_content_generation_jobs.sql >/dev/null

"$PSQL" -d "$DB_NAME" -v ON_ERROR_STOP=1 <<'SQL'
insert into public.quiz_generation_jobs (quiz_date, tradition, language)
select date '2026-09-01', tradition, language
from unnest(array['hindu','sikh','buddhist','jain']) tradition
cross join unnest(array['en','hi','pa']) language;

do $$
declare
  first_claim integer;
  second_claim integer;
begin
  select count(*) into first_claim from public.claim_quiz_generation_jobs(3, 5);
  select count(*) into second_claim from public.claim_quiz_generation_jobs(3, 5);
  if first_claim <> 3 or second_claim <> 3 then
    raise exception 'bounded claims failed: first %, second %', first_claim, second_claim;
  end if;
  if (select count(*) from public.quiz_generation_jobs where status = 'claimed') <> 6 then
    raise exception 'claims overlapped or were lost';
  end if;
end $$;

do $$
begin
  if has_table_privilege('anon', 'public.quiz_generation_jobs', 'select') then
    raise exception 'anon unexpectedly has quiz job access';
  end if;
  if has_table_privilege('authenticated', 'public.daily_digest_variants', 'select') then
    raise exception 'authenticated unexpectedly has digest variant access';
  end if;
  if not (select relforcerowsecurity from pg_class where oid = 'public.dharm_veer_generation_jobs'::regclass) then
    raise exception 'Dharm Veer job RLS is not forced';
  end if;
end $$;

select 'content generation shadow: 8/8 checks passed' as result;
SQL

"$PSQL" -d "$DB_NAME" -v ON_ERROR_STOP=1 \
  -f supabase/rollbacks/20260831120000_content_generation_jobs_rollback.sql >/dev/null

"$PSQL" -d "$DB_NAME" -Atc \
  "select count(*) from pg_class where relname in ('quiz_generation_jobs','daily_digest_variants','dharm_veer_generation_jobs');" \
  | grep -qx '0'

echo "content generation rollback: 3/3 tables removed"
