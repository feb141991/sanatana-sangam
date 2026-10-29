-- Sanskara tracker, migration M1 of 6: the reminder opt-in on `profiles`.
-- Design: docs/SANSKARA_TRACKER_BACKEND_DESIGN.md (section 8); contract: docs/SANSKARA_TRACKER_AUTHORIZATION_CONTRACT.md
-- (section 8, decision D4). Nothing in this migration sends or schedules anything.
--
-- What it adds
--   * profiles.wants_sanskara_reminders: explicit, per-feature opt-in. Defaults to false and is separate from
--     wants_family_notifications (Native AGENTS.md section 19: a blanket default is not consent to a category).
--   * profiles.sanskara_opt_in_generation: a server-owned counter. It goes up by one whenever a preference a Sanskara
--     reminder depends on changes (the opt-in, the consent to religious data, timezone, language, quiet hours, or the
--     deletion cool-off). A reminder prepared under an older number is therefore recognisably stale; the send-time
--     check (a later migration) compares the number. Same idea as family_remembrance_opt_in_generation, with one
--     difference: this trigger always writes the counter, so a client cannot choose its value by writing it together
--     with an unrelated change (the remembrance trigger leaves a client-supplied value in place on one path).
--
-- Rollback guidance: supabase/rollbacks/20261029160000_sanskara_reminder_preferences_rollback.sql drops the trigger,
-- the function, the constraint and both columns. Every account holds false / 0 until the tracker ships, so nothing is
-- lost. Run the M2 rollback first if M2 has been applied (M2 does not depend on these columns, but the later
-- reminder migrations do).
--
-- Privilege review: `profiles` grants UPDATE on every column to `authenticated` (row access is by policy), so the
-- opt-in is writable by its owner, as every other opt-in is, and the counter is protected by the trigger instead of a
-- grant. The trigger function reads no table, so it is SECURITY INVOKER with an empty search_path; EXECUTE is revoked
-- from PUBLIC, anon and authenticated (a trigger needs no EXECUTE to fire).

begin;

alter table public.profiles
  add column if not exists wants_sanskara_reminders boolean not null default false,
  add column if not exists sanskara_opt_in_generation integer not null default 0;

alter table public.profiles
  drop constraint if exists profiles_sanskara_opt_in_generation_check,
  add constraint profiles_sanskara_opt_in_generation_check check (sanskara_opt_in_generation >= 0);

create or replace function public.guard_sanskara_opt_in_generation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    -- A new profile starts at zero whatever the insert supplied.
    new.sanskara_opt_in_generation := 0;
    return new;
  end if;

  if new.wants_sanskara_reminders is distinct from old.wants_sanskara_reminders
     or new.consent_religious_data is distinct from old.consent_religious_data
     or new.timezone is distinct from old.timezone
     or new.app_language is distinct from old.app_language
     or new.notification_quiet_hours_start is distinct from old.notification_quiet_hours_start
     or new.notification_quiet_hours_end is distinct from old.notification_quiet_hours_end
     or new.is_deleting is distinct from old.is_deleting then
    new.sanskara_opt_in_generation := old.sanskara_opt_in_generation + 1;
  else
    -- Nothing a reminder depends on changed: the counter keeps its value, so a client writing it directly changes nothing.
    new.sanskara_opt_in_generation := old.sanskara_opt_in_generation;
  end if;
  return new;
end;
$$;

revoke all on function public.guard_sanskara_opt_in_generation() from public, anon, authenticated;

drop trigger if exists guard_sanskara_opt_in_generation on public.profiles;
create trigger guard_sanskara_opt_in_generation
  before insert or update of wants_sanskara_reminders, consent_religious_data, timezone, app_language,
    notification_quiet_hours_start, notification_quiet_hours_end, is_deleting, sanskara_opt_in_generation
  on public.profiles
  for each row execute function public.guard_sanskara_opt_in_generation();

comment on column public.profiles.wants_sanskara_reminders is
  'Explicit opt-in for Sanskara tracker reminders. Defaults to false; never inferred from another notification preference or from the OS push permission.';
comment on column public.profiles.sanskara_opt_in_generation is
  'Server-managed. Incremented by guard_sanskara_opt_in_generation whenever a preference that Sanskara reminders depend on changes, so a reminder prepared earlier can be recognised as stale. Client writes are ignored.';

commit;
