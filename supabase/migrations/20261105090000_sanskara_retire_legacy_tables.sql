-- Sanskara tracker M6: retire the three legacy tables that the Sanskara tracker replaced.
-- Design: docs/SANSKARA_TRACKER_BACKEND_DESIGN.md sections 7 and 8 (M6). NOT applied to any database by this commit.
--
-- WHAT THIS DOES (one transaction)
--   1. Takes ACCESS EXCLUSIVE locks on public.user_sanskaras, public.user_sanskars and public.sanskars.
--   2. ABORTS if either user table holds a single row. It never deletes a person's data: the rows would have to be migrated by a reviewed task.
--   3. Copies the public 16-row catalogue to public.sanskars_catalogue_archive_20261105 (a plain copy, unmodified), checks the row counts match,
--      turns row-level security on with no policy and no grants for anon or authenticated, then drops the three tables.
--
-- The archive is the way back: the rollback recreates the three tables from this file's DDL and restores the catalogue from the archive.
-- Drop the archive only by a separate, explicit decision.
--
-- WHY IT IS SAFE TO RUN (checked read-only against production, 2026-11-05): user_sanskaras 0 rows, user_sanskars 0 rows, sanskars 16 rows;
-- no function and no view mentions any of the three; the only foreign keys are user_sanskars -> sanskars and each user table -> auth.users
-- (and user_sanskaras -> kul_family_members). The DROP statements have no CASCADE, so a dependency this file does not know about makes it fail
-- with nothing applied. The old PWA routes that wrote these tables (/api/sanskar/schedule and /suggest) answer 410, and the web page that read
-- them no longer queries them (same commit).
--
-- BEFORE APPLYING (not done by this file): the deployed edge function ai-sanskar-guide reads public.sanskars and sends beneficiary details to
-- an LLM, which the contract forbids (R6). Nothing in src calls it. Undeploy it first; after this migration it would only return errors.
--
-- ROC pre-flight: 1 overload trap: no function is created or changed. 2 callers: none in src after this commit; Native never read these tables.
-- 3 data: no UPDATE, no default change; the user tables must be empty or the migration aborts. 4 locks: ACCESS EXCLUSIVE on three tables
-- nothing live touches; lock_timeout 5s, so it fails cleanly instead of queueing. 5 rollback: supabase/rollbacks/20261105090000_*.sql.
-- Privilege review: the archive has RLS enabled and no policy; every grant is revoked from public, anon and authenticated.

begin;
set local lock_timeout = '5s';

lock table public.user_sanskaras, public.user_sanskars, public.sanskars in access exclusive mode;

do $$
declare
  v_a bigint;
  v_b bigint;
begin
  select count(*) into v_a from public.user_sanskaras;
  select count(*) into v_b from public.user_sanskars;
  if v_a <> 0 or v_b <> 0 then
    raise exception 'legacy sanskara tables are not empty (user_sanskaras %, user_sanskars %): migrate them first', v_a, v_b using errcode = 'P0001';
  end if;
end $$;

create table public.sanskars_catalogue_archive_20261105 as table public.sanskars;
alter table public.sanskars_catalogue_archive_20261105 enable row level security;
alter table public.sanskars_catalogue_archive_20261105 force row level security;
revoke all on table public.sanskars_catalogue_archive_20261105 from public, anon, authenticated;
comment on table public.sanskars_catalogue_archive_20261105 is
  'Unmodified copy of the retired public.sanskars catalogue, kept for the M6 rollback. Not read by any code. Drop only by explicit decision.';

do $$
begin
  if (select count(*) from public.sanskars_catalogue_archive_20261105) <> (select count(*) from public.sanskars) then
    raise exception 'archive row count differs from the catalogue' using errcode = 'P0001';
  end if;
end $$;

drop table public.user_sanskars;
drop table public.user_sanskaras;
drop table public.sanskars;

commit;
