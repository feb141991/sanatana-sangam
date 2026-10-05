BEGIN;
SELECT plan(5);

INSERT INTO auth.users (id, raw_user_meta_data) VALUES
  ('00000000-0000-0000-0000-000000009841', '{"username":"kul_policy_9841"}'::jsonb),
  ('00000000-0000-0000-0000-000000009842', '{"username":"kul_policy_9842"}'::jsonb),
  ('00000000-0000-0000-0000-000000009843', '{"username":"kul_policy_9843"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, full_name, username, timezone, kul_id) VALUES
  ('00000000-0000-0000-0000-000000009841', 'KUL Policy 9841', 'kul_policy_9841', 'UTC', NULL),
  ('00000000-0000-0000-0000-000000009842', 'KUL Policy 9842', 'kul_policy_9842', 'UTC', NULL),
  ('00000000-0000-0000-0000-000000009843', 'KUL Policy 9843', 'kul_policy_9843', 'UTC', NULL)
ON CONFLICT (id) DO UPDATE SET
  full_name = excluded.full_name,
  username = excluded.username,
  timezone = excluded.timezone,
  kul_id = excluded.kul_id;

INSERT INTO public.kuls (id, name, invite_code, created_by) VALUES
  ('00000000-0000-0000-0000-000000009849', 'Policy Test Family', 'KULPOLICY9849', '00000000-0000-0000-0000-000000009842'),
  ('00000000-0000-0000-0000-000000009850', 'Unrelated Test Family', 'KULPOLICY9850', '00000000-0000-0000-0000-000000009843');

UPDATE public.profiles SET kul_id = '00000000-0000-0000-0000-000000009849'
WHERE id = '00000000-0000-0000-0000-000000009842';
UPDATE public.profiles SET kul_id = '00000000-0000-0000-0000-000000009850'
WHERE id = '00000000-0000-0000-0000-000000009843';

INSERT INTO public.kul_members (kul_id, user_id, role) VALUES
  ('00000000-0000-0000-0000-000000009849', '00000000-0000-0000-0000-000000009841', 'sadhak'),
  ('00000000-0000-0000-0000-000000009849', '00000000-0000-0000-0000-000000009842', 'guardian'),
  ('00000000-0000-0000-0000-000000009850', '00000000-0000-0000-0000-000000009843', 'guardian');

SELECT ok(
  NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'kul_members'
      AND policyname = 'kul_members_select'
      AND coalesce(qual, '') ~* 'from[[:space:]]+kul_members'
  ),
  'membership SELECT policy does not query its own RLS-protected table'
);

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000009841', true);
SELECT is(
  (SELECT count(*)::integer FROM public.kul_members),
  1,
  'caller can see own membership to recover a missing profile link'
);

SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000009842', true);
SELECT is(
  (SELECT count(*)::integer FROM public.kul_members),
  2,
  'linked member can see all members in their own KUL'
);

SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000009843', true);
SELECT is(
  (SELECT count(*)::integer FROM public.kul_members),
  1,
  'member cannot see rows from another KUL'
);

RESET ROLE;
SELECT ok(
  EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'kul_members'
      AND policyname = 'kul_members_select'
      AND 'authenticated' = ANY (roles)
  ),
  'membership SELECT policy is limited to authenticated users'
);

SELECT * FROM finish();
ROLLBACK;
