-- Tiered reminder defaults for a NEW profile. NOT applied to any database by this commit.
-- Founder decision 2026-11-12 ("approve tiers"). Supersedes the all-OFF defaults of 20261107100000 (apply that first, or skip it:
-- this migration sets every one of the 18 columns, so the end state is the same either way).
--
-- Core tier, ON for a new profile (one quiet morning nudge plus the calendar reminders people come for):
--   wants_shloka_reminders, japa_reminder_enabled (default time 07:00 is a column default, untouched), wants_festival_reminders,
--   wants_vrat_reminders, wants_tithi_reminders.
-- Everything else is OFF until the person chooses it:
--   wants_brahma_muhurta_reminders (founder: opt-in, 2026-10-11), wants_mood_reminders, wants_sattvic_reminders,
--   wants_evening_reminder, wants_madhyahn_reminder, wants_community_notifications, wants_family_notifications,
--   wants_family_remembrance_reminders, dharm_veer_reminder_enabled, quiz_reminder_enabled, wants_nitya_reminders,
--   nitya_reminder_enabled, wants_sankalpa_midpoint_reminders.
-- (dharm_veer, quiz, both nitya columns and the sankalpa midpoint were not named in the decision: OFF is my assumption, to confirm.)
--
-- AGENTS.md rule 19: the OS push prompt answers "can this app push at all", never a category. The core tier is acceptable as a
-- database default ONLY because the Native onboarding shows it as visible, pre-selected choices the person can untick; an answer of
-- "Not now" on the OS prompt must still not turn anything on, and a profile created by any other path gets the same five. This is
-- a default for rows INSERTED from now on. It does not write to any existing profile.
--
-- ROC pre-flight (AGENTS.md section 4):
--  1. Function overload trap (PGRST203): no function is created, replaced or dropped.
--  2. Caller contract: a profile inserted WITHOUT these columns gets the tier above. The newest Native onboarding writes every column
--     explicitly, so its choices win. An older installed build keeps writing its own old explicit values; this cannot change that.
--     Cron selectors read `= true`, so a column that is off or NULL is never selected.
--  3. User data and opt-out safety: there is NO update. No existing value (opt-in, opt-out or NULL) is changed. Counts of
--     true/false/NULL per column must be re-read on the day it is applied; none of them can change here.
--  4. Locks: ALTER COLUMN SET DEFAULT is metadata only (brief ACCESS EXCLUSIVE, no rewrite); lock_timeout 5s fails fast.
--  5. Rollback: supabase/rollbacks/20261112100000_notification_reminders_tiered_defaults_rollback.sql.

begin;
set local lock_timeout = '5s';

alter table public.profiles
  alter column wants_shloka_reminders set default true,
  alter column japa_reminder_enabled set default true,
  alter column wants_festival_reminders set default true,
  alter column wants_vrat_reminders set default true,
  alter column wants_tithi_reminders set default true,
  alter column dharm_veer_reminder_enabled set default false,
  alter column nitya_reminder_enabled set default false,
  alter column quiz_reminder_enabled set default false,
  alter column wants_brahma_muhurta_reminders set default false,
  alter column wants_community_notifications set default false,
  alter column wants_evening_reminder set default false,
  alter column wants_family_notifications set default false,
  alter column wants_family_remembrance_reminders set default false,
  alter column wants_madhyahn_reminder set default false,
  alter column wants_mood_reminders set default false,
  alter column wants_nitya_reminders set default false,
  alter column wants_sankalpa_midpoint_reminders set default false,
  alter column wants_sattvic_reminders set default false;

-- Aborts (and rolls everything back) unless exactly the five core columns default true and the other thirteen false.
do $check$
declare
  v_bad text;
begin
  select string_agg(a.attname, ', ' order by a.attname) into v_bad
  from pg_attribute a
  left join pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum
  where a.attrelid = 'public.profiles'::regclass
    and a.attnum > 0 and not a.attisdropped
    and (a.attname like 'wants\_%' escape '\' or a.attname like '%\_reminder\_enabled' escape '\')
    and a.atttypid = 'boolean'::regtype
    and a.attname <> 'wants_sanskara_reminders'
    and coalesce(pg_get_expr(d.adbin, d.adrelid), '') <>
        case when a.attname in ('wants_shloka_reminders', 'japa_reminder_enabled', 'wants_festival_reminders',
                                'wants_vrat_reminders', 'wants_tithi_reminders') then 'true' else 'false' end;
  if v_bad is not null then
    raise exception 'notification_reminders_tiered_defaults: unexpected default on: %', v_bad;
  end if;
end
$check$;

commit;
