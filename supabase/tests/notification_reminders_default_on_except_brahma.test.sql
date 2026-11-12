-- Assertions for 20261112100000_notification_reminders_default_on_except_brahma.sql. Run on a scratch database after applying it. Rolls back.
begin;
do $test$
declare
  u uuid := gen_random_uuid(); u2 uuid := gen_random_uuid();
  c text;
  core text[] := array['dharm_veer_reminder_enabled', 'japa_reminder_enabled', 'nitya_reminder_enabled', 'quiz_reminder_enabled', 'wants_community_notifications', 'wants_evening_reminder', 'wants_family_notifications', 'wants_family_remembrance_reminders', 'wants_festival_reminders', 'wants_madhyahn_reminder', 'wants_mood_reminders', 'wants_nitya_reminders', 'wants_sankalpa_midpoint_reminders', 'wants_sattvic_reminders', 'wants_shloka_reminders', 'wants_tithi_reminders', 'wants_vrat_reminders'];
  rest text[] := array['wants_brahma_muhurta_reminders'];
  v boolean;
begin
  insert into auth.users (id) values (u), (u2);
  insert into public.profiles (id) values (u);

  -- 1. A bare new profile gets every reminder ON except Brahma Muhurta.
  foreach c in array core loop
    execute format('select %I from public.profiles where id = $1', c) into v using u;
    assert v is true, c || ' must be ON for a bare new profile';
  end loop;
  foreach c in array rest loop
    execute format('select %I from public.profiles where id = $1', c) into v using u;
    assert v is false, c || ' must be OFF for a bare new profile';
  end loop;
  assert (select wants_sanskara_reminders from public.profiles where id = u) is false, 'Sanskara opt-in stays off';
  assert array_length(core, 1) + array_length(rest, 1) = 18, 'all 18 columns are classified';

  -- 2. An explicit choice always wins over the tier, in both directions.
  insert into public.profiles (id, wants_shloka_reminders, wants_brahma_muhurta_reminders) values (u2, false, true);
  assert (select wants_shloka_reminders from public.profiles where id = u2) is false, 'explicit off beats an ON default';
  assert (select wants_brahma_muhurta_reminders from public.profiles where id = u2) is true, 'explicit on beats the OFF Brahma default';

  -- 3. Defaults only: existing rows keep every value (the seed rows hold the old true defaults and one explicit opt-out).
  assert (select count(*) from public.profiles p join public.seed_labels s on s.id = p.id
          where p.wants_mood_reminders is true and p.wants_sattvic_reminders is true and p.wants_family_notifications is true) >= 6,
    'existing rows must not be rewritten by a default change';
  assert (select wants_mood_reminders from public.profiles p join public.seed_labels s on s.id = p.id where s.label = 'onb_pre_brahma_off') is false,
    'an existing opt-out is untouched';

  -- 4. Neighbouring defaults are untouched.
  assert (select japa_reminder_time from public.profiles where id = u) = '07:00', 'Japa default time unchanged';
  assert (select quiz_reminder_time from public.profiles where id = u) = '10:00', 'quiz default time unchanged';
end
$test$;
rollback;
