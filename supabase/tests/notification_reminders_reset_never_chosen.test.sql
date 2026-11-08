-- Integration assertions for 20261108100000_notification_reminders_reset_never_chosen.sql (option B).
-- Run against an isolated Supabase branch / scratch database after applying the migration. Leaves nothing behind (rolled back).
begin;

do $test$
declare
  cols text[] := array['dharm_veer_reminder_enabled', 'japa_reminder_enabled', 'nitya_reminder_enabled', 'quiz_reminder_enabled', 'wants_brahma_muhurta_reminders', 'wants_community_notifications', 'wants_evening_reminder', 'wants_family_notifications', 'wants_family_remembrance_reminders', 'wants_festival_reminders', 'wants_madhyahn_reminder', 'wants_mood_reminders', 'wants_nitya_reminders', 'wants_sankalpa_midpoint_reminders', 'wants_sattvic_reminders', 'wants_shloka_reminders', 'wants_tithi_reminders', 'wants_vrat_reminders'];
  c text;
  n int;
  v jsonb;
  r record;
  deliberate uuid;
  victim uuid;
begin
  -- helper: the 18 reminder switches of a profile as jsonb
  -- (CREATE TABLE AS cannot see a PL/pgSQL variable, so the array goes in as a literal.)
  execute format($f$
    create temp table _now on commit drop as
      select p.id, s.label, s.flags as before_flags,
             (select jsonb_object_agg(k, v) from jsonb_each(to_jsonb(p)) e(k, v) where k = any (%L::text[]) or k = 'wants_sanskara_reminders') as now_flags,
             p.onboarding_completed
      from public.profiles p join public.seed_labels s on s.id = p.id
  $f$, cols);

  -- 1. The one person who finished onboarding after the cutoff and has Brahma Muhurta ON keeps it, and everything else of theirs.
  select id into deliberate from _now where label = 'onb_post_brahma_on';
  assert (select now_flags ->> 'wants_brahma_muhurta_reminders' from _now where id = deliberate) = 'true', 'the deliberate Brahma opt-in stays on';
  assert (select now_flags from _now where id = deliberate) = (select before_flags from _now where id = deliberate), 'and none of that person''s other switches move';
  assert (select count(*) from public.profiles where wants_brahma_muhurta_reminders is true) = 1, 'exactly one profile has Brahma Muhurta on';

  -- 2. Everybody who never finished onboarding has every reminder off (including the profile whose onboarding flag is NULL); Sanskara is untouched.
  for r in select * from _now where label in ('never_pre', 'never_post', 'never_null') loop
    foreach c in array cols loop
      assert (r.now_flags ->> c) = 'false', r.label || ': ' || c || ' must be off for a profile that never finished onboarding';
    end loop;
  end loop;
  assert (select count(*) from _now where label in ('never_pre', 'never_post', 'never_null')) = 11, 'all 11 never-onboarded rows are present';
  assert (select now_flags ->> 'wants_sanskara_reminders' from _now where label = 'never_null') = 'true', 'Sanskara reminders are not part of the reset';
  assert (select count(*) from public.profiles where onboarding_completed is not true and wants_sanskara_reminders is true) = 1, 'and onboarding flags were not changed';

  -- 3. Finished onboarding before the migration overwrote it: Brahma off, the other 17 switches exactly as they were.
  for r in select * from _now where label in ('onb_pre_brahma_on', 'onb_sanskara') loop
    assert (r.now_flags ->> 'wants_brahma_muhurta_reminders') = 'false', r.label || ': Brahma off';
    assert (r.now_flags - 'wants_brahma_muhurta_reminders') = (r.before_flags - 'wants_brahma_muhurta_reminders'), r.label || ': nothing else moved';
  end loop;
  assert (select now_flags ->> 'wants_sanskara_reminders' from _now where label = 'onb_sanskara') = 'true', 'Sanskara stays on for the person who opted in';

  -- 4. Everyone else is byte-for-byte unchanged: an explicit Brahma off, explicit opt-outs, mixed choices.
  for r in select * from _now where label in ('onb_pre_brahma_off', 'onb_post_brahma_off', 'onb_optout') loop
    assert r.now_flags = r.before_flags, r.label || ' must not change at all';
  end loop;
  assert (select (now_flags ->> 'wants_mood_reminders') from _now where label = 'onb_pre_brahma_off') = 'false', 'an explicit opt-out is never overwritten';

  -- 5. The backup holds the old values of exactly the rows that changed, with the reason.
  assert (select count(*) from public.notification_reset_backup_20261108) = 22, '11 never-onboarded + 11 Brahma-not-chosen rows are backed up';
  assert (select count(*) from public.notification_reset_backup_20261108 where reason = 'never_finished_onboarding') = 11, 'reason: never finished onboarding';
  assert (select count(*) from public.notification_reset_backup_20261108 where reason = 'brahma_not_chosen') = 11, 'reason: Brahma not chosen';
  assert not exists (select 1 from public.notification_reset_backup_20261108 where user_id in (select id from _now where label in ('onb_post_brahma_on', 'onb_optout', 'onb_post_brahma_off', 'onb_pre_brahma_off'))),
    'people who were not touched have no backup row';
  for r in select b.*, s.flags, n.label from public.notification_reset_backup_20261108 b join public.seed_labels s on s.id = b.user_id join _now n on n.id = b.user_id loop
    v := to_jsonb(r);
    foreach c in array cols loop
      assert (v ->> c) is not distinct from (r.flags ->> c), r.label || ': the backup keeps the previous value of ' || c;
    end loop;
  end loop;

  -- 6. The backup is private and leaves with the account.
  assert not has_table_privilege('anon', 'public.notification_reset_backup_20261108', 'select'), 'anon must not read the backup';
  assert not has_table_privilege('authenticated', 'public.notification_reset_backup_20261108', 'select'), 'authenticated must not read the backup';
  assert not has_table_privilege('authenticated', 'public.notification_reset_backup_20261108', 'update'), 'authenticated must not write the backup';
  assert (select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.notification_reset_backup_20261108'::regclass), 'RLS enabled and forced';
  assert not exists (select 1 from pg_policy where polrelid = 'public.notification_reset_backup_20261108'::regclass), 'no policy opens it';
  select user_id into victim from public.notification_reset_backup_20261108 limit 1;
  delete from auth.users where id = victim;
  assert not exists (select 1 from public.notification_reset_backup_20261108 where user_id = victim), 'the backup row goes with the account';

  -- 7. Reminder times and everything else on the profile are untouched.
  assert (select count(*) from public.profiles where japa_reminder_time is distinct from '07:00') = 0, 'reminder times are untouched';
end
$test$;

rollback;
