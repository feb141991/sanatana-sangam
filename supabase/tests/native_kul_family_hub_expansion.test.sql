BEGIN;
SELECT plan(12);

SELECT has_table('public', 'kul_tirtha_wishes', 'family pilgrimage wishes table exists');
SELECT has_column('public', 'kuls', 'gotra', 'family lineage has a gotra field');
SELECT has_column('public', 'kuls', 'calendar_timezone', 'KUL stores a calendar timezone');
SELECT has_column('public', 'kul_events', 'date_system', 'family events distinguish Gregorian dates from tithi dates');
SELECT has_column('public', 'kul_events', 'tithi', 'family events can store a lunar tithi');
SELECT ok(EXISTS(SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'kul_tirtha_wishes' AND policyname = 'kul_tirtha_wishes_select'), 'Tirtha wishes are member-scoped');
SELECT has_trigger('public', 'kul_members', 'trg_preserve_kul_after_member_delete', 'member deletion runs KUL lifecycle preservation');
SELECT has_function('public', 'transfer_kul_guardian', ARRAY['uuid'], 'guardian transfer RPC exists');

INSERT INTO auth.users (id, raw_user_meta_data) VALUES
  ('00000000-0000-0000-0000-000000009301', '{"username": "test_user_9301"}'::jsonb),
  ('00000000-0000-0000-0000-000000009302', '{"username": "test_user_9302"}'::jsonb),
  ('00000000-0000-0000-0000-000000009303', '{"username": "test_user_9303"}'::jsonb)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.profiles (id, full_name, username, timezone) VALUES
  ('00000000-0000-0000-0000-000000009301', 'User 9301', 'test_user_9301', 'UTC'),
  ('00000000-0000-0000-0000-000000009302', 'User 9302', 'test_user_9302', 'UTC'),
  ('00000000-0000-0000-0000-000000009303', 'User 9303', 'test_user_9303', 'UTC')
ON CONFLICT (id) DO UPDATE SET full_name = excluded.full_name, username = excluded.username, timezone = excluded.timezone;

INSERT INTO public.kuls (id, name, invite_code, created_by)
VALUES ('00000000-0000-0000-0000-000000009399', 'Lifecycle KUL', 'LIFECYCLE9301', '00000000-0000-0000-0000-000000009301');
INSERT INTO public.kul_members (kul_id, user_id, role) VALUES
  ('00000000-0000-0000-0000-000000009399', '00000000-0000-0000-0000-000000009301', 'guardian'),
  ('00000000-0000-0000-0000-000000009399', '00000000-0000-0000-0000-000000009302', 'sadhak');

DELETE FROM public.profiles WHERE id = '00000000-0000-0000-0000-000000009301';
SELECT is((SELECT count(*)::integer FROM public.kuls WHERE id = '00000000-0000-0000-0000-000000009399'), 1, 'deleting the creator account preserves a KUL with remaining members');
SELECT is((SELECT role FROM public.kul_members WHERE kul_id = '00000000-0000-0000-0000-000000009399' AND user_id = '00000000-0000-0000-0000-000000009302'), 'guardian', 'oldest remaining member is promoted when the guardian is deleted');
SELECT is((SELECT created_by FROM public.kuls WHERE id = '00000000-0000-0000-0000-000000009399'), '00000000-0000-0000-0000-000000009302'::uuid, 'KUL attribution moves to its surviving guardian');

DELETE FROM public.profiles WHERE id = '00000000-0000-0000-0000-000000009302';
SELECT is((SELECT count(*)::integer FROM public.kuls WHERE id = '00000000-0000-0000-0000-000000009399'), 0, 'KUL is removed when its last member account is deleted');

SELECT * FROM finish();
ROLLBACK;
