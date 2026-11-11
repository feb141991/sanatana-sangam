-- Option B: explicit product governance decision to reset uncertain reminder consent. NOT applied to any database by this commit.
--
-- Why: migration 20261026113000 turned every reminder ON and overwrote each prior OFF, and profiles that never finished onboarding
-- never saw an explicit consent choice. While created_at and onboarding_completed exist, account creation time does not establish when
-- onboarding finished or whether someone subsequently enabled Brahma Muhurta in Settings. To eliminate ambiguous consent and align
-- with the founder's 2026-10-11 opt-in decision for Brahma Muhurta, this migration executes an explicit product decision to reset
-- uncertain consent, backed up in full so no record is permanently destroyed.
--
-- What this does, and nothing more:
--   1. Brahma Muhurta is switched OFF for every profile where consent is uncertain (never finished onboarding, or created before the
--      Oct 26 blanket default migration).
--   2. For a profile that never finished onboarding (onboarding_completed is not true), ALL 18 reminder switches are set OFF, until the person
--      explicitly configures them in Settings or finishes onboarding.
--   Nothing else changes: not wants_sanskara_reminders, not any reminder time, not any profile created after the cutoff with completed onboarding.
--
-- The 2026-11-08 snapshot implied 20 distinct profiles: 10 unfinished profiles
-- plus 10 completed profiles in the legacy Brahma cohort. This is not a fixed
-- apply count; rerun scripts/notification-routing/reminder-reset-preflight.sql.
-- Backup and reset run under the same short write lock. Only the precise row
-- version written by the reset is eligible for rollback.
--
-- ROC pre-flight (AGENTS.md section 4):
--  1. Function overload trap (PGRST203): no function is created, replaced or dropped, so no overload can appear.
--  2. Caller contract: reads of these columns see only `false` where they saw `true`; no column, type or default changes. Run
--     20261107100000_notification_reminders_default_off.sql first (or together).
--  3. User data and opt-out safety: The update only ever writes `false`. Blanket `where x = false or x is null` pattern is NOT used.
--  4. Locks: UPDATE of the preflight cohort of public.profiles plus a small new table; lock_timeout is 5s so it fails fast.
--  5. Rollback: supabase/rollbacks/20261108100000_notification_reminders_reset_never_chosen_rollback.sql restores backed-up values only for the exact row versions written by the reset.
--
-- The backup table: RLS enabled and forced with no policy; nothing is granted to anon or authenticated; it cascades with the account.

begin;
set local lock_timeout = '5s';
-- Keep backups and mutations consistent with concurrent profile preference writes.
lock table public.profiles in share row exclusive mode;

-- Deliberately fail if an earlier backup exists; do not reset later choices on a re-run.
create table public.notification_reset_backup_20261108 (
  user_id uuid primary key references auth.users(id) on delete cascade,
  reason text not null check (reason in ('never_finished_onboarding', 'brahma_not_chosen')),
  taken_at timestamptz not null default now(),
  post_reset_xmin text,
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

-- 1. Back up exactly the rows that will change.
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
;

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

-- Capture the new tuple version, independent of updated_at and of the boolean values.
update public.notification_reset_backup_20261108 b
set post_reset_xmin = p.xmin::text
from public.profiles p
where p.id = b.user_id;

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

  -- b. the approved reset cohort no longer has Brahma Muhurta enabled
  select count(*) into v_bad from public.profiles
  where wants_brahma_muhurta_reminders is true
    and not (onboarding_completed is true and created_at >= timestamptz '2026-10-26 11:30:00+05:30');
  if v_bad > 0 then raise exception 'notification reset: % profile(s) in the reset cohort still have Brahma Muhurta enabled', v_bad; end if;

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
