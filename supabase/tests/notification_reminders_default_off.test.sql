-- Integration assertions for 20261107100000_notification_reminders_default_off.sql.
-- Run against an isolated Supabase branch / scratch database after applying the migration. Leaves nothing behind (rolled back).
begin;

do $test$
declare
  u uuid := gen_random_uuid();
  u2 uuid := gen_random_uuid();
  u3 uuid := gen_random_uuid();
  v record;
  c text;
  cols text[] := array[
    'dharm_veer_reminder_enabled', 'japa_reminder_enabled', 'nitya_reminder_enabled', 'quiz_reminder_enabled',
    'wants_brahma_muhurta_reminders', 'wants_community_notifications', 'wants_evening_reminder', 'wants_family_notifications',
    'wants_family_remembrance_reminders', 'wants_festival_reminders', 'wants_madhyahn_reminder', 'wants_mood_reminders',
    'wants_nitya_reminders', 'wants_sankalpa_midpoint_reminders', 'wants_sattvic_reminders', 'wants_shloka_reminders',
    'wants_tithi_reminders', 'wants_vrat_reminders'];
  n int;
begin
  insert into auth.users (id) values (u), (u2), (u3);

  -- 1. Every one of the 18 reminder columns now defaults to false.
  foreach c in array cols loop
    assert (select pg_get_expr(d.adbin, d.adrelid) from pg_attrdef d join pg_attribute a on a.attrelid = d.adrelid and a.attnum = d.adnum
            where d.adrelid = 'public.profiles'::regclass and a.attname = c) = 'false', c || ' must default to false';
  end loop;

  -- 2. A bare new profile (no onboarding, an older build, the auth repair) receives no reminder at all.
  insert into public.profiles (id) values (u);
  foreach c in array cols loop
    execute format('select %I from public.profiles where id = $1', c) into v using u;
    assert v is not null and (to_jsonb(v) ->> c)::boolean = false, c || ' must be false on a bare profile';
  end loop;
  assert (select wants_sanskara_reminders from public.profiles where id = u) = false, 'the Sanskara opt-in stays off';

  -- 3. A person's own explicit choice is respected: the default never overrides a value that is written.
  insert into public.profiles (id, wants_shloka_reminders, quiz_reminder_enabled, wants_brahma_muhurta_reminders)
  values (u2, true, true, false);
  assert (select wants_shloka_reminders from public.profiles where id = u2) = true, 'an explicit true is kept';
  assert (select quiz_reminder_enabled from public.profiles where id = u2) = true, 'an explicit true is kept';
  assert (select wants_brahma_muhurta_reminders from public.profiles where id = u2) = false, 'an explicit false is kept';
  assert (select wants_festival_reminders from public.profiles where id = u2) = false, 'what was not written is off';
  update public.profiles set wants_mood_reminders = true where id = u2;
  assert (select wants_mood_reminders from public.profiles where id = u2) = true, 'a later opt-in works';

  -- 4. The migration changed defaults only: rows that existed before it keep every value (the scratch seed holds three, all true).
  select count(*) into n from public.profiles where full_name = 'seed-existing';
  assert n = 3, 'the seed rows are still there';
  assert not exists (select 1 from public.profiles where full_name = 'seed-existing' and (
      wants_festival_reminders is not true or wants_brahma_muhurta_reminders is not true or quiz_reminder_enabled is not true
      or japa_reminder_enabled is not true or wants_mood_reminders is not true)), 'existing rows must not be rewritten by a default change';
  -- ...and above all it must never overwrite a person's explicit opt-out (AGENTS.md section 4): two seed rows opted out of everything.
  select count(*) into n from public.profiles where full_name = 'seed-optedout';
  assert n = 2, 'the opted-out seed rows are still there';
  foreach c in array cols loop
    assert not exists (select 1 from public.profiles p where p.full_name = 'seed-optedout' and (to_jsonb(p) ->> c)::boolean is distinct from false),
      c || ' must stay false for a person who opted out';
  end loop;

  -- 5. Neighbouring defaults are untouched: reminder times keep their defaults, and an explicit NULL is still allowed where it was.
  assert (select japa_reminder_time from public.profiles where id = u) = '07:00', 'the Japa time default is unchanged';
  assert (select quiz_reminder_time from public.profiles where id = u) = '10:00', 'the quiz time default is unchanged';
  insert into public.profiles (id, wants_evening_reminder) values (u3, null);
  assert (select wants_evening_reminder from public.profiles where id = u3) is null, 'nullable columns still accept an explicit NULL';

  -- 6. Exactly the intended columns changed: no other boolean on profiles was switched.
  assert (select count(*) from pg_attribute a join pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum
          where a.attrelid = 'public.profiles'::regclass and a.attname = any (cols) and pg_get_expr(d.adbin, d.adrelid) = 'false') = 18, 'all 18 default to false';
  assert (select pg_get_expr(d.adbin, d.adrelid) from pg_attrdef d join pg_attribute a on a.attrelid = d.adrelid and a.attnum = d.adnum
          where d.adrelid = 'public.profiles'::regclass and a.attname = 'is_unrelated_flag') = 'true', 'an unrelated default is untouched';
end
$test$;

rollback;
