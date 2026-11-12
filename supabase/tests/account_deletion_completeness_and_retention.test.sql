-- Assertions for 20261112130000_account_deletion_completeness_and_retention.sql. Run on a scratch database after applying it. Rolls back.
begin;
do $test$
declare
  u uuid := gen_random_uuid(); u2 uuid := gen_random_uuid(); k uuid := gen_random_uuid(); k2 uuid := gen_random_uuid();
  job text;
begin
  insert into auth.users (id) values (u), (u2);

  -- 1. Deleting an account that created a family-link invitation now works and removes the invitation.
  insert into public.kul_family_link_invitations (id, created_by) values (gen_random_uuid(), u);
  -- 3. Push-token events (they hold the token) go with the account.
  insert into public.push_token_events (id, user_id, token) values (gen_random_uuid(), u, 'ExponentPushToken[x]');
  -- 2. A study circle keeps existing, with no creator.
  insert into public.pathshala_study_circles (id, created_by) values (gen_random_uuid(), u);
  delete from auth.users where id = u;
  assert not exists (select 1 from public.kul_family_link_invitations), 'invitation removed with its creator';
  assert not exists (select 1 from public.push_token_events where token = 'ExponentPushToken[x]'), 'token events removed with the account';
  assert (select count(*) from public.pathshala_study_circles where created_by is null) = 1, 'study circle kept, creator cleared';

  -- Events that arrived before sign-in (no user) are not erased by deletion of someone else.
  insert into public.push_token_events (id, user_id, token) values (gen_random_uuid(), null, 'pre-login');
  delete from auth.users where id = u2;
  assert exists (select 1 from public.push_token_events where token = 'pre-login'), 'pre-login events are untouched by an unrelated deletion';

  -- 4. The four jobs exist and each deletes what it says, and only that.
  assert (select count(*) from cron.job where jobname in ('purge-push-token-events-daily', 'purge-notification-deliveries-daily', 'purge-notification-dispatch-events-daily', 'purge-orphan-kuls-daily')) = 4, 'four jobs';
  insert into public.push_token_events (id, user_id, token, created_at) values (gen_random_uuid(), null, 'old', now() - interval '91 days'), (gen_random_uuid(), null, 'recent', now() - interval '89 days');
  for job in select command from cron.job where jobname = 'purge-push-token-events-daily' loop execute job; end loop;
  assert not exists (select 1 from public.push_token_events where token = 'old'), 'a 91-day-old event is purged';
  assert exists (select 1 from public.push_token_events where token = 'recent'), 'an 89-day-old event is kept';

  insert into public.notification_deliveries (id, created_at) values (gen_random_uuid(), now() - interval '91 days'), (gen_random_uuid(), now() - interval '1 day');
  for job in select command from cron.job where jobname = 'purge-notification-deliveries-daily' loop execute job; end loop;
  assert (select count(*) from public.notification_deliveries) = 1, 'only the old delivery is purged';

  -- Orphan circles: an old one with no member goes (with its family members); one with a member, and a new one, stay.
  insert into public.kuls (id, created_at) values (k, now() - interval '2 days'), (k2, now() - interval '2 days'), (gen_random_uuid(), now());
  insert into public.kul_family_members (id, kul_id) values (gen_random_uuid(), k);
  insert into auth.users (id) values (gen_random_uuid());
  insert into public.kul_members (id, kul_id, user_id) select gen_random_uuid(), k2, id from auth.users limit 1;
  for job in select command from cron.job where jobname = 'purge-orphan-kuls-daily' loop execute job; end loop;
  assert not exists (select 1 from public.kuls where id = k), 'an old circle with no member is removed';
  assert not exists (select 1 from public.kul_family_members where kul_id = k), 'its family members go with it';
  assert exists (select 1 from public.kuls where id = k2), 'a circle with a member stays';
  assert (select count(*) from public.kuls) = 2, 'a circle created today stays';
end
$test$;
rollback;
