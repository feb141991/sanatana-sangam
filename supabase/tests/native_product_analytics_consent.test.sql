begin;
select plan(24);

insert into auth.users (id, raw_user_meta_data) values
  ('00000000-0000-0000-0000-000000009971', '{"username":"product_analytics_9971"}'::jsonb),
  ('00000000-0000-0000-0000-000000009972', '{"username":"product_analytics_9972"}'::jsonb)
on conflict (id) do nothing;

insert into public.profiles (id, full_name, username, timezone)
values
  ('00000000-0000-0000-0000-000000009971', 'Analytics Test 9971', 'product_analytics_9971', 'UTC'),
  ('00000000-0000-0000-0000-000000009972', 'Analytics Test 9972', 'product_analytics_9972', 'UTC')
on conflict (id) do nothing;

select is(
  (select consent_product_analytics from public.profiles where id = '00000000-0000-0000-0000-000000009971'),
  false,
  'product analytics consent defaults off'
);
select ok(
  (select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.native_product_analytics_daily'::regclass),
  'analytics daily table has enabled and forced RLS'
);
select is(
  (select count(*)::integer from pg_policies where schemaname = 'public' and tablename = 'native_product_analytics_daily'),
  0,
  'no user-facing RLS policy exposes analytics rows'
);

insert into public.native_product_analytics_daily (user_id, event_name, event_date)
values ('00000000-0000-0000-0000-000000009971', 'app_opened', current_date);
delete from auth.users where id = '00000000-0000-0000-0000-000000009971';
select is(
  (select count(*)::integer from public.native_product_analytics_daily where user_id = '00000000-0000-0000-0000-000000009971'),
  0,
  'account deletion cascades and removes its analytics history'
);
select throws_ok(
  $$insert into public.native_product_analytics_daily (user_id, event_name, event_date) values ('00000000-0000-0000-0000-000000009972', 'mood_logged', current_date)$$,
  '23514',
  null,
  'database rejects events outside the fixed allowlist'
);
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000009972', true);
select throws_ok(
  $$select public.record_native_product_analytics(array[null]::text[], '1.2.3', 'ios')$$,
  '22023', null,
  'database rejects a null event name instead of failing later during insertion'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000009972', true);
select is(
  public.record_native_product_analytics(array['app_opened'], '1.2.3', 'ios'),
  '{"accepted":0,"consentRequired":true,"religiousConsentRequired":false}'::jsonb,
  'recording RPC fails closed while consent is off'
);
update public.profiles set consent_product_analytics = true where id = auth.uid();
select is(
  public.record_native_product_analytics(array['practice_completed'], '1.2.3', 'ios'),
  '{"accepted":0,"consentRequired":false,"religiousConsentRequired":true}'::jsonb,
  'practice events also require the separate religious-data consent'
);
select is(
  public.record_native_product_analytics(array['app_opened'], '1.2.3', 'ios'),
  '{"accepted":1,"consentRequired":false,"religiousConsentRequired":false}'::jsonb,
  'consented event is stored through the authenticated RPC'
);
select is(
  public.record_native_product_analytics(array['app_opened'], '1.2.3', 'ios'),
  '{"accepted":0,"consentRequired":false,"religiousConsentRequired":false}'::jsonb,
  'same event is deduplicated within the UTC day'
);
reset role;
select is(
  (select count(*)::integer from public.native_product_analytics_daily where user_id = auth.uid()),
  1,
  'daily unique event constraint keeps one record'
);
select is(
  (select count(*)::integer from public.get_native_product_analytics_summary(28)),
  0,
  'admin summary suppresses event/day cohorts below twenty accounts'
);
select ok(
  not has_table_privilege('authenticated', 'public.native_product_analytics_daily', 'SELECT')
  and not has_table_privilege('anon', 'public.native_product_analytics_daily', 'SELECT'),
  'anonymous and authenticated clients cannot read event-level analytics rows'
);
select ok(
  not has_function_privilege('authenticated', 'public.get_native_product_analytics_summary(integer)', 'EXECUTE'),
  'authenticated users cannot call the aggregate-only admin summary'
);

-- Exercise the exact disclosure boundary with synthetic accounts in the test DB.
insert into auth.users (id, raw_user_meta_data)
select ('10000000-0000-0000-0000-' || lpad(n::text, 12, '0'))::uuid,
       jsonb_build_object('username', 'analytics_cohort_' || n)
from generate_series(1, 20) as n
on conflict (id) do nothing;
insert into public.profiles (id, full_name, username, timezone)
select ('10000000-0000-0000-0000-' || lpad(n::text, 12, '0'))::uuid,
       'Analytics cohort ' || n, 'analytics_cohort_' || n, 'UTC'
from generate_series(1, 20) as n
on conflict (id) do nothing;
insert into public.native_product_analytics_daily (user_id, event_name, event_date)
select ('10000000-0000-0000-0000-' || lpad(n::text, 12, '0'))::uuid,
       'practice_started', (timezone('utc', now()))::date
from generate_series(1, 19) as n;
select is(
  (select count(*)::integer from public.get_native_product_analytics_summary(28) where event_name = 'practice_started' and event_date = (timezone('utc', now()))::date),
  0,
  'admin aggregate suppresses a cohort with nineteen distinct accounts'
);
insert into public.native_product_analytics_daily (user_id, event_name, event_date)
values ('10000000-0000-0000-0000-000000000020', 'practice_started', (timezone('utc', now()))::date);
select is(
  (select opted_in_accounts from public.get_native_product_analytics_summary(28) where event_name = 'practice_started' and event_date = (timezone('utc', now()))::date),
  20,
  'admin aggregate becomes visible at twenty distinct accounts'
);
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000009972', true);
update public.profiles set consent_religious_data = true where id = auth.uid();
select is(
  public.record_native_product_analytics(array['practice_completed'], '1.2.3', 'ios'),
  '{"accepted":1,"consentRequired":false,"religiousConsentRequired":false}'::jsonb,
  'practice event is accepted only after both independent consents are on'
);
select is(
  public.record_native_product_analytics(array['practice_completed'], '1.2.3', 'ios'),
  '{"accepted":0,"consentRequired":false,"religiousConsentRequired":false}'::jsonb,
  'practice event is deduplicated within the UTC day'
);
update public.profiles set consent_religious_data = false where id = auth.uid();
reset role;
select is(
  (select count(*)::integer from public.native_product_analytics_daily where user_id = auth.uid() and event_name like 'practice_%'),
  0,
  'turning off religious-data consent erases prior practice events'
);
select is(
  (select count(*)::integer from public.native_product_analytics_daily where user_id = auth.uid()),
  1,
  'religious-data withdrawal preserves non-practice product events while product consent remains on'
);
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000009972', true);
select is(public.withdraw_native_product_analytics(), 1, 'product analytics withdrawal deletes remaining events');
select is(
  (select consent_product_analytics from public.profiles where id = auth.uid()),
  false,
  'withdrawal atomically turns off the server consent flag'
);
reset role;
select is(
  (select count(*)::integer from public.native_product_analytics_daily where user_id = auth.uid()),
  0,
  'withdrawal removes retained events'
);
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000009972', true);
select is(
  public.record_native_product_analytics(array['app_opened'], '1.2.3', 'ios'),
  '{"accepted":0,"consentRequired":true,"religiousConsentRequired":false}'::jsonb,
  'events are refused after withdrawal'
);
reset role;

select * from finish();
rollback;
