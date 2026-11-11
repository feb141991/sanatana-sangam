-- Reminder defaults for a NEW profile: everything ON except Brahma Muhurta. NOT applied to any database by this commit.
-- Founder decision 2026-11-12 ("keep only Brahma Muhurta off, the rest all on; the user can switch off what they don't want").
-- Supersedes the all-OFF defaults of 20261107100000 (apply that first, or skip it: this migration sets every one of the 18 columns, so
-- the end state is the same either way).
--
-- Default ON (17): shloka, Japa (default time 07:00 is a separate column default, untouched), festival, vrat, tithi, mood, sattvic,
--   evening, midday, community, family, family remembrance, Dharm Veer, quiz, both Nitya columns, Sankalpa midpoint.
-- Default OFF (1): wants_brahma_muhurta_reminders (opt-in; founder 2026-10-11). wants_sanskara_reminders is not touched (stays false).
--
-- AGENTS.md rule 19: the OS push prompt answers "can this app push at all", never a category. ON-by-default is acceptable only because
-- the Native onboarding shows every category as its own visible, pre-selected choice the person can untick, and Settings lists each one
-- with a toggle. "Not now" on the OS prompt must still not turn anything on. This is a default for rows INSERTED from now on; it does
-- not write to any existing profile. (The send side is bounded separately by the one-nudge-a-day cadence, migration 20261110140000.)
--
-- ROC pre-flight (AGENTS.md section 4):
--  1. Function overload trap (PGRST203): no function is created, replaced or dropped.
--  2. Caller contract: a profile inserted WITHOUT these columns gets the defaults above. The newest Native onboarding writes every column
--     explicitly, so its choices win. Cron selectors read `= true`, so a column that is off or NULL is never selected.
--  3. User data and opt-out safety: there is NO update. No existing value (opt-in, opt-out or NULL) is changed. Re-read the true/false/NULL
--     counts per column on the day it is applied; none can change here.
--  4. Locks: ALTER COLUMN SET DEFAULT is metadata only (brief ACCESS EXCLUSIVE, no rewrite); lock_timeout 5s fails fast.
--  5. Rollback: supabase/rollbacks/20261112100000_notification_reminders_default_on_except_brahma_rollback.sql.

begin;
set local lock_timeout = '5s';

alter table public.profiles
  alter column dharm_veer_reminder_enabled set default true,
  alter column japa_reminder_enabled set default true,
  alter column nitya_reminder_enabled set default true,
  alter column quiz_reminder_enabled set default true,
  alter column wants_brahma_muhurta_reminders set default false,
  alter column wants_community_notifications set default true,
  alter column wants_evening_reminder set default true,
  alter column wants_family_notifications set default true,
  alter column wants_family_remembrance_reminders set default true,
  alter column wants_festival_reminders set default true,
  alter column wants_madhyahn_reminder set default true,
  alter column wants_mood_reminders set default true,
  alter column wants_nitya_reminders set default true,
  alter column wants_sankalpa_midpoint_reminders set default true,
  alter column wants_sattvic_reminders set default true,
  alter column wants_shloka_reminders set default true,
  alter column wants_tithi_reminders set default true,
  alter column wants_vrat_reminders set default true;

-- Aborts (and rolls everything back) unless every reminder column defaults true except Brahma Muhurta, which defaults false.
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
        case when a.attname = 'wants_brahma_muhurta_reminders' then 'false' else 'true' end;
  if v_bad is not null then
    raise exception 'notification_reminders_default_on_except_brahma: unexpected default on: %', v_bad;
  end if;
end
$check$;

commit;
