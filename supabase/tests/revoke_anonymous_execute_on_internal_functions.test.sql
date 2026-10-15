-- Integration assertions for 20261016090000_revoke_anonymous_execute_on_internal_functions.sql.
-- Run against an isolated Supabase branch/local database after applying the migration; read-only.
begin;

do $test$
declare
  f text;
  r text;
begin
  -- Nobody anonymous can run any of the three.
  foreach f in array array[
    'public.get_challenge_leaderboard(uuid, text)',
    'public.kul_member_limit(uuid)',
    'public.handle_post_upvote_activity()'
  ] loop
    assert not has_function_privilege('anon', f, 'execute'), 'anon must not execute ' || f;
    assert not has_function_privilege('public', f, 'execute'), 'PUBLIC must not execute ' || f;
    assert has_function_privilege('service_role', f, 'execute'), 'service_role must keep ' || f;
  end loop;

  -- The one the signed-in API route calls stays callable by signed-in users.
  assert has_function_privilege('authenticated', 'public.get_challenge_leaderboard(uuid, text)', 'execute'),
    'authenticated must keep get_challenge_leaderboard';

  -- The two internal ones are not callable by signed-in users.
  assert not has_function_privilege('authenticated', 'public.kul_member_limit(uuid)', 'execute'),
    'authenticated must not execute kul_member_limit';
  assert not has_function_privilege('authenticated', 'public.handle_post_upvote_activity()', 'execute'),
    'authenticated must not execute handle_post_upvote_activity';

  -- The public RPCs the apps use are untouched by this migration.
  foreach f in array array['public.create_kul(text, text, text)', 'public.join_kul(text)', 'public.leave_kul()'] loop
    if to_regprocedure(f) is not null then
      assert has_function_privilege('authenticated', f, 'execute'), 'authenticated must keep ' || f;
    end if;
  end loop;
end
$test$;

rollback;
