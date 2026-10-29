-- Integration assertions for 20261029100000_ai_chat_answer_cache.sql.
-- Run against an isolated Supabase branch/local database after applying the migration. Leaves nothing behind.
begin;

do $test$
declare
  u uuid := gen_random_uuid();
  k text := repeat('a', 64);
  n int;
begin
  insert into auth.users (id) values (u);

  -- Security: forced RLS, no policy, and no table rights for anyone but the service role.
  assert (select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.ai_chat_answer_cache'::regclass),
    'row level security must be enabled and forced';
  assert not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'ai_chat_answer_cache'),
    'no policy may exist: the table is reached through the service role only';
  assert not has_table_privilege('anon', 'public.ai_chat_answer_cache', 'select'), 'anon must not read';
  assert not has_table_privilege('authenticated', 'public.ai_chat_answer_cache', 'select'), 'authenticated must not read';
  assert not has_table_privilege('authenticated', 'public.ai_chat_answer_cache', 'insert'), 'authenticated must not write';
  assert has_table_privilege('service_role', 'public.ai_chat_answer_cache', 'select, insert, delete'), 'service_role needs access';

  -- First answer wins: a second writer for the same person and question cannot replace it.
  insert into public.ai_chat_answer_cache (user_id, cache_key, answer, prompt_fingerprint, corpus_version, expires_at)
  values (u, k, 'first answer', 'fp', '2026-10-29', now() + interval '14 days');
  insert into public.ai_chat_answer_cache (user_id, cache_key, answer, prompt_fingerprint, corpus_version, expires_at)
  values (u, k, 'second answer', 'fp', '2026-10-29', now() + interval '14 days')
  on conflict (user_id, cache_key) do nothing;
  assert (select answer from public.ai_chat_answer_cache where user_id = u and cache_key = k) = 'first answer',
    'the first stored answer must stand';
  assert (select count(*) from public.ai_chat_answer_cache where user_id = u) = 1, 'one row per person and question';

  -- Bad data is refused by the table itself.
  begin
    insert into public.ai_chat_answer_cache (user_id, cache_key, answer, prompt_fingerprint, corpus_version, expires_at)
    values (u, 'not-a-hash', 'x', 'fp', 'v', now() + interval '1 day');
    assert false, 'a key that is not a SHA-256 hex digest must be refused';
  exception when check_violation then null;
  end;
  begin
    insert into public.ai_chat_answer_cache (user_id, cache_key, answer, prompt_fingerprint, corpus_version, expires_at)
    values (u, repeat('b', 64), '', 'fp', 'v', now() + interval '1 day');
    assert false, 'an empty answer must be refused';
  exception when check_violation then null;
  end;
  begin
    insert into public.ai_chat_answer_cache (user_id, cache_key, answer, prompt_fingerprint, corpus_version, expires_at)
    values (u, repeat('c', 64), repeat('x', 8001), 'fp', 'v', now() + interval '1 day');
    assert false, 'an answer over 8000 characters must be refused';
  exception when check_violation then null;
  end;
  begin
    insert into public.ai_chat_answer_cache (user_id, cache_key, answer, prompt_fingerprint, corpus_version, created_at, expires_at)
    values (u, repeat('d', 64), 'x', 'fp', 'v', now(), now() - interval '1 day');
    assert false, 'a row that expires before it was created must be refused';
  exception when check_violation then null;
  end;

  -- The answer goes with the account.
  delete from auth.users where id = u;
  select count(*) into n from public.ai_chat_answer_cache where user_id = u;
  assert n = 0, 'deleting the account must delete the remembered answers';

  -- The daily purge is scheduled.
  assert exists (select 1 from cron.job where jobname = 'purge-ai-chat-answer-cache-daily'), 'purge job must be scheduled';
end
$test$;

rollback;
