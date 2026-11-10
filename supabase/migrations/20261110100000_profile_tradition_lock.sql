-- Profile tradition lock. NOT applied to any database by this commit.
-- Native and the retired web app both treat a person's tradition as locked once onboarding is complete (shoonaya-mobile app/(tabs)/profile.tsx
-- "tradition is locked at signup"; nothing in either app changes it afterwards). The database did not enforce that: `authenticated` holds
-- column UPDATE on profiles.tradition, the only row policy checks ownership, and no trigger watches the column. Anyone signed in could change
-- their own tradition with a direct Supabase call, silently desyncing everything keyed to it (sacred text choice, Nitya Karma steps, festival
-- filtering, Sanskara reminders, which languages Settings offers).
--
-- Rule, enforced for the API roles `authenticated` and `anon` only (service_role, postgres and other administrative roles are exempt, so an
-- admin or a support fix still works):
--   1. once a profile has onboarding_completed = true, its tradition cannot change;
--   2. once a profile has onboarding_completed = true, onboarding_completed cannot be set back to anything but true, because that would be
--      the way round rule 1 (clear the flag, change the tradition, set the flag again).
-- A write that does not change either value passes, so ordinary updates and the onboarding upsert's re-sends of unchanged values are fine.
-- Before onboarding is complete nothing is restricted: the tradition may be set, changed and withdrawn (planTraditionTap, planConsentChange),
-- and the final onboarding write sets tradition and onboarding_completed = true in one UPDATE (OLD.onboarding_completed is not true, so it passes).
--
-- ROC pre-flight (AGENTS.md section 4):
--   1. Function overload trap (PGRST203): one NEW function name, public.guard_profile_tradition_lock(); no existing function is created
--      or replaced, so no overload. It returns trigger and is not callable as an RPC.
--   2. Callers: Native onboarding (UPDATE, then upsert fallback: the upsert's conflict branch is an UPDATE with OLD.onboarding_completed not
--      true, so it passes); the Native profile PATCH route has no `tradition` or `onboarding_completed` in its allow-lists; Settings consent
--      withdrawal sends consent_religious_data only and leaves tradition untouched; account deletion sets is_deleting columns only. The
--      only code that sets onboarding_completed false is profile creation (value false on a new row, or the first write on a row whose OLD
--      value is not true). Admin and cron paths use the service role and are exempt. Older app builds behave the same as current ones.
--   3. Data and opt-outs: no UPDATE, no default or column change, nothing touches a reminder or consent flag. Production on 2026-11-10: 32
--      profiles, 22 with onboarding_completed = true, 0 of them with a NULL tradition, so no completed profile is stranded by this rule.
--   4. Locks: CREATE TRIGGER takes a SHARE ROW EXCLUSIVE lock on public.profiles for the length of the statement (milliseconds; no scan, no
--      rewrite). lock_timeout 5s so it fails fast instead of queueing behind a long transaction. Apply outside the :01/:03/:05/:11/:13/:15
--      cron windows, like the earlier profile-trigger migrations.
--   5. Rollback: supabase/rollbacks/20261110100000_profile_tradition_lock_rollback.sql drops the trigger and the function.
-- Product consequence to confirm: a completed profile on tradition 'none' (Universal / Exploring) also cannot pick a tradition later. No
-- screen offers that today, and a change of tradition must re-run the onboarding logic that personalises everything else (profile.tsx note).

begin;
set local lock_timeout = '5s';

create function public.guard_profile_tradition_lock() returns trigger
language plpgsql set search_path = ''
as $$
begin
  -- Only the API roles are restricted. current_user is the invoking role (this function is SECURITY INVOKER; PostgREST runs as `authenticated`).
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;

  if old.onboarding_completed is true then
    if new.tradition is distinct from old.tradition then
      raise exception 'profile_tradition_locked' using errcode = '42501',
        detail = 'The tradition cannot be changed after onboarding is complete.';
    end if;
    if new.onboarding_completed is not true then
      raise exception 'profile_tradition_locked' using errcode = '42501',
        detail = 'Onboarding cannot be reopened once it is complete.';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.guard_profile_tradition_lock() from public;

create trigger guard_profile_tradition_lock
  before update of tradition, onboarding_completed on public.profiles
  for each row execute function public.guard_profile_tradition_lock();

commit;
