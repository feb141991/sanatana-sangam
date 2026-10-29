-- Reverses 20261029160000_sanskara_reminder_preferences.sql.
-- Discards profiles.wants_sanskara_reminders and profiles.sanskara_opt_in_generation. Before the tracker ships every
-- account holds false / 0, so nothing of value is lost; once reminders exist, this removes the opt-ins (people would have
-- to opt in again). Run the Sanskara M2..M6 rollbacks first if they have been applied.
begin;
drop trigger if exists guard_sanskara_opt_in_generation on public.profiles;
drop function if exists public.guard_sanskara_opt_in_generation();
alter table public.profiles drop constraint if exists profiles_sanskara_opt_in_generation_check;
alter table public.profiles
  drop column if exists wants_sanskara_reminders,
  drop column if exists sanskara_opt_in_generation;
commit;
