-- Integration assertions for 20261029160000_sanskara_reminder_preferences.sql (Sanskara tracker M1).
-- Run against an isolated Supabase branch / scratch database after applying the migration. Leaves nothing behind.
begin;

do $test$
declare
  u uuid := gen_random_uuid();
  v record;
begin
  insert into auth.users (id) values (u);

  -- A new profile: opted out, counter at zero. A client cannot start the counter anywhere else.
  insert into public.profiles (id, sanskara_opt_in_generation) values (u, 50);
  select wants_sanskara_reminders w, sanskara_opt_in_generation g into v from public.profiles where id = u;
  assert v.w = false, 'the opt-in must default to false';
  assert v.g = 0, 'an insert must not be able to choose the counter';

  -- Each preference a reminder depends on moves the counter by exactly one.
  update public.profiles set wants_sanskara_reminders = true where id = u;
  assert (select sanskara_opt_in_generation from public.profiles where id = u) = 1, 'opting in bumps the counter';
  update public.profiles set consent_religious_data = true where id = u;
  assert (select sanskara_opt_in_generation from public.profiles where id = u) = 2, 'a consent change bumps the counter';
  update public.profiles set timezone = 'Asia/Kolkata' where id = u;
  assert (select sanskara_opt_in_generation from public.profiles where id = u) = 3, 'a timezone change bumps the counter';
  update public.profiles set app_language = 'hi' where id = u;
  assert (select sanskara_opt_in_generation from public.profiles where id = u) = 4, 'a language change bumps the counter';
  update public.profiles set notification_quiet_hours_start = 22 where id = u;
  assert (select sanskara_opt_in_generation from public.profiles where id = u) = 5, 'quiet hours (start) bump the counter';
  update public.profiles set notification_quiet_hours_end = 6 where id = u;
  assert (select sanskara_opt_in_generation from public.profiles where id = u) = 6, 'quiet hours (end) bump the counter';
  update public.profiles set is_deleting = true where id = u;
  assert (select sanskara_opt_in_generation from public.profiles where id = u) = 7, 'the deletion cool-off bumps the counter';
  update public.profiles set is_deleting = false where id = u;
  assert (select sanskara_opt_in_generation from public.profiles where id = u) = 8, 'cancelling it bumps the counter again';
  update public.profiles set wants_sanskara_reminders = false where id = u;
  assert (select sanskara_opt_in_generation from public.profiles where id = u) = 9, 'opting out bumps the counter (it never goes back down)';

  -- Writing the same value, or an unrelated column, changes nothing.
  update public.profiles set wants_sanskara_reminders = false, timezone = 'Asia/Kolkata', app_language = 'hi' where id = u;
  assert (select sanskara_opt_in_generation from public.profiles where id = u) = 9, 'rewriting the same values must not bump the counter';
  update public.profiles set deletion_requested_at = now() where id = u;
  assert (select sanskara_opt_in_generation from public.profiles where id = u) = 9, 'an unrelated column must not bump the counter';

  -- The counter is not the client's to write, alone or together with a real change.
  update public.profiles set sanskara_opt_in_generation = 999 where id = u;
  assert (select sanskara_opt_in_generation from public.profiles where id = u) = 9, 'writing the counter alone changes nothing';
  update public.profiles set sanskara_opt_in_generation = 999, wants_sanskara_reminders = true where id = u;
  assert (select sanskara_opt_in_generation from public.profiles where id = u) = 10,
    'writing the counter with a real change still moves it by exactly one';
  update public.profiles set sanskara_opt_in_generation = 0, kul_id = null where id = u;
  assert (select sanskara_opt_in_generation from public.profiles where id = u) = 10, 'writing the counter beside an unrelated column changes nothing';

  -- The same holds for a signed-in client, which holds UPDATE on profiles.
  perform set_config('request.jwt.claim.sub', u::text, true);
  set local role authenticated;
  update public.profiles set sanskara_opt_in_generation = 0 where id = u;
  reset role;
  assert (select sanskara_opt_in_generation from public.profiles where id = u) = 10, 'a client cannot reset the counter';

  -- Structure and privileges.
  assert exists (select 1 from pg_constraint where conname = 'profiles_sanskara_opt_in_generation_check'),
    'the counter must be constrained to be non-negative';
  assert not has_function_privilege('authenticated', 'public.guard_sanskara_opt_in_generation()', 'execute'), 'authenticated must not call the trigger function';
  assert not has_function_privilege('anon', 'public.guard_sanskara_opt_in_generation()', 'execute'), 'anon must not call the trigger function';
end
$test$;

rollback;
