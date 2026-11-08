-- Option B: stop the reminders that people never chose. NOT applied to any database by this commit.
--
-- Why: migration 20261026113000 turned every reminder ON and overwrote each OFF, and a profile that never finished onboarding never saw a
-- choice. On 2026-11-08 (production, read-only): 10 of 32 profiles had never finished onboarding (6 of them reachable by push, 137 pushes in 14
-- days), and Brahma Muhurta, which the founder decided on 2026-10-11 is opt-in, was ON for 21 profiles, of which only 1 looks like a choice.
-- The founder chose option B on 2026-11-08.
--
-- What this does, and nothing more:
--   1. Brahma Muhurta is switched OFF for every profile that did not choose it. "Chose it" means: finished onboarding AFTER the Oct 26 migration
--      (from then on onboarding wrote the person's own switch explicitly). Every other profile with it ON, whether it never finished onboarding
--      or finished before the migration overwrote its value, is switched OFF.
--   2. For a profile that never finished onboarding (onboarding_completed is not true), ALL 18 reminder switches are set OFF, until the person
--      turns some on in Settings or finishes onboarding (which writes their own choices).
--   Nothing else changes: not wants_sanskara_reminders, not any reminder time, not any row that finished onboarding after the cutoff, not
--   any other switch of a profile that finished onboarding earlier.
--
-- Before it changes anything it copies the exact previous values of every row it will touch into
-- public.notification_reset_backup_20261108, so the rollback can restore them exactly (and never overwrites a choice made after the reset).
-- Drop that table once the reset is confirmed: it is the only record of the old values and holds one row per affected account.
--
-- Run it ONCE. A second run changes nothing it did not already change and never overwrites the first backup (the first backup wins), but it
-- would switch off again any reminder a person who STILL has not finished onboarding has turned on since; that is intended for the first run only.
--
-- ROC pre-flight (AGENTS.md section 4):
--  1. Function overload trap (PGRST203): no function is created, replaced or dropped, so no overload can appear.
--  2. Caller contract: reads of these columns see only `false` where they saw `true`; no column, type or default changes. Run
--     20261107100000_notification_reminders_default_off.sql first (or together): without it a NEW bare profile would again default to ON.
--     Older installed app builds still write their own old defaults when a person finishes onboarding; that is their explicit write.
--  3. User data and opt-out safety: counts read from production on 2026-11-08 (re-read on the day this is applied):
--       class                                   profiles  brahma ON  reachable by push
--       never finished onboarding, before cutoff     4         4         2
--       never finished onboarding, after cutoff      6         6         4
--       finished onboarding, before cutoff          11        10         7
--       finished onboarding, after cutoff           11         1        10
--     Expected effect: Brahma OFF for 20 profiles (4 + 6 + 10); all 18 switches OFF for 10 profiles (4 + 6). No profile was created within a day
--     of the cutoff, so the rule has no borderline case; no onboarding_completed is NULL. The update only ever writes `false`, so it cannot
--     overwrite an opt-out; it may overwrite an opt-in only for a profile that never finished onboarding (no route lets such a person reach
--     Settings) or a Brahma value the migration of 2026-10-26 set for them. The blanket `where x = false or x is null` pattern is NOT used.
--  4. Locks: UPDATE of at most a few dozen rows of public.profiles plus a small new table; lock_timeout is 5s so it fails fast.
--  5. Rollback: supabase/rollbacks/20261108100000_notification_reminders_reset_never_chosen_rollback.sql restores the backed-up values exactly,
--     only where the current value is still the one this migration wrote.
--
-- The backup table: RLS enabled and forced with no policy; nothing is granted to anon or authenticated; it cascades with the account.

begin;
set local lock_timeout = '5s';

create table if not exists public.notification_reset_backup_20261108 (
  user_id uuid primary key references auth.users(id) on delete cascade,
  reason text not null check (reason in ('never_finished_onboarding', 'brahma_not_chosen')),
  taken_at timestamptz not null default now(),
  dharm_veer_reminder_enabled boolean,
  japa_reminder_enabled boolean,
  nitya_reminder_enabled boolean,
  quiz_reminder_enabled boolean,
  wants_brahma_muhurta_reminders boolean,
  wants_community_notifications boolean,
  wants_evening_reminder boolean,
  wants_family_notifications boolean,
  wants_family_remembrance_reminders boolean,
  wants_festival_reminders boolean,
  wants_madhyahn_reminder boolean,
  wants_mood_reminders boolean,
  wants_nitya_reminders boolean,
  wants_sankalpa_midpoint_reminders boolean,
  wants_sattvic_reminders boolean,
  wants_shloka_reminders boolean,
  wants_tithi_reminders boolean,
  wants_vrat_reminders boolean
);
alter table public.notification_reset_backup_20261108 enable row level security;
alter table public.notification_reset_backup_20261108 force row level security;
revoke all on table public.notification_reset_backup_20261108 from public, anon, authenticated;

-- Snapshot of every reminder value before anything changes, to prove below that nothing else moved.
create temp table _notification_reset_pre on commit drop as
  select id, onboarding_completed, created_at, wants_sanskara_reminders, dharm_veer_reminder_enabled, japa_reminder_enabled, nitya_reminder_enabled, quiz_reminder_enabled, wants_brahma_muhurta_reminders, wants_community_notifications, wants_evening_reminder, wants_family_notifications, wants_family_remembrance_reminders, wants_festival_reminders, wants_madhyahn_reminder, wants_mood_reminders, wants_nitya_reminders, wants_sankalpa_midpoint_reminders, wants_sattvic_reminders, wants_shloka_reminders, wants_tithi_reminders, wants_vrat_reminders
  from public.profiles;

-- 1. Back up exactly the rows that will change (first backup wins: a re-run cannot overwrite it with already-reset values).
insert into public.notification_reset_backup_20261108 (user_id, reason, dharm_veer_reminder_enabled, japa_reminder_enabled, nitya_reminder_enabled, quiz_reminder_enabled, wants_brahma_muhurta_reminders, wants_community_notifications, wants_evening_reminder, wants_family_notifications, wants_family_remembrance_reminders, wants_festival_reminders, wants_madhyahn_reminder, wants_mood_reminders, wants_nitya_reminders, wants_sankalpa_midpoint_reminders, wants_sattvic_reminders, wants_shloka_reminders, wants_tithi_reminders, wants_vrat_reminders)
select p.id,
       case when p.onboarding_completed is not true then 'never_finished_onboarding' else 'brahma_not_chosen' end,
       p.dharm_veer_reminder_enabled, p.japa_reminder_enabled, p.nitya_reminder_enabled, p.quiz_reminder_enabled, p.wants_brahma_muhurta_reminders, p.wants_community_notifications, p.wants_evening_reminder, p.wants_family_notifications, p.wants_family_remembrance_reminders, p.wants_festival_reminders, p.wants_madhyahn_reminder, p.wants_mood_reminders, p.wants_nitya_reminders, p.wants_sankalpa_midpoint_reminders, p.wants_sattvic_reminders, p.wants_shloka_reminders, p.wants_tithi_reminders, p.wants_vrat_reminders
from public.profiles p
where (p.onboarding_completed is not true and (
         dharm_veer_reminder_enabled is distinct from false
       or japa_reminder_enabled is distinct from false
       or nitya_reminder_enabled is distinct from false
       or quiz_reminder_enabled is distinct from false
       or wants_brahma_muhurta_reminders is distinct from false
       or wants_community_notifications is distinct from false
       or wants_evening_reminder is distinct from false
       or wants_family_notifications is distinct from false
       or wants_family_remembrance_reminders is distinct from false
       or wants_festival_reminders is distinct from false
       or wants_madhyahn_reminder is distinct from false
       or wants_mood_reminders is distinct from false
       or wants_nitya_reminders is distinct from false
       or wants_sankalpa_midpoint_reminders is distinct from false
       or wants_sattvic_reminders is distinct from false
       or wants_shloka_reminders is distinct from false
       or wants_tithi_reminders is distinct from false
       or wants_vrat_reminders is distinct from false))
   or (p.wants_brahma_muhurta_reminders is true
       and not (p.onboarding_completed is true and p.created_at >= timestamptz '2026-10-26 11:30:00+05:30'))
on conflict (user_id) do nothing;

-- 2. Everything OFF for a profile that never finished onboarding.
update public.profiles
set
      dharm_veer_reminder_enabled = false,
      japa_reminder_enabled = false,
      nitya_reminder_enabled = false,
      quiz_reminder_enabled = false,
      wants_brahma_muhurta_reminders = false,
      wants_community_notifications = false,
      wants_evening_reminder = false,
      wants_family_notifications = false,
      wants_family_remembrance_reminders = false,
      wants_festival_reminders = false,
      wants_madhyahn_reminder = false,
      wants_mood_reminders = false,
      wants_nitya_reminders = false,
      wants_sankalpa_midpoint_reminders = false,
      wants_sattvic_reminders = false,
      wants_shloka_reminders = false,
      wants_tithi_reminders = false,
      wants_vrat_reminders = false
where onboarding_completed is not true
  and (dharm_veer_reminder_enabled is distinct from false
       or japa_reminder_enabled is distinct from false
       or nitya_reminder_enabled is distinct from false
       or quiz_reminder_enabled is distinct from false
       or wants_brahma_muhurta_reminders is distinct from false
       or wants_community_notifications is distinct from false
       or wants_evening_reminder is distinct from false
       or wants_family_notifications is distinct from false
       or wants_family_remembrance_reminders is distinct from false
       or wants_festival_reminders is distinct from false
       or wants_madhyahn_reminder is distinct from false
       or wants_mood_reminders is distinct from false
       or wants_nitya_reminders is distinct from false
       or wants_sankalpa_midpoint_reminders is distinct from false
       or wants_sattvic_reminders is distinct from false
       or wants_shloka_reminders is distinct from false
       or wants_tithi_reminders is distinct from false
       or wants_vrat_reminders is distinct from false);

-- 3. Brahma Muhurta OFF for everyone who did not choose it.
update public.profiles
set wants_brahma_muhurta_reminders = false
where wants_brahma_muhurta_reminders is true
  and not (onboarding_completed is true and created_at >= timestamptz '2026-10-26 11:30:00+05:30');

-- The migration checks its own result and aborts (rolling everything back) if any of these fails.
do $check$
declare
  v_bad integer;
  v_never integer;
  v_brahma integer;
begin
  -- a. nobody who never finished onboarding keeps any reminder
  select count(*) into v_bad from public.profiles
  where onboarding_completed is not true and (
         dharm_veer_reminder_enabled is distinct from false
       or japa_reminder_enabled is distinct from false
       or nitya_reminder_enabled is distinct from false
       or quiz_reminder_enabled is distinct from false
       or wants_brahma_muhurta_reminders is distinct from false
       or wants_community_notifications is distinct from false
       or wants_evening_reminder is distinct from false
       or wants_family_notifications is distinct from false
       or wants_family_remembrance_reminders is distinct from false
       or wants_festival_reminders is distinct from false
       or wants_madhyahn_reminder is distinct from false
       or wants_mood_reminders is distinct from false
       or wants_nitya_reminders is distinct from false
       or wants_sankalpa_midpoint_reminders is distinct from false
       or wants_sattvic_reminders is distinct from false
       or wants_shloka_reminders is distinct from false
       or wants_tithi_reminders is distinct from false
       or wants_vrat_reminders is distinct from false);
  if v_bad > 0 then raise exception 'notification reset: % never-onboarded profile(s) still have a reminder on', v_bad; end if;

  -- b. nobody has Brahma Muhurta on unless they finished onboarding after the cutoff
  select count(*) into v_bad from public.profiles
  where wants_brahma_muhurta_reminders is true
    and not (onboarding_completed is true and created_at >= timestamptz '2026-10-26 11:30:00+05:30');
  if v_bad > 0 then raise exception 'notification reset: % profile(s) still have Brahma Muhurta on without choosing it', v_bad; end if;

  -- c. no profile outside the backed-up set changed at all (the 18 switches and Sanskara)
  select count(*) into v_bad
  from public.profiles p join _notification_reset_pre b on b.id = p.id
  where p.id not in (select user_id from public.notification_reset_backup_20261108)
    and (p.wants_sanskara_reminders is distinct from b.wants_sanskara_reminders
         or p.dharm_veer_reminder_enabled is distinct from b.dharm_veer_reminder_enabled
         or p.japa_reminder_enabled is distinct from b.japa_reminder_enabled
         or p.nitya_reminder_enabled is distinct from b.nitya_reminder_enabled
         or p.quiz_reminder_enabled is distinct from b.quiz_reminder_enabled
         or p.wants_brahma_muhurta_reminders is distinct from b.wants_brahma_muhurta_reminders
         or p.wants_community_notifications is distinct from b.wants_community_notifications
         or p.wants_evening_reminder is distinct from b.wants_evening_reminder
         or p.wants_family_notifications is distinct from b.wants_family_notifications
         or p.wants_family_remembrance_reminders is distinct from b.wants_family_remembrance_reminders
         or p.wants_festival_reminders is distinct from b.wants_festival_reminders
         or p.wants_madhyahn_reminder is distinct from b.wants_madhyahn_reminder
         or p.wants_mood_reminders is distinct from b.wants_mood_reminders
         or p.wants_nitya_reminders is distinct from b.wants_nitya_reminders
         or p.wants_sankalpa_midpoint_reminders is distinct from b.wants_sankalpa_midpoint_reminders
         or p.wants_sattvic_reminders is distinct from b.wants_sattvic_reminders
         or p.wants_shloka_reminders is distinct from b.wants_shloka_reminders
         or p.wants_tithi_reminders is distinct from b.wants_tithi_reminders
         or p.wants_vrat_reminders is distinct from b.wants_vrat_reminders);
  if v_bad > 0 then raise exception 'notification reset: % profile(s) outside the reset set changed', v_bad; end if;

  -- d. Sanskara and the onboarding flag were never touched, inside the reset set or outside it
  select count(*) into v_bad
  from public.profiles p join _notification_reset_pre b on b.id = p.id
  where p.wants_sanskara_reminders is distinct from b.wants_sanskara_reminders
     or p.onboarding_completed is distinct from b.onboarding_completed;
  if v_bad > 0 then raise exception 'notification reset: Sanskara reminders or the onboarding flag changed for % profile(s)', v_bad; end if;

  select count(*) filter (where reason = 'never_finished_onboarding'), count(*) filter (where reason = 'brahma_not_chosen')
  into v_never, v_brahma from public.notification_reset_backup_20261108;
  raise notice 'notification reset: % never-onboarded profile(s) reset (all switches off), % further profile(s) had Brahma Muhurta switched off', v_never, v_brahma;
end
$check$;

commit;
