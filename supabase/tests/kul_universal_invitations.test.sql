BEGIN;
SELECT plan(10);

-- Test 1: Function preview_kul_invitation exists
SELECT has_function('public', 'preview_kul_invitation', ARRAY['text'], 'preview_kul_invitation function should exist');

-- Test 2: Function join_kul_invitation exists
SELECT has_function('public', 'join_kul_invitation', ARRAY['text'], 'join_kul_invitation function should exist');

-- Test 3: Table kul_invitations exists
SELECT has_table('public', 'kul_invitations', 'kul_invitations table should exist');

-- Test 4: Check columns on kul_invitations
SELECT has_column('public', 'kul_invitations', 'token', 'kul_invitations should have token column');
SELECT has_column('public', 'kul_invitations', 'uses_count', 'kul_invitations should have uses_count column');
SELECT has_column('public', 'kul_invitations', 'revoked_at', 'kul_invitations should have revoked_at column');

SELECT is(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.kul_invitations'::regclass),
  true,
  'kul_invitations has RLS enabled'
);

SELECT is(
  has_table_privilege('authenticated', 'public.kul_invitations', 'SELECT'),
  false,
  'authenticated clients cannot read raw bearer tokens'
);

SELECT is(
  has_function_privilege('anon', 'public.preview_kul_invitation(text)', 'EXECUTE'),
  false,
  'anonymous clients cannot call the definer preview RPC directly'
);

SELECT is(
  position('join_kul(' in pg_get_functiondef('public.join_kul_invitation(text)'::regprocedure)) > 0,
  true,
  'token join delegates membership rules to canonical join_kul'
);

SELECT * FROM finish();
ROLLBACK;
