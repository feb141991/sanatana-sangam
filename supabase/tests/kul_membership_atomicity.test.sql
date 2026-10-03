BEGIN;
SELECT plan(23);

INSERT INTO auth.users (id) VALUES
  ('00000000-0000-0000-0000-000000009101'),
  ('00000000-0000-0000-0000-000000009102'),
  ('00000000-0000-0000-0000-000000009103'),
  ('00000000-0000-0000-0000-000000009104'),
  ('00000000-0000-0000-0000-000000009105'),
  ('00000000-0000-0000-0000-000000009106'),
  ('00000000-0000-0000-0000-000000009107'),
  ('00000000-0000-0000-0000-000000009108'),
  ('00000000-0000-0000-0000-000000009109'),
  ('00000000-0000-0000-0000-000000009110'),
  ('00000000-0000-0000-0000-000000009111'),
  ('00000000-0000-0000-0000-000000009112'),
  ('00000000-0000-0000-0000-000000009113'),
  ('00000000-0000-0000-0000-000000009114')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, timezone) VALUES
  ('00000000-0000-0000-0000-000000009101', 'UTC'),
  ('00000000-0000-0000-0000-000000009102', 'UTC'),
  ('00000000-0000-0000-0000-000000009103', 'UTC'),
  ('00000000-0000-0000-0000-000000009104', 'UTC'),
  ('00000000-0000-0000-0000-000000009105', 'UTC'),
  ('00000000-0000-0000-0000-000000009106', 'UTC'),
  ('00000000-0000-0000-0000-000000009107', 'UTC'),
  ('00000000-0000-0000-0000-000000009108', 'UTC'),
  ('00000000-0000-0000-0000-000000009109', 'UTC'),
  ('00000000-0000-0000-0000-000000009110', 'UTC'),
  ('00000000-0000-0000-0000-000000009111', 'UTC'),
  ('00000000-0000-0000-0000-000000009112', 'UTC'),
  ('00000000-0000-0000-0000-000000009113', 'UTC'),
  ('00000000-0000-0000-0000-000000009114', 'UTC')
ON CONFLICT (id) DO NOTHING;

CREATE TEMP TABLE native_kul_test_ids (kind text PRIMARY KEY, id uuid NOT NULL);

SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000009101', true);
INSERT INTO native_kul_test_ids
SELECT 'free', (public.create_kul('Atomicity Family', '🏡', 'NATKUL000001') ->> 'id')::uuid;
SELECT is((SELECT count(*)::integer FROM public.kul_members WHERE kul_id = (SELECT id FROM native_kul_test_ids WHERE kind = 'free')), 1, 'new KUL creator is the first family member');
SELECT is((public.create_kul('Retry name', '🌿', 'NATKUL000099') ->> 'id')::uuid, (SELECT id FROM native_kul_test_ids WHERE kind = 'free'), 'retrying create returns the existing KUL idempotently');
SELECT is((SELECT count(*)::integer FROM public.kuls WHERE invite_code IN ('NATKUL000001', 'NATKUL000099')), 1, 'retrying create does not create a second KUL');
SELECT is(public.kul_member_limit((SELECT id FROM native_kul_test_ids WHERE kind = 'free')), 6, 'every KUL has the same six-member launch limit');

SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000009102', true);
SELECT lives_ok($$SELECT public.join_kul('NATKUL000001')$$, 'first invited member joins');
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000009103', true);
SELECT lives_ok($$SELECT public.join_kul('NATKUL000001')$$, 'second invited member joins');
SELECT lives_ok($$SELECT public.join_kul('NATKUL000001')$$, 'joining the same KUL again is idempotent');
SELECT is((SELECT count(*)::integer FROM public.kul_members WHERE kul_id = (SELECT id FROM native_kul_test_ids WHERE kind = 'free')), 3, 'idempotent join does not duplicate a member');

SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000009104', true);
SELECT lives_ok($$SELECT public.create_kul('Second Family', '🌿', 'NATKUL000002')$$, 'a user without a KUL may create one');
SELECT throws_ok(
  $$SELECT public.join_kul('NATKUL000001')$$,
  'P0001',
  'You are already in a family circle. Leave it first.',
  'a member cannot join a second KUL'
);

SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000009106', true);
SELECT lives_ok($$SELECT public.join_kul('NATKUL000001')$$, 'KUL accepts member four');
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000009107', true);
SELECT lives_ok($$SELECT public.join_kul('NATKUL000001')$$, 'KUL accepts member five');
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000009108', true);
SELECT lives_ok($$SELECT public.join_kul('NATKUL000001')$$, 'KUL accepts member six');
SELECT is((SELECT count(*)::integer FROM public.kul_members WHERE kul_id = (SELECT id FROM native_kul_test_ids WHERE kind = 'free')), 6, 'KUL can reach its uniform six-member limit');
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000009109', true);
SELECT throws_ok(
  $$SELECT public.join_kul('NATKUL000001')$$,
  'P0001',
  'This family circle has reached its member limit',
  'KUL rejects a seventh member'
);

UPDATE public.kuls SET is_pro = true WHERE invite_code = 'NATKUL000002';
SELECT is(public.kul_member_limit((SELECT id FROM public.kuls WHERE invite_code = 'NATKUL000002')), 6, 'legacy Pro marker does not change the free-launch member limit');

SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000009109', true);
SELECT lives_ok($$SELECT public.join_kul('NATKUL000002')$$, 'second KUL accepts member two');
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000009110', true);
SELECT lives_ok($$SELECT public.join_kul('NATKUL000002')$$, 'second KUL accepts member three');
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000009111', true);
SELECT lives_ok($$SELECT public.join_kul('NATKUL000002')$$, 'second KUL accepts member four');
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000009112', true);
SELECT lives_ok($$SELECT public.join_kul('NATKUL000002')$$, 'second KUL accepts member five');
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000009113', true);
SELECT lives_ok($$SELECT public.join_kul('NATKUL000002')$$, 'second KUL accepts member six');
SELECT is((SELECT count(*)::integer FROM public.kul_members WHERE kul_id = (SELECT id FROM public.kuls WHERE invite_code = 'NATKUL000002')), 6, 'second KUL reaches but does not exceed six members');
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000009114', true);
SELECT throws_ok(
  $$SELECT public.join_kul('NATKUL000002')$$,
  'P0001',
  'This family circle has reached its member limit',
  'second KUL rejects a seventh member'
);

SELECT * FROM finish();
ROLLBACK;
