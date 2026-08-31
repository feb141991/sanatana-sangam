#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
MIGRATION="$ROOT/supabase/migrations/20260831060651_atomic_idempotent_japa_completion.sql"
ROLLBACK="$ROOT/supabase/rollbacks/20260831060651_atomic_idempotent_japa_completion_rollback.sql"
TMP="$(mktemp -d "${TMPDIR:-/tmp}/shoonaya-japa-shadow.XXXXXX")"
PORT="$((54000 + ($$ % 1000)))"

cleanup() {
  pg_ctl -D "$TMP/data" -m fast stop >/dev/null 2>&1 || true
  rm -rf "$TMP"
}
trap cleanup EXIT

initdb -D "$TMP/data" -A trust --no-locale >/dev/null
pg_ctl -D "$TMP/data" -o "-F -p $PORT -k $TMP" -w start >/dev/null

PSQL=(psql -v ON_ERROR_STOP=1 -h "$TMP" -p "$PORT" -d postgres)

"${PSQL[@]}" <<'SQL' >/dev/null
create role anon nologin;
create role authenticated nologin;
create role service_role nologin;
create schema auth;
create function auth.uid() returns uuid language sql stable as
  $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;

create table public.profiles (
  id uuid primary key,
  timezone text,
  tradition text,
  active_symbol_id text,
  last_freeze_used date,
  streak_freeze_count integer default 0,
  karma_points integer default 0
);
create table public.daily_sadhana (
  user_id uuid not null,
  date date not null,
  japa_done boolean default false,
  streak_count integer default 0,
  primary key (user_id, date)
);
create table public.mala_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  mantra text not null,
  count integer not null,
  target_count integer,
  duration_seconds integer,
  duration_secs integer,
  completed_at timestamptz default now(),
  date text,
  rounds integer,
  bead_count integer,
  mantra_id text,
  mala_id text,
  tradition text,
  practice_type text,
  intention text,
  completion_type text,
  target_rounds integer,
  completed_rounds integer,
  completed_beads integer,
  spiritual_time_window text,
  spiritual_date date,
  timezone text,
  haptics_enabled boolean,
  source_route text
);
create table public.karma_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  amount integer not null,
  reason text not null,
  source_route text,
  metadata jsonb,
  earned_date date
);
SQL

"${PSQL[@]}" -f "$MIGRATION" >/dev/null

"${PSQL[@]}" <<'SQL' >/dev/null
insert into public.profiles (id, timezone, tradition, active_symbol_id)
values ('11111111-1111-4111-8111-111111111111', 'Europe/London', 'hindu', 'rudraksha');

set role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', false);

select public.complete_japa_session(
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Gayatri Mantra', 108, 1, 123,
  'hindu', 'mala', 'rudraksha'
);
select public.complete_japa_session(
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Gayatri Mantra', 108, 1, 123,
  'hindu', 'mala', 'rudraksha'
);
reset role;

do $$
declare
  v_context jsonb;
begin
  if (select count(*) from public.mala_sessions) <> 1 then
    raise exception 'idempotent replay inserted a duplicate session';
  end if;
  if (select duration_seconds from public.mala_sessions limit 1) <> 123 then
    raise exception 'duration was not persisted';
  end if;
  if (select count(*) from public.karma_ledger) <> 1 then
    raise exception 'idempotent replay inserted a duplicate ledger entry';
  end if;
  if (select karma_points from public.profiles limit 1) <> 5 then
    raise exception 'karma was not incremented atomically exactly once';
  end if;
  if not (select japa_done from public.daily_sadhana limit 1) then
    raise exception 'daily completion was not persisted';
  end if;

  v_context := public.get_japa_context();
  if (v_context #>> '{lifetime,totalBeads}')::integer <> 108
     or (v_context #>> '{lifetime,totalRounds}')::integer <> 1 then
    raise exception 'authoritative lifetime totals are incorrect: %', v_context;
  end if;
end $$;
select set_config('request.jwt.claim.sub', '', false);

do $$
begin
  perform public.get_japa_context();
  raise exception 'unauthenticated context call unexpectedly succeeded';
exception
  when invalid_authorization_specification then null;
end $$;
SQL

"${PSQL[@]}" -f "$ROLLBACK" >/dev/null

"${PSQL[@]}" <<'SQL' >/dev/null
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'mala_sessions'
      and column_name = 'client_completion_id'
  ) then
    raise exception 'rollback left client_completion_id behind';
  end if;
  if to_regprocedure('public.get_japa_context()') is not null then
    raise exception 'rollback left get_japa_context behind';
  end if;
end $$;
SQL

echo "Japa completion shadow verification: PASS"
