-- Brahma Muhurta back to opt-in for profiles that never chose it. NOT applied to any database by this commit.
-- Founder decision 2026-10-11: Brahma Muhurta is opt-in. Migration 20261026113000 switched it ON for everyone, so on 2026-11-07 it was
-- ON for 21 of 32 profiles and only about 1 looked like a choice. This migration switches it OFF for every profile EXCEPT one that
-- finished onboarding after the blanket default migration (2026-10-26 11:30 IST), whose onboarding showed the choice.
--
-- It replaces the Brahma half of 20261108100000_notification_reminders_reset_never_chosen.sql. The other half of that file (all 18 OFF
-- for profiles that never finished onboarding) conflicts with the approved tiers and is NOT part of this migration. Do not apply
-- 20261108100000; it is removed in the same change.
--
-- What it changes: wants_brahma_muhurta_reminders true -> false for the reset cohort. Nothing else: no other reminder switch, no
-- Sanskara, no time, no onboarding flag. It only ever writes false and never uses a blanket `= false OR IS NULL` update.
--
-- ROC pre-flight (AGENTS.md section 4):
--  1. Function overload trap (PGRST203): no function is created, replaced or dropped.
--  2. Caller contract: no column, type or default changes; a reader sees false where it saw true. Brahma cron selects `= true`.
--  3. User data and opt-out safety: only true -> false, only for the cohort above, backed up first (table below). Report the
--     true/false/NULL counts and the cohort size from scripts/notification-routing/reminder-reset-preflight.sql on the day it is applied.
--     A person who really chose Brahma Muhurta before 2026-10-26 or outside onboarding is in the cohort and loses it until they tick
--     it again in Settings: this is a consent reset the founder has accepted, recoverable from the backup.
--  4. Locks: one UPDATE on a small table under SHARE ROW EXCLUSIVE; lock_timeout 5s.
--  5. Rollback: supabase/rollbacks/20261112110000_notification_brahma_opt_in_reset_rollback.sql restores only rows whose tuple version is
--     still the one this migration wrote (a later edit by the person is never overwritten).
--
-- The backup table: RLS enabled and forced with no policy; nothing granted to anon or authenticated; it goes with the account.

begin;
set local lock_timeout = '5s';
lock table public.profiles in share row exclusive mode;

-- Deliberately fails if an earlier backup exists, so a re-run cannot reset later choices.
create table public.notification_brahma_reset_backup_20261112 (
  user_id uuid primary key references auth.users(id) on delete cascade,
  taken_at timestamptz not null default now(),
  post_reset_xmin text,
  wants_brahma_muhurta_reminders boolean
);
alter table public.notification_brahma_reset_backup_20261112 enable row level security;
alter table public.notification_brahma_reset_backup_20261112 force row level security;
revoke all on table public.notification_brahma_reset_backup_20261112 from public, anon, authenticated;

create temp table _brahma_reset_pre on commit drop as
  select id, onboarding_completed, wants_sanskara_reminders, wants_brahma_muhurta_reminders,
         to_jsonb(p) - 'wants_brahma_muhurta_reminders' - 'updated_at' as others
  from public.profiles p;

insert into public.notification_brahma_reset_backup_20261112 (user_id, wants_brahma_muhurta_reminders)
select id, wants_brahma_muhurta_reminders
from public.profiles
where wants_brahma_muhurta_reminders is true
  and not (onboarding_completed is true and created_at >= timestamptz '2026-10-26 11:30:00+05:30');

update public.profiles
set wants_brahma_muhurta_reminders = false
where wants_brahma_muhurta_reminders is true
  and not (onboarding_completed is true and created_at >= timestamptz '2026-10-26 11:30:00+05:30');

update public.notification_brahma_reset_backup_20261112 b
set post_reset_xmin = p.xmin::text
from public.profiles p
where p.id = b.user_id;

do $check$
declare
  v_bad integer;
  v_n integer;
begin
  select count(*) into v_bad from public.profiles
  where wants_brahma_muhurta_reminders is true
    and not (onboarding_completed is true and created_at >= timestamptz '2026-10-26 11:30:00+05:30');
  if v_bad > 0 then raise exception 'brahma reset: % profile(s) in the cohort still have Brahma Muhurta on', v_bad; end if;

  -- nothing but Brahma changed, for anyone (every other column, Sanskara and the onboarding flag included)
  select count(*) into v_bad
  from public.profiles p join _brahma_reset_pre b on b.id = p.id
  where (to_jsonb(p) - 'wants_brahma_muhurta_reminders' - 'updated_at') is distinct from b.others;
  if v_bad > 0 then raise exception 'brahma reset: % profile(s) changed in a column other than Brahma Muhurta', v_bad; end if;

  -- Brahma only ever went true -> false, and only for backed-up rows
  select count(*) into v_bad
  from public.profiles p join _brahma_reset_pre b on b.id = p.id
  where p.wants_brahma_muhurta_reminders is distinct from b.wants_brahma_muhurta_reminders
    and (p.wants_brahma_muhurta_reminders is not false or p.id not in (select user_id from public.notification_brahma_reset_backup_20261112));
  if v_bad > 0 then raise exception 'brahma reset: % profile(s) changed outside the backed-up set', v_bad; end if;

  select count(*) into v_n from public.notification_brahma_reset_backup_20261112;
  raise notice 'brahma reset: Brahma Muhurta switched off for % profile(s)', v_n;
end
$check$;

commit;
