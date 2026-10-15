BEGIN;
SELECT plan(8);

INSERT INTO auth.users (id, raw_user_meta_data) VALUES
  ('00000000-0000-0000-0000-000000009981', '{"username":"chart_owner_9981"}'::jsonb),
  ('00000000-0000-0000-0000-000000009982', '{"username":"chart_other_9982"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, full_name, username, timezone) VALUES
  ('00000000-0000-0000-0000-000000009981', 'Chart Owner 9981', 'chart_owner_9981', 'UTC'),
  ('00000000-0000-0000-0000-000000009982', 'Chart Other 9982', 'chart_other_9982', 'UTC')
ON CONFLICT (id) DO NOTHING;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000009981', true);

INSERT INTO public.birth_profiles (
  owner_id, label, full_name, relation, date_of_birth, birth_city, birth_country,
  birth_lat, birth_lng, birth_timezone, rashi, chart_data, is_primary, idempotency_key
) VALUES (
  '00000000-0000-0000-0000-000000009981', 'Me', 'Synthetic Chart', 'self', '1990-04-12',
  'Ujjain', 'IN', 23.1765, 75.7885, 'Asia/Kolkata', 'Makara',
  '{"planets":[{"planet":"Moon","longitude":281.25}]}'::jsonb, true,
  '11111111-1111-4111-8111-111111111111'
);

SELECT is((SELECT count(*)::integer FROM public.birth_profiles), 1, 'owner can read the chart row immediately after insert');
SELECT is((SELECT chart_data->'planets'->0->>'planet' FROM public.birth_profiles LIMIT 1), 'Moon', 'saved chart payload can be read back intact');
SELECT is((SELECT rashi FROM public.birth_profiles LIMIT 1), 'Makara', 'denormalized chart summary is persisted with chart data');
SELECT is((SELECT count(*)::integer FROM public.birth_profiles WHERE owner_id = auth.uid()), 1, 'row ownership is tied to the authenticated account');
SELECT lives_ok(
  $$INSERT INTO public.birth_profiles (owner_id, label, date_of_birth, is_primary) VALUES ('00000000-0000-0000-0000-000000009981', 'Second Chart', '1991-05-13', true)$$,
  'an account can retain multiple charts; primary selection is managed by the API'
);
SELECT throws_ok(
  $$INSERT INTO public.birth_profiles (owner_id, label, date_of_birth, idempotency_key) VALUES ('00000000-0000-0000-0000-000000009981', 'Retry duplicate', '1991-05-13', '11111111-1111-4111-8111-111111111111')$$,
  '23505', null, 'database prevents duplicate chart rows for a retried request key'
);

SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000009982', true);
SELECT is((SELECT count(*)::integer FROM public.birth_profiles), 0, 'another account cannot read the owner chart');
UPDATE public.birth_profiles SET label = 'Unauthorized edit' WHERE owner_id = '00000000-0000-0000-0000-000000009981';
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000009981', true);
SELECT is((SELECT count(*)::integer FROM public.birth_profiles WHERE owner_id = auth.uid() AND label = 'Me'), 1, 'another account cannot mutate the owner chart');

RESET ROLE;
SELECT * FROM finish();
ROLLBACK;
