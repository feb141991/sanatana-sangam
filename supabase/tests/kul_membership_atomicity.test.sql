BEGIN;
SELECT plan(23);

INSERT INTO auth.users (id, raw_user_meta_data) VALUES
  ('00000000-0000-0000-0000-000000009101', '{"username": "atom_9101", "full_name": "Atom 9101"}'::jsonb),
  ('00000000-0000-0000-0000-000000009102', '{"username": "atom_9102", "full_name": "Atom 9102"}'::jsonb),
  ('00000000-0000-0000-0000-000000009103', '{"username": "atom_9103", "full_name": "Atom 9103"}'::jsonb),
  ('00000000-0000-0000-0000-000000009104', '{"username": "atom_9104", "full_name": "Atom 9104"}'::jsonb),
  ('00000000-0000-0000-0000-000000009105', '{"username": "atom_9105", "full_name": "Atom 9105"}'::jsonb),
  ('00000000-0000-0000-0000-000000009106', '{"username": "atom_9106", "full_name": "Atom 9106"}'::jsonb),
  ('00000000-0000-0000-0000-000000009107', '{"username": "atom_9107", "full_name": "Atom 9107"}'::jsonb),
  ('00000000-0000-0000-0000-000000009108', '{"username": "atom_9108", "full_name": "Atom 9108"}'::jsonb),
  ('00000000-0000-0000-0000-000000009109', '{"username": "atom_9109", "full_name": "Atom 9109"}'::jsonb),
  ('00000000-0000-0000-0000-000000009110', '{"username": "atom_9110", "full_name": "Atom 9110"}'::jsonb),
  ('00000000-0000-0000-0000-000000009111', '{"username": "atom_9111", "full_name": "Atom 9111"}'::jsonb),
  ('00000000-0000-0000-0000-000000009112', '{"username": "atom_9112", "full_name": "Atom 9112"}'::jsonb),
  ('00000000-0000-0000-0000-000000009113', '{"username": "atom_9113", "full_name": "Atom 9113"}'::jsonb),
  ('00000000-0000-0000-0000-000000009114', '{"username": "atom_9114", "full_name": "Atom 9114"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, full_name, username, timezone) VALUES
  ('00000000-0000-0000-0000-000000009101', 'Atom 9101', 'atom_9101', 'UTC'),
  ('00000000-0000-0000-0000-000000009102', 'Atom 9102', 'atom_9102', 'UTC'),
  ('00000000-0000-0000-0000-000000009103', 'Atom 9103', 'atom_9103', 'UTC'),
  ('00000000-0000-0000-0000-000000009104', 'Atom 9104', 'atom_9104', 'UTC'),
  ('00000000-0000-0000-0000-000000009105', 'Atom 9105', 'atom_9105', 'UTC'),
  ('00000000-0000-0000-0000-000000009106', 'Atom 9106', 'atom_9106', 'UTC'),
  ('00000000-0000-0000-0000-000000009107', 'Atom 9107', 'atom_9107', 'UTC'),
  ('00000000-0000-0000-0000-000000009108', 'Atom 9108', 'atom_9108', 'UTC'),
  ('00000000-0000-0000-0000-000000009109', 'Atom 9109', 'atom_9109', 'UTC'),
  ('00000000-0000-0000-0000-000000009110', 'Atom 9110', 'atom_9110', 'UTC'),
  ('00000000-0000-0000-0000-000000009111', 'Atom 9111', 'atom_9111', 'UTC'),
  ('00000000-0000-0000-0000-000000009112', 'Atom 9112', 'atom_9112', 'UTC'),
  ('00000000-0000-0000-0000-000000009113', 'Atom 9113', 'atom_9113', 'UTC'),
  ('00000000-0000-0000-0000-000000009114', 'Atom 9114', 'atom_9114', 'UTC')
ON CONFLICT (id) DO UPDATE SET full_name = excluded.full_name, username = excluded.username, timezone = excluded.timezone;

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
