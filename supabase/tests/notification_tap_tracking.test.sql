-- Tests for 20261111100000_notification_tap_tracking.sql.
--
-- Plain DO-block assertions (no pgTAP) inside a transaction that is rolled back, so it can run on a scratch
-- database or a Supabase branch after the migration is applied. Not for production: it creates and deletes
-- rows, though everything is rolled back. Every assertion message states the rule it protects.
--
-- Callers are simulated the way the API does it: the user comes from the session claim (auth.uid()), never
-- from an argument. Grants are checked through the catalog and by switching to the anon and authenticated roles.

begin;

insert into auth.users (id) values
  ('00000000-0000-0000-0000-00000000aa01'), ('00000000-0000-0000-0000-00000000aa02'),
  ('00000000-0000-0000-0000-00000000aa03'), ('00000000-0000-0000-0000-00000000aa04'),
  ('00000000-0000-0000-0000-00000000bb01'), ('00000000-0000-0000-0000-00000000bb02'),
  ('00000000-0000-0000-0000-00000000bb03'), ('00000000-0000-0000-0000-00000000bb04'),
  ('00000000-0000-0000-0000-00000000bb05'), ('00000000-0000-0000-0000-00000000bb06'),
  ('00000000-0000-0000-0000-00000000bb07');
insert into public.profiles (id, full_name, username) values
  ('00000000-0000-0000-0000-00000000aa01', 'Tap One', 'tap_one'),
  ('00000000-0000-0000-0000-00000000aa02', 'Tap Two', 'tap_two'),
  ('00000000-0000-0000-0000-00000000aa03', 'Tap Three', 'tap_three'),
  ('00000000-0000-0000-0000-00000000aa04', 'Tap Four', 'tap_four'),
  ('00000000-0000-0000-0000-00000000bb01', 'S1', 's1'), ('00000000-0000-0000-0000-00000000bb02', 'S2', 's2'),
  ('00000000-0000-0000-0000-00000000bb03', 'S3', 's3'), ('00000000-0000-0000-0000-00000000bb04', 'S4', 's4'),
  ('00000000-0000-0000-0000-00000000bb05', 'S5', 's5'), ('00000000-0000-0000-0000-00000000bb06', 'S6', 's6'),
  ('00000000-0000-0000-0000-00000000bb07', 'S7', 's7');

-- aa01, aa02, aa04: opted in to "Help improve reminders" (aa02 also to product analytics, to prove the two purges are independent).
-- aa03: no consent. Product-analytics or religious-data consent alone must never allow a tap.
update public.profiles set consent_notification_taps = true
  where id in ('00000000-0000-0000-0000-00000000aa01', '00000000-0000-0000-0000-00000000aa02', '00000000-0000-0000-0000-00000000aa04');
update public.profiles set consent_product_analytics = true where id = '00000000-0000-0000-0000-00000000aa02';
update public.profiles set consent_product_analytics = true, consent_religious_data = true where id = '00000000-0000-0000-0000-00000000aa03';

-- The server's own send log.
insert into public.notification_deliveries (user_id, notification_key, channel, provider, type, status, dry_run, created_at) values
  ('00000000-0000-0000-0000-00000000aa01', 'quiz:k1', 'push', 'expo', 'quiz', 'sent', false, now() - interval '1 hour'),
  ('00000000-0000-0000-0000-00000000aa01', 'quiz:k1', 'push', 'expo', 'quiz', 'sent', false, now() - interval '59 minutes'),  -- second device, same notification
  ('00000000-0000-0000-0000-00000000aa01', 'post_reaction:p:q', 'push', 'expo', 'post_reaction', 'sent', false, now() - interval '1 hour'),
  ('00000000-0000-0000-0000-00000000aa01', 'dry:k', 'push', 'expo', 'quiz', 'sent', true, now() - interval '1 hour'),
  ('00000000-0000-0000-0000-00000000aa01', 'failed:k', 'push', 'expo', 'quiz', 'failed', false, now() - interval '1 hour'),
  ('00000000-0000-0000-0000-00000000aa01', 'skipped:k', 'push', 'expo', 'quiz', 'skipped', false, now() - interval '1 hour'),
  ('00000000-0000-0000-0000-00000000aa01', 'old:k', 'push', 'expo', 'quiz', 'sent', false, now() - interval '10 days'),
  ('00000000-0000-0000-0000-00000000aa01', 'email:k', 'email', 'resend', 'quiz', 'sent', false, now() - interval '1 hour'),
  ('00000000-0000-0000-0000-00000000aa04', 'quiz:k4', 'push', 'expo', 'quiz', 'sent', false, now() - interval '1 hour'),
  ('00000000-0000-0000-0000-00000000aa02', 'quiz:k2', 'push', 'expo', 'quiz', 'sent', false, now() - interval '1 hour'),
  ('00000000-0000-0000-0000-00000000aa02', 'post_reaction:p2:q2', 'push', 'expo', 'post_reaction', 'sent', false, now() - interval '1 hour'),
  ('00000000-0000-0000-0000-00000000aa03', 'quiz:k3', 'push', 'expo', 'quiz', 'sent', false, now() - interval '1 hour');

create or replace function pg_temp.as_user(p_user uuid) returns void language sql as $$
  select set_config('request.jwt.claim.sub', coalesce(p_user::text, ''), true)
$$;
create or replace function pg_temp.tap(p_event uuid, p_key text, p_at timestamptz default now(), p_state text default 'running') returns jsonb language sql as $$
  select public.record_notification_tap(p_event, p_key, p_at, p_state, '1.4.0', 'ios')
$$;

-- 1. The table is locked down and has no user-facing path.
do $t$
begin
  assert (select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.notification_taps'::regclass),
    'notification_taps must have enabled and forced RLS';
  assert not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'notification_taps'),
    'no RLS policy may expose tap rows to a user';
  assert not has_table_privilege('authenticated', 'public.notification_taps', 'select')
     and not has_table_privilege('authenticated', 'public.notification_taps', 'insert')
     and not has_table_privilege('anon', 'public.notification_taps', 'select'),
    'app roles must have no table privileges on notification_taps';
  assert has_function_privilege('authenticated', 'public.record_notification_tap(uuid,text,timestamptz,text,text,text)', 'execute'),
    'a signed-in user must be able to record a tap';
  assert not has_function_privilege('anon', 'public.record_notification_tap(uuid,text,timestamptz,text,text,text)', 'execute'),
    'a signed-out caller must not be able to record a tap';
  assert not has_function_privilege('authenticated', 'public.get_notification_tap_summary(integer,integer)', 'execute'),
    'the operator summary must not be callable by a user';
  assert not has_function_privilege('authenticated', 'public.notification_tap_recording_allowed(uuid,text)', 'execute'),
    'the consent rule must not be probeable for another account by a user';
end
$t$;

-- 1a. The table refuses bad rows even if a future caller skips the recorder.
do $t$
declare bad record;
begin
  for bad in
    select * from (values
      ('launch_state outside the allowlist', 'launch_state', '''foreground'''),
      ('notification_type with capitals/spaces', 'notification_type', '''Bad Type'''),
      ('empty notification_key', 'notification_key', ''''''),
      ('platform web', 'platform', '''web'''),
      ('malformed app_version', 'app_version', '''latest''')
    ) as cases(label, col, val)
  loop
    begin
      execute format(
        'insert into public.notification_taps (user_id, client_event_id, notification_key, notification_type, tapped_at, launch_state) values (%L, gen_random_uuid(), %L, %L, now(), %L)',
        '00000000-0000-0000-0000-00000000aa04', 'k', 'quiz', 'running') ;  -- baseline row is valid
      execute format(
        'update public.notification_taps set %I = %s where id = (select id from public.notification_taps where notification_key = ''k'' limit 1)',
        bad.col, bad.val);
      assert false, bad.label || ' must violate a check constraint';
    exception when check_violation then null;
    end;
  end loop;
  delete from public.notification_taps where notification_key = 'k';
end
$t$;

-- 1b. The recorder keeps the consent-row lock that serialises it with a withdrawal (a race cannot be run in one
-- session, so the source is checked).
do $t$
begin
  assert (select prosrc from pg_proc where proname = 'record_notification_tap' and pronamespace = 'public'::regnamespace) ~* 'for update',
    'record_notification_tap must lock the consent row so a tap racing a withdrawal cannot survive it';
  assert (select prosecdef from pg_proc where proname = 'record_notification_tap' and pronamespace = 'public'::regnamespace),
    'record_notification_tap must be SECURITY DEFINER';
  assert (select prosrc from pg_proc where proname = 'record_notification_tap' and pronamespace = 'public'::regnamespace) ~ 'auth\.uid\(\)',
    'the account must come from the session';
end
$t$;

-- 2. No session, no tap.
select pg_temp.as_user(null);
do $t$
begin
  begin
    perform pg_temp.tap('11111111-1111-1111-1111-111111111111', 'quiz:k1');
    assert false, 'a call with no session must fail';
  exception when sqlstate '42501' then null;
  end;
end
$t$;

-- 3. Consent off: nothing is stored, and the caller is told why.
select pg_temp.as_user('00000000-0000-0000-0000-00000000aa03');
do $t$
declare r jsonb;
begin
  r := pg_temp.tap('11111111-1111-1111-1111-111111111112', 'quiz:k3');
  assert r = '{"accepted":0,"consentRequired":true,"religiousConsentRequired":false,"unmatched":false}'::jsonb, 'without consent the answer is consentRequired: ' || r::text;
  assert (select count(*) from public.notification_taps) = 0, 'without consent nothing may be stored';
end
$t$;

-- 4. A real tap by a consenting account. Type and send time come from OUR log, not the client.
select pg_temp.as_user('00000000-0000-0000-0000-00000000aa01');
do $t$
declare r jsonb; v record;
begin
  r := public.record_notification_tap('21111111-1111-1111-1111-111111111111', 'quiz:k1', now(), 'cold_start', '1.4.0', 'ios');
  assert r = '{"accepted":1,"consentRequired":false,"religiousConsentRequired":false,"unmatched":false}'::jsonb, 'a matched tap is accepted: ' || r::text;
  select * into v from public.notification_taps where client_event_id = '21111111-1111-1111-1111-111111111111';
  assert v.user_id = '00000000-0000-0000-0000-00000000aa01', 'the tap belongs to the session user';
  assert v.notification_type = 'quiz', 'the type is read from the send log';
  assert v.launch_state = 'cold_start' and v.app_version = '1.4.0' and v.platform = 'ios', 'launch state, version and platform are kept';
  assert v.notification_key = 'quiz:k1', 'the key is kept';
  -- Two devices were sent the same notification: it is still one tap.
  assert (select count(*) from public.notification_taps where user_id = v.user_id) = 1, 'a notification sent to two devices records one tap';
end
$t$;

-- 5. Replaying the same event is harmless; a genuinely second tap is a second row.
do $t$
declare r jsonb;
begin
  r := pg_temp.tap('21111111-1111-1111-1111-111111111111', 'quiz:k1');
  assert (r ->> 'accepted')::integer = 0 and (r ->> 'unmatched')::boolean is false, 'a replayed event is acknowledged, not re-recorded: ' || r::text;
  assert (select count(*) from public.notification_taps where client_event_id = '21111111-1111-1111-1111-111111111111') = 1, 'a replay adds no row';
  r := pg_temp.tap('21111111-1111-1111-1111-111111111112', 'quiz:k1');
  assert (r ->> 'accepted')::integer = 1, 'a second tap on the same notification is its own row';
end
$t$;

-- 6. Only a push really sent to THIS account can be tapped.
do $t$
declare r jsonb; n integer;
begin
  select count(*) into n from public.notification_taps;
  r := pg_temp.tap('31111111-1111-1111-1111-111111111111', 'quiz:k4');           -- another account's key
  assert (r ->> 'unmatched')::boolean and (r ->> 'accepted')::integer = 0, 'another account''s key records nothing: ' || r::text;
  r := pg_temp.tap('31111111-1111-1111-1111-111111111112', 'quiz:invented');       -- never sent
  assert (r ->> 'unmatched')::boolean, 'an invented key records nothing';
  r := pg_temp.tap('31111111-1111-1111-1111-111111111113', 'dry:k');               -- dry run, never delivered
  assert (r ->> 'unmatched')::boolean, 'a dry-run send is not a delivery';
  r := pg_temp.tap('31111111-1111-1111-1111-111111111114', 'failed:k');            -- failed send
  assert (r ->> 'unmatched')::boolean, 'a failed send cannot have been tapped';
  r := pg_temp.tap('31111111-1111-1111-1111-111111111115', 'skipped:k');           -- skipped send
  assert (r ->> 'unmatched')::boolean, 'a skipped send cannot have been tapped';
  r := pg_temp.tap('31111111-1111-1111-1111-111111111116', 'email:k');             -- sent, but by e-mail
  assert (r ->> 'unmatched')::boolean, 'only a push can be tapped: an e-mail send is not a notification tap';
  assert (select count(*) from public.notification_taps) = n, 'none of the unmatched taps stored anything';
end
$t$;

-- 7. The client's clock is not trusted.
do $t$
declare r jsonb; v record;
begin
  r := public.record_notification_tap('41111111-1111-1111-1111-111111111111', 'post_reaction:p:q', now() + interval '3 days', 'running', null, null);
  assert (r ->> 'accepted')::integer = 1, 'a future-dated tap is clamped, not rejected';
  select tapped_at into v from public.notification_taps where client_event_id = '41111111-1111-1111-1111-111111111111';
  assert v.tapped_at <= now(), 'a tap cannot be in the future';
  r := public.record_notification_tap('41111111-1111-1111-1111-111111111112', 'post_reaction:p:q', now() - interval '30 days', 'running', null, null);
  assert (r ->> 'unmatched')::boolean and (r ->> 'accepted')::integer = 0, 'a tap stamped 30 days ago on a send from an hour ago is impossible and is refused, not clamped: ' || r::text;
  r := public.record_notification_tap('41111111-1111-1111-1111-111111111115', 'quiz:k1', now() - interval '3 hours', 'running', null, null);
  assert (r ->> 'unmatched')::boolean and (r ->> 'accepted')::integer = 0, 'a tap two hours before its send is impossible and is refused: ' || r::text;
  -- small skew (five minutes before the send): clamped up to the send time
  r := public.record_notification_tap('41111111-1111-1111-1111-111111111113', 'quiz:k1', now() - interval '65 minutes', 'running', null, null);
  assert (r ->> 'accepted')::integer = 1, 'a tap a few minutes before its send is clock skew and is clamped: ' || r::text;
  select tapped_at into v from public.notification_taps where client_event_id = '41111111-1111-1111-1111-111111111113';
  assert v.tapped_at >= now() - interval '61 minutes', 'a clamped tap lands on the send time, never before it (earliest delivery row)';
  r := public.record_notification_tap('41111111-1111-1111-1111-111111111114', 'old:k', now() - interval '9 days', 'running', null, null);
  assert (r ->> 'unmatched')::boolean, 'a tap on a send ten days old is stale even with a plausible timestamp';
end
$t$;

-- 8. Bad input is rejected, not stored.
do $t$
declare bad record;
begin
  for bad in
    select * from (values
      ('bad launch state', 'select pg_temp.tap(''51111111-1111-1111-1111-111111111111'', ''quiz:k1'', now(), ''foreground'')'),
      ('null launch state', 'select public.record_notification_tap(''51111111-1111-1111-1111-111111111112'', ''quiz:k1'', now(), null, null, null)'),
      ('null event id', 'select public.record_notification_tap(null, ''quiz:k1'', now(), ''running'', null, null)'),
      ('null key', 'select public.record_notification_tap(''51111111-1111-1111-1111-111111111113'', null, now(), ''running'', null, null)'),
      ('empty key', 'select public.record_notification_tap(''51111111-1111-1111-1111-111111111114'', '''', now(), ''running'', null, null)'),
      ('201-character key', 'select public.record_notification_tap(''51111111-1111-1111-1111-111111111115'', repeat(''k'', 201), now(), ''running'', null, null)'),
      ('bad platform', 'select public.record_notification_tap(''51111111-1111-1111-1111-111111111116'', ''quiz:k1'', now(), ''running'', null, ''web'')'),
      ('bad version', 'select public.record_notification_tap(''51111111-1111-1111-1111-111111111117'', ''quiz:k1'', now(), ''running'', ''v1'', null)')
    ) as cases(label, sql)
  loop
    begin
      execute bad.sql;
      assert false, bad.label || ' must be rejected';
    exception when sqlstate '22023' then null;
    end;
  end loop;
end
$t$;

-- 9. One switch covers every type (practice and social alike); the other consents are not consent to this.
select pg_temp.as_user('00000000-0000-0000-0000-00000000aa02');
do $t$
declare r jsonb;
begin
  r := pg_temp.tap('61111111-1111-1111-1111-111111111111', 'quiz:k2');
  assert (r ->> 'accepted')::integer = 1, 'a practice tap is recorded with the dedicated consent: ' || r::text;
  r := pg_temp.tap('61111111-1111-1111-1111-111111111112', 'post_reaction:p2:q2');
  assert (r ->> 'accepted')::integer = 1, 'a social tap is recorded with the dedicated consent';
  assert (select count(*) from public.notification_taps where user_id = '00000000-0000-0000-0000-00000000aa02') = 2, 'both taps were stored';
end
$t$;
select pg_temp.as_user('00000000-0000-0000-0000-00000000aa03');
do $t$
declare r jsonb;
begin
  r := pg_temp.tap('62111111-1111-1111-1111-111111111111', 'quiz:k3');
  assert (r ->> 'consentRequired')::boolean and (r ->> 'accepted')::integer = 0,
    'product-usage and religious-data consent together are NOT consent to tap recording: ' || r::text;
  assert not exists (select 1 from public.notification_taps where user_id = '00000000-0000-0000-0000-00000000aa03'), 'nothing was stored without the dedicated consent';
end
$t$;

-- 10. Withdrawing the dedicated consent deletes every tap; withdrawing the OTHER consents does not, and the analytics purge still fires.
insert into public.native_product_analytics_daily (user_id, event_name, event_date) values ('00000000-0000-0000-0000-00000000aa02', 'app_opened', current_date);
update public.profiles set consent_religious_data = false where id = '00000000-0000-0000-0000-00000000aa02';
update public.profiles set consent_product_analytics = false where id = '00000000-0000-0000-0000-00000000aa02';
do $t$
begin
  assert not exists (select 1 from public.native_product_analytics_daily where user_id = '00000000-0000-0000-0000-00000000aa02'),
    'the existing product-analytics purge still fires on its own withdrawal';
  assert (select count(*) from public.notification_taps where user_id = '00000000-0000-0000-0000-00000000aa02') = 2,
    'withdrawing product-usage or religious-data consent does not delete taps that have their own consent';
end
$t$;
update public.profiles set consent_notification_taps = false where id = '00000000-0000-0000-0000-00000000aa02';
select pg_temp.as_user('00000000-0000-0000-0000-00000000aa02');
do $t$
begin
  assert not exists (select 1 from public.notification_taps where user_id = '00000000-0000-0000-0000-00000000aa02'),
    'withdrawing the dedicated consent deletes every tap';
  assert exists (select 1 from public.notification_taps where user_id = '00000000-0000-0000-0000-00000000aa01'), 'and only that account''s taps';
  assert (pg_temp.tap('63111111-1111-1111-1111-111111111111', 'quiz:k2') ->> 'consentRequired')::boolean, 'after withdrawal the recorder asks for consent again';
end
$t$;

-- 11. The consent rule, directly.
do $t$
begin
  assert public.notification_tap_recording_allowed('00000000-0000-0000-0000-00000000aa01', 'quiz') is true, 'consented: a practice tap is allowed';
  assert public.notification_tap_recording_allowed('00000000-0000-0000-0000-00000000aa01', 'post_reaction') is true, 'consented: a social tap is allowed';
  assert public.notification_tap_recording_allowed('00000000-0000-0000-0000-00000000aa01', 'something_new') is true, 'consented: an unknown type is allowed (the switch covers every type)';
  assert public.notification_tap_recording_allowed('00000000-0000-0000-0000-00000000aa03', 'post_reaction') is false, 'product-usage and religious consent alone allow nothing';
  assert public.notification_tap_recording_allowed('00000000-0000-0000-0000-00000000aa03', 'quiz') is false, 'product-usage and religious consent alone allow nothing';
  assert public.notification_tap_recording_allowed(gen_random_uuid(), 'quiz') is false, 'an unknown account is not allowed';
  assert public.notification_tap_recording_allowed(null, 'quiz') is false, 'a null account is not allowed';
  assert (select data_type || '/' || is_nullable || '/' || column_default from information_schema.columns
          where table_schema = 'public' and table_name = 'profiles' and column_name = 'consent_notification_taps') = 'boolean/NO/false', 'the column is NOT NULL DEFAULT false';
end
$t$;

-- 12. Account deletion removes the account's taps.
do $t$
begin
  assert exists (select 1 from public.notification_taps where user_id = '00000000-0000-0000-0000-00000000aa01'), 'precondition: aa01 has taps';
  delete from auth.users where id = '00000000-0000-0000-0000-00000000aa01';
  assert not exists (select 1 from public.notification_taps where user_id = '00000000-0000-0000-0000-00000000aa01'), 'deleting the account deletes its taps';
end
$t$;

-- 13. Retention: the job exists and its command does what it says, to the day.
do $t$
declare cmd text;
begin
  select command into cmd from cron.job where jobname = 'purge-notification-taps-daily';
  assert cmd is not null, 'the retention job must be scheduled';
  assert (select schedule from cron.job where jobname = 'purge-notification-taps-daily') = '45 21 * * *', 'the retention job runs at 21:45 UTC (a free slot)';
  insert into public.notification_taps (user_id, client_event_id, notification_key, notification_type, tapped_at, recorded_at, launch_state) values
    ('00000000-0000-0000-0000-00000000aa04', '81111111-1111-1111-1111-111111111111', 'old', 'quiz', now() - interval '91 days', now() - interval '91 days', 'running'),
    ('00000000-0000-0000-0000-00000000aa04', '81111111-1111-1111-1111-111111111112', 'young', 'quiz', now() - interval '89 days', now() - interval '89 days', 'running');
  execute cmd;
  assert not exists (select 1 from public.notification_taps where notification_key = 'old'), 'a 91-day-old tap is purged';
  assert exists (select 1 from public.notification_taps where notification_key = 'young'), 'an 89-day-old tap is kept';
end
$t$;

-- 14. The operator summary: counts only, small groups suppressed, and only accounts whose taps could be recorded.
update public.profiles set consent_notification_taps = true
  where id in ('00000000-0000-0000-0000-00000000bb01', '00000000-0000-0000-0000-00000000bb02', '00000000-0000-0000-0000-00000000bb03',
               '00000000-0000-0000-0000-00000000bb04', '00000000-0000-0000-0000-00000000bb05', '00000000-0000-0000-0000-00000000bb06');
insert into public.notification_deliveries (user_id, notification_key, channel, provider, type, status, dry_run, created_at)
select p.id, 'sum:q:' || p.id, 'push', 'expo', 'quiz', 'sent', false, now() - interval '2 hours' from public.profiles p where p.username in ('s1','s2','s3','s4','s5','s6','s7');
insert into public.notification_deliveries (user_id, notification_key, channel, provider, type, status, dry_run, created_at)
select p.id, 'sum:m:' || p.id, 'push', 'expo', 'shloka', 'sent', false, now() - interval '2 hours' from public.profiles p where p.username in ('s1','s2','s3','s4');
insert into public.notification_deliveries (user_id, notification_key, channel, provider, type, status, dry_run, created_at)
select p.id, 'sum:t:' || p.id, 'push', 'expo', 'tithi', 'sent', false, now() - interval '2 hours' from public.profiles p where p.username in ('s1','s2','s3','s4','s5');
-- the same tithi notification, also sent to s1's second device
insert into public.notification_deliveries (user_id, notification_key, channel, provider, type, status, dry_run, created_at)
select p.id, 'sum:t:' || p.id, 'push', 'expo', 'tithi', 'sent', false, now() - interval '119 minutes' from public.profiles p where p.username = 's1';
-- quiz sends from 40 days ago: outside a 28-day window
insert into public.notification_deliveries (user_id, notification_key, channel, provider, type, status, dry_run, created_at)
select p.id, 'sum:old:' || p.id, 'push', 'expo', 'quiz', 'sent', false, now() - interval '40 days' from public.profiles p where p.username in ('s1','s2','s3','s4','s5','s6');
do $t$
declare u record; r jsonb; v record; n integer := 0;
begin
  for u in select id from public.profiles where username in ('s1','s2','s3') order by username loop
    perform set_config('request.jwt.claim.sub', u.id::text, true);
    r := public.record_notification_tap(gen_random_uuid(), 'sum:q:' || u.id, now(), 'running', null, null);
    assert (r ->> 'accepted')::integer = 1, 'summary fixture tap recorded';
  end loop;
  perform set_config('request.jwt.claim.sub', '', true);

  select * into v from public.get_notification_tap_summary(28, 5) where notification_type = 'quiz';
  -- Consenting recipients of a quiz in the window: s1-s6 and aa04 (aa01 is deleted, aa02 withdrew, aa03 never opted in, s7 never opted in).
  assert v.recipient_accounts = 7, 'only consenting accounts are counted as recipients; s7 (no consent) must not be the eighth: ' || coalesce(v.recipient_accounts::text, 'null');
  assert v.notifications_sent = 7 and v.taps = 3 and v.tapping_accounts = 3, 'sent 7, tapped 3 by 3 accounts: ' || row(v.*)::text;
  assert not exists (select 1 from public.get_notification_tap_summary(28, 5) where notification_type = 'shloka'),
    'a type sent to fewer than 5 consenting accounts (4) is not reported';
  assert exists (select 1 from public.get_notification_tap_summary(28, 5) where notification_type = 'tithi' and notifications_sent = 5),
    'a notification sent to two devices counts as one send, not two';
  assert exists (select 1 from public.get_notification_tap_summary(90, 5) where notification_type = 'quiz' and notifications_sent = 13),
    'a 90-day window includes the 40-day-old sends (7 + 6): the window really is the parameter';
  assert exists (select 1 from public.get_notification_tap_summary(28, 5) where notification_type = 'tithi' and recipient_accounts = 5 and taps = 0),
    'a type sent to exactly 5 consenting accounts IS reported, with its zero taps (the boundary is inclusive)';
  assert not exists (select 1 from public.get_notification_tap_summary(28, 5) where notification_type = 'post_reaction'),
    'small groups never appear';
  begin perform * from public.get_notification_tap_summary(28, 4); assert false, 'a threshold under 5 must be refused';
  exception when sqlstate '22023' then null; end;
  begin perform * from public.get_notification_tap_summary(0, 5); assert false, 'p_days 0 must be refused';
  exception when sqlstate '22023' then null; end;
  begin perform * from public.get_notification_tap_summary(91, 5); assert false, 'p_days over the retention must be refused';
  exception when sqlstate '22023' then null; end;
  -- The summary returns no user identifiers at all.
  assert pg_get_function_result('public.get_notification_tap_summary(integer,integer)'::regprocedure) !~* '(user_id|notification_key|client_event_id|key)',
    'the summary must expose no account or notification identifier';
end
$t$;

-- 15. The roles themselves, not just the catalog.
set local role anon;
do $t$
begin
  begin
    perform public.record_notification_tap('91111111-1111-1111-1111-111111111111', 'quiz:k1', now(), 'running', null, null);
    assert false, 'anon must not execute the recorder';
  exception when insufficient_privilege then null;
  end;
end
$t$;
reset role;
set local role authenticated;
do $t$
begin
  begin
    perform count(*) from public.notification_taps;
    assert false, 'a signed-in user must not read the tap table';
  exception when insufficient_privilege then null;
  end;
  begin
    perform * from public.get_notification_tap_summary(28, 5);
    assert false, 'a signed-in user must not read the summary';
  exception when insufficient_privilege then null;
  end;
end
$t$;
reset role;

do $t$ begin raise notice 'notification_tap_tracking: all assertions passed'; end $t$;
rollback;
