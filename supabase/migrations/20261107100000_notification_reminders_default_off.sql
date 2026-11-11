-- Every notification reminder starts OFF for a new profile. NOT applied to any database by this commit.
--
-- Why: migration 20261026113000 (default_all_notifications_enabled) set the reminder defaults to ON and overwrote every OFF with ON,
-- and 17 other reminder columns already defaulted ON. A profile created without the onboarding step (or by an app build that never
-- showed the choices) therefore received every reminder: on 2026-11-07, 10 of 32 profiles had never finished onboarding, 6 of them held
-- a push token and received 137 pushes in 14 days; Brahma Muhurta (the founder decided on 2026-10-11 that it is opt-in) was ON for 21
-- of 32 profiles and only 1 of those looks like a choice. The Native onboarding now lists every notification, all off, and writes the
-- person's own choices explicitly; this makes the database agree for every other way a profile can be created (AGENTS.md section 6, rule 19).
--
-- What this does: ALTER COLUMN ... SET DEFAULT false on 18 profile columns. It changes the default for rows INSERTED from now on and
-- nothing else. It does NOT touch any existing profile: what to do about the 32 existing rows is a separate decision and a separate
-- migration.
--
-- ROC pre-flight (AGENTS.md section 4):
--  1. Function overload trap (PGRST203): no function is created, replaced or dropped, so no overload can appear.
--  2. Caller contract: a profile inserted WITHOUT these columns now gets OFF. The Native onboarding writes every one of them explicitly,
--     so a person's own choices are unchanged. An already-installed OLDER app build still writes its old defaults (ON) explicitly during
--     onboarding: this migration cannot change that, only the new Native build can. Server code that creates a bare profile (the
--     auth-profile repair, the signup trigger) now creates one with no reminders until the person chooses. Cron selectors read
--     `= true`, so a bare profile is simply not selected.
--  3. User data and opt-out safety: there is NO update here, so no value is overwritten (no opt-out and no opt-in). Counts read from
--     production on 2026-11-07 (re-read on the day this is applied): the 17 wants_*/_enabled flags below are true for 30-32 of 32 profiles
--     (brahma 21, sanskara 0); every column currently defaults to true except wants_sanskara_reminders (false, unchanged here).
--  4. Locks: ALTER COLUMN SET DEFAULT is metadata only (a brief ACCESS EXCLUSIVE on profiles, no table rewrite, 32 rows); lock_timeout
--     is 5s so it fails fast rather than queueing behind a long writer.
--  5. Rollback: supabase/rollbacks/20261107100000_notification_reminders_default_off_rollback.sql restores the previous defaults (true).
--
-- This default does not rewrite explicit NULLs. Deploy the producer and delivery
-- checks that require true so a missing preference cannot authorize a reminder.

begin;
set local lock_timeout = '5s';

alter table public.profiles
  alter column dharm_veer_reminder_enabled set default false,
  alter column japa_reminder_enabled set default false,
  alter column nitya_reminder_enabled set default false,
  alter column quiz_reminder_enabled set default false,
  alter column wants_brahma_muhurta_reminders set default false,
  alter column wants_community_notifications set default false,
  alter column wants_evening_reminder set default false,
  alter column wants_family_notifications set default false,
  alter column wants_family_remembrance_reminders set default false,
  alter column wants_festival_reminders set default false,
  alter column wants_madhyahn_reminder set default false,
  alter column wants_mood_reminders set default false,
  alter column wants_nitya_reminders set default false,
  alter column wants_sankalpa_midpoint_reminders set default false,
  alter column wants_sattvic_reminders set default false,
  alter column wants_shloka_reminders set default false,
  alter column wants_tithi_reminders set default false,
  alter column wants_vrat_reminders set default false;

-- The migration checks its own result and aborts (rolling everything back) if any reminder default is still not false.
do $check$
declare
  v_left text;
begin
  select string_agg(a.attname, ', ' order by a.attname) into v_left
  from pg_attribute a
  left join pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum
  where a.attrelid = 'public.profiles'::regclass
    and a.attnum > 0 and not a.attisdropped
    and (a.attname like 'wants\_%' escape '\' or a.attname like '%\_reminder\_enabled' escape '\')
    and a.atttypid = 'boolean'::regtype
    and coalesce(pg_get_expr(d.adbin, d.adrelid), '') <> 'false';
  if v_left is not null then
    raise exception 'notification_reminders_default_off: these reminder columns do not default to false: %', v_left;
  end if;
end
$check$;

commit;
