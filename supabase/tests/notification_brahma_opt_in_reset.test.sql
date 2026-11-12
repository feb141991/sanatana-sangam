-- Assertions for 20261112110000_notification_brahma_opt_in_reset.sql. Run on a scratch database seeded with seed_labels
-- (onb_post_brahma_on, onb_post_brahma_off, onb_pre_brahma_on, onb_pre_brahma_off, never_brahma_on, never_null_brahma_on, never_brahma_off)
-- BEFORE the migration ran, then after applying it. Rolls back.
begin;
do $test$
declare
  victim uuid;
begin
  -- 1. The one deliberate opt-in (finished onboarding after the cutoff) keeps Brahma Muhurta.
  assert (select wants_brahma_muhurta_reminders from public.profiles p join public.seed_labels s using (id) where s.label = 'onb_post_brahma_on') is true,
    'a post-cutoff onboarded opt-in stays on';
  assert (select count(*) from public.profiles where wants_brahma_muhurta_reminders is true) = 1, 'exactly one profile has Brahma on';

  -- 2. The uncertain cohort is switched off, whether it finished onboarding or not.
  assert not exists (select 1 from public.profiles p join public.seed_labels s using (id)
                     where s.label in ('onb_pre_brahma_on', 'never_brahma_on', 'never_null_brahma_on') and p.wants_brahma_muhurta_reminders is distinct from false),
    'pre-cutoff and never-onboarded Brahma are off';

  -- 3. Explicit off / NULL are not written: only true -> false rows are in the backup.
  assert (select count(*) from public.notification_brahma_reset_backup_20261112) = 3, 'three rows backed up';
  assert not exists (select 1 from public.notification_brahma_reset_backup_20261112 b join public.seed_labels s on s.id = b.user_id
                     where s.label in ('onb_post_brahma_on', 'onb_post_brahma_off', 'onb_pre_brahma_off', 'never_brahma_off')),
    'untouched people have no backup row';
  assert (select wants_brahma_muhurta_reminders from public.profiles p join public.seed_labels s using (id) where s.label = 'never_brahma_off') is null,
    'a NULL is left as NULL';

  -- 4. No other reminder moved: everyone, including never-onboarded profiles, keeps the other 17 switches.
  assert (select count(*) from public.profiles where wants_mood_reminders is true) = 6, 'mood untouched (6 of 7 seeds, one explicit off)';
  assert (select wants_festival_reminders from public.profiles p join public.seed_labels s using (id) where s.label = 'onb_pre_brahma_off') is false, 'explicit opt-outs untouched';
  assert (select count(*) from public.profiles where wants_sanskara_reminders is not false) = 0, 'Sanskara untouched';

  -- 5. The backup is private and leaves with the account.
  assert not has_table_privilege('anon', 'public.notification_brahma_reset_backup_20261112', 'select'), 'anon cannot read the backup';
  assert not has_table_privilege('authenticated', 'public.notification_brahma_reset_backup_20261112', 'update'), 'authenticated cannot write the backup';
  assert (select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.notification_brahma_reset_backup_20261112'::regclass), 'RLS enabled and forced';
  assert not exists (select 1 from pg_policy where polrelid = 'public.notification_brahma_reset_backup_20261112'::regclass), 'no policy opens it';
  select user_id into victim from public.notification_brahma_reset_backup_20261112 limit 1;
  delete from auth.users where id = victim;
  assert not exists (select 1 from public.notification_brahma_reset_backup_20261112 where user_id = victim), 'backup row goes with the account';
end
$test$;
rollback;
