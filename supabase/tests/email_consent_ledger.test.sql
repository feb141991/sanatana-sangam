-- Integration assertions for 20261106090000_email_consent_ledger.sql.
-- Run against an isolated Supabase branch / scratch database after applying the migration. Leaves nothing behind (rolled back).
-- Not for production: it creates and deletes rows.
begin;

do $test$
declare
  u uuid := gen_random_uuid();
  u2 uuid := gen_random_uuid();
  u3 uuid := gen_random_uuid();
  r jsonb;
  ev record;
  v_before int;
  v_stamp timestamptz;
begin
  insert into auth.users (id) values (u), (u2), (u3);

  -- 1. A new profile is opted out of everything, festival e-mail included, and writes no history.
  insert into public.profiles (id) values (u);
  assert (select email_festivals from public.profiles where id = u) = false, 'festival e-mail must default to OFF';
  assert (select marketing_consent from public.profiles where id = u) = false, 'marketing must default to OFF';
  assert (select email_newsletter from public.profiles where id = u) = false, 'the newsletter must default to OFF';
  assert (select count(*) from public.email_consent_events where user_id = u) = 0, 'a profile created with everything off writes no history';

  -- 2. A direct write from an app build that predates this migration is still recorded, with no invented context.
  update public.profiles set marketing_consent = true, email_newsletter = true, consent_updated_at = now() where id = u;
  assert (select count(*) from public.email_consent_events where user_id = u) = 2, 'a newsletter opt-in writes one row per changed column';
  assert exists (select 1 from public.email_consent_events where user_id = u and category = 'marketing' and action = 'granted' and source = 'client_direct'
                   and wording_version is null and region is null and region_source is null), 'marketing granted, client_direct, no context';
  assert exists (select 1 from public.email_consent_events where user_id = u and category = 'newsletter' and action = 'granted' and source = 'client_direct'
                   and wording_version is null and region is null and region_source is null), 'newsletter granted, client_direct, no context';

  -- 3. Writing the same values, or an unrelated column, writes nothing.
  update public.profiles set marketing_consent = true, email_newsletter = true where id = u;
  update public.profiles set full_name = 'x' where id = u;
  assert (select count(*) from public.email_consent_events where user_id = u) = 2, 'a no-op or unrelated write must not add history';

  -- 4. A direct withdrawal is recorded for the column that changed only.
  update public.profiles set email_newsletter = false where id = u;
  assert (select count(*) from public.email_consent_events where user_id = u) = 3, 'one more row';
  select * into ev from public.email_consent_events where user_id = u order by id desc limit 1;
  assert ev.category = 'newsletter' and ev.action = 'withdrawn' and ev.source = 'client_direct', 'the withdrawal is the newsletter column, client_direct';

  -- 5. A profile INSERTED already opted in (onboarding creates the row this way) is recorded too; NULL counts as off.
  insert into public.profiles (id, marketing_consent, email_newsletter, email_festivals) values (u2, true, true, null);
  assert (select count(*) from public.email_consent_events where user_id = u2) = 2, 'an insert with two flags on writes two rows';
  insert into public.profiles (id, marketing_consent, email_newsletter, email_festivals) values (u3, false, null, null);
  assert (select count(*) from public.email_consent_events where user_id = u3) = 0, 'an insert with everything off or null writes nothing';

  -- 6. The server entry point: grant with context. Only the column that changes gets a row.
  set local role service_role;
  r := public.set_email_consent(u, 'newsletter', true, 'settings', 'eu-uk-v1', 'DE', 'ip_header');
  reset role;
  assert (r ->> 'changed')::boolean = true, 'a real change reports changed';
  assert (r ->> 'newsletter')::boolean = true and (r ->> 'marketing')::boolean = true and (r ->> 'festivals')::boolean = false, 'state after the grant';
  select * into ev from public.email_consent_events where user_id = u order by id desc limit 1;
  assert ev.category = 'newsletter' and ev.action = 'granted' and ev.source = 'settings' and ev.wording_version = 'eu-uk-v1'
     and ev.region = 'DE' and ev.region_source = 'ip_header', 'the row carries the wording, the region and where the region came from';
  assert (select count(*) from public.email_consent_events where user_id = u) = 4, 'marketing was already on, so only the newsletter column made a row';

  -- 7. Asking for the state the person is already in changes nothing: no row, no timestamp move, no flag write.
  select consent_updated_at into v_stamp from public.profiles where id = u;
  select count(*) into v_before from public.email_consent_events where user_id = u;
  set local role service_role;
  r := public.set_email_consent(u, 'newsletter', true, 'settings', 'eu-uk-v1', 'DE', 'ip_header');
  reset role;
  assert (r ->> 'changed')::boolean = false, 'a repeat reports unchanged';
  assert (select count(*) from public.email_consent_events where user_id = u) = v_before, 'a repeat writes no row';
  assert (select consent_updated_at from public.profiles where id = u) = v_stamp, 'a repeat must not move consent_updated_at';

  -- 8. Festival e-mail is its own choice.
  set local role service_role;
  r := public.set_email_consent(u, 'festivals', true, 'settings', 'global-v1', 'IN', 'device_region');
  reset role;
  assert (r ->> 'festivals')::boolean = true and (r ->> 'newsletter')::boolean = true, 'festivals on, newsletter untouched';
  select * into ev from public.email_consent_events where user_id = u order by id desc limit 1;
  assert ev.category = 'festivals' and ev.action = 'granted' and ev.region = 'IN' and ev.region_source = 'device_region', 'festivals granted with its context';
  set local role service_role;
  r := public.set_email_consent(u, 'festivals', false, 'settings');
  reset role;
  assert (r ->> 'festivals')::boolean = false and (r ->> 'newsletter')::boolean = true, 'festivals off, newsletter untouched';
  select * into ev from public.email_consent_events where user_id = u order by id desc limit 1;
  assert ev.category = 'festivals' and ev.action = 'withdrawn' and ev.wording_version is null and ev.region is null, 'a withdrawal without context stores none';

  -- 9. Withdrawing the newsletter leaves general marketing consent alone (the existing unsubscribe semantics); "all" clears everything.
  set local role service_role;
  r := public.set_email_consent(u, 'newsletter', false, 'unsubscribe_link');
  reset role;
  assert (r ->> 'newsletter')::boolean = false and (r ->> 'marketing')::boolean = true, 'newsletter withdrawal keeps marketing';
  set local role service_role;
  perform public.set_email_consent(u, 'festivals', true, 'settings');
  perform public.set_email_consent(u, 'newsletter', true, 'settings');
  reset role;
  select count(*) into v_before from public.email_consent_events where user_id = u;
  set local role service_role;
  r := public.set_email_consent(u, 'all', false, 'one_click');
  reset role;
  assert (r ->> 'marketing')::boolean = false and (r ->> 'newsletter')::boolean = false and (r ->> 'festivals')::boolean = false, 'all three off';
  assert (select count(*) from public.email_consent_events where user_id = u) = v_before + 3, '"all" writes one row per column that was on';
  assert (select count(*) from public.email_consent_events where user_id = u and source = 'one_click' and action = 'withdrawn') = 3, 'all three are one_click withdrawals';
  set local role service_role;
  r := public.set_email_consent(u, 'all', false, 'one_click');
  reset role;
  assert (r ->> 'changed')::boolean = false, '"all" on an opted-out account changes nothing';

  -- 10. Bad input is refused with a stable code and writes nothing.
  v_before := (select count(*) from public.email_consent_events);
  begin perform public.set_email_consent(u, 'all', true, 'settings'); assert false, '"all" must be withdraw-only'; exception when sqlstate '22023' then null; end;
  begin perform public.set_email_consent(u, 'sms', true, 'settings'); assert false, 'unknown category'; exception when sqlstate '22023' then null; end;
  begin perform public.set_email_consent(u, null, true, 'settings'); assert false, 'null category'; exception when sqlstate '22023' then null; end;
  begin perform public.set_email_consent(u, 'newsletter', null, 'settings'); assert false, 'null granted'; exception when sqlstate '22023' then null; end;
  begin perform public.set_email_consent(null, 'newsletter', true, 'settings'); assert false, 'null user'; exception when sqlstate '22023' then null; end;
  begin perform public.set_email_consent(u, 'newsletter', true, 'client_direct'); assert false, 'client_direct is not a server source'; exception when sqlstate '22023' then null; end;
  begin perform public.set_email_consent(u, 'newsletter', true, 'backfill'); assert false, 'backfill is not a server source'; exception when sqlstate '22023' then null; end;
  begin perform public.set_email_consent(u, 'newsletter', true, null); assert false, 'null source'; exception when sqlstate '22023' then null; end;
  begin perform public.set_email_consent(u, 'newsletter', true, 'settings', 'Bad Wording!'); assert false, 'wording shape'; exception when sqlstate '22023' then null; end;
  begin perform public.set_email_consent(u, 'newsletter', true, 'settings', null, 'india'); assert false, 'region shape'; exception when sqlstate '22023' then null; end;
  begin perform public.set_email_consent(gen_random_uuid(), 'newsletter', true, 'settings'); assert false, 'unknown profile'; exception when sqlstate 'P0002' then null; end;
  assert (select count(*) from public.email_consent_events) = v_before, 'refused calls write no history';

  -- 11. While an account is being deleted a person can still withdraw, but nothing can be granted.
  update public.profiles set is_deleting = true where id = u;
  begin perform public.set_email_consent(u, 'newsletter', true, 'settings'); assert false, 'no grant while deleting'; exception when sqlstate '55000' then null; end;
  update public.profiles set marketing_consent = true, email_newsletter = true where id = u;
  set local role service_role;
  r := public.set_email_consent(u, 'all', false, 'unsubscribe_link');
  reset role;
  assert (r ->> 'changed')::boolean = true, 'withdrawing is allowed while deleting';
  update public.profiles set is_deleting = false where id = u;

  -- 12. The context belongs to one change: a later direct write in the same transaction must not inherit it.
  set local role service_role;
  perform public.set_email_consent(u, 'newsletter', true, 'settings', 'global-v1', 'IN', 'ip_header');
  reset role;
  update public.profiles set email_festivals = true where id = u;
  select * into ev from public.email_consent_events where user_id = u and category = 'festivals' order by id desc limit 1;
  assert ev.source = 'client_direct' and ev.wording_version is null and ev.region is null, 'a later direct write is not labelled with the previous context';

  -- 13. The trigger sanitises context it did not get from the function: a bad region or wording is dropped, an unknown source is client_direct.
  perform set_config('app.email_consent_source', 'settings', true);
  perform set_config('app.email_consent_region', 'india', true);
  perform set_config('app.email_consent_region_source', 'ip_header', true);
  perform set_config('app.email_consent_wording', 'Bad Wording!', true);
  update public.profiles set email_festivals = false where id = u;
  select * into ev from public.email_consent_events where user_id = u and category = 'festivals' order by id desc limit 1;
  assert ev.source = 'settings' and ev.region is null and ev.region_source is null and ev.wording_version is null, 'bad region and wording are dropped, a region source never outlives its region';
  perform set_config('app.email_consent_source', 'evil', true);
  perform set_config('app.email_consent_region', 'DE', true);
  perform set_config('app.email_consent_wording', 'global-v1', true);
  update public.profiles set email_festivals = true where id = u;
  select * into ev from public.email_consent_events where user_id = u and category = 'festivals' order by id desc limit 1;
  assert ev.source = 'client_direct' and ev.region is null and ev.wording_version is null, 'an unknown source drops all of the context';
  perform set_config('app.email_consent_source', '', true);
  perform set_config('app.email_consent_region', '', true);
  perform set_config('app.email_consent_region_source', '', true);
  perform set_config('app.email_consent_wording', '', true);

  -- 14. Privileges: only the service role can call the entry point; no client role can read or write the history.
  assert not has_function_privilege('anon', 'public.set_email_consent(uuid,text,boolean,text,text,text,text)', 'execute'), 'anon must not call set_email_consent';
  assert not has_function_privilege('authenticated', 'public.set_email_consent(uuid,text,boolean,text,text,text,text)', 'execute'), 'authenticated must not call set_email_consent';
  assert has_function_privilege('service_role', 'public.set_email_consent(uuid,text,boolean,text,text,text,text)', 'execute'), 'service_role must call set_email_consent';
  assert not has_function_privilege('anon', 'public.log_email_consent_change()', 'execute'), 'anon must not call the trigger function';
  assert not has_function_privilege('authenticated', 'public.log_email_consent_change()', 'execute'), 'authenticated must not call the trigger function';
  assert not has_function_privilege('authenticated', 'public.email_consent_events_immutable()', 'execute'), 'authenticated must not call the guard function';
  assert not has_table_privilege('anon', 'public.email_consent_events', 'select'), 'anon must not read the history';
  assert not has_table_privilege('authenticated', 'public.email_consent_events', 'select'), 'authenticated must not read the history';
  assert not has_table_privilege('authenticated', 'public.email_consent_events', 'insert'), 'authenticated must not write the history';
  assert not has_table_privilege('authenticated', 'public.email_consent_events', 'update'), 'authenticated must not edit the history';
  assert not has_table_privilege('authenticated', 'public.email_consent_events', 'delete'), 'authenticated must not delete the history';
  assert (select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.email_consent_events'::regclass), 'RLS enabled and forced';
  assert not exists (select 1 from pg_policy where polrelid = 'public.email_consent_events'::regclass), 'and no policy opens it';
  perform set_config('request.jwt.claim.sub', u::text, true);
  set local role authenticated;
  begin
    perform count(*) from public.email_consent_events;
    reset role;
    assert false, 'a signed-in client must not be able to read the history';
  exception when insufficient_privilege then
    reset role;
  end;
  set local role authenticated;
  begin
    perform public.set_email_consent(u, 'newsletter', true, 'settings');
    assert false, 'a signed-in client must not be able to change another consent through the entry point';
  exception when insufficient_privilege then
    null;
  end;
  reset role;

  -- 15. Shape: the ledger refuses malformed rows.
  begin insert into public.email_consent_events (user_id, category, action, source) values (u, 'sms', 'granted', 'settings'); assert false, 'category'; exception when check_violation then null; end;
  begin insert into public.email_consent_events (user_id, category, action, source) values (u, 'newsletter', 'maybe', 'settings'); assert false, 'action'; exception when check_violation then null; end;
  begin insert into public.email_consent_events (user_id, category, action, source) values (u, 'newsletter', 'granted', 'telepathy'); assert false, 'source'; exception when check_violation then null; end;
  begin insert into public.email_consent_events (user_id, category, action, source, region) values (u, 'newsletter', 'granted', 'settings', 'de'); assert false, 'region case'; exception when check_violation then null; end;
  begin insert into public.email_consent_events (user_id, category, action, source, region_source) values (u, 'newsletter', 'granted', 'settings', 'ip_header'); assert false, 'region source without a region'; exception when check_violation then null; end;
  begin insert into public.email_consent_events (user_id, category, action, source) values (gen_random_uuid(), 'newsletter', 'granted', 'settings'); assert false, 'unknown user'; exception when foreign_key_violation then null; end;

  -- 16. History is append-only, but leaves with the account.
  begin update public.email_consent_events set action = 'granted' where user_id = u; assert false, 'history must not be editable'; exception when raise_exception then
    assert sqlerrm like '%append-only%', 'the refusal says why'; end;
  assert (select count(*) from public.email_consent_events where user_id = u) > 0, 'the user has history before deletion';
  delete from auth.users where id = u;
  assert (select count(*) from public.email_consent_events where user_id = u) = 0, 'deleting the account deletes its history';
  assert (select count(*) from public.email_consent_events where user_id = u2) = 2, 'another account keeps its history';

  -- 17. Structure.
  assert exists (select 1 from pg_trigger where tgrelid = 'public.profiles'::regclass and tgname = 'profiles_log_email_consent_insert' and not tgisinternal), 'insert trigger exists';
  assert exists (select 1 from pg_trigger where tgrelid = 'public.profiles'::regclass and tgname = 'profiles_log_email_consent_update' and not tgisinternal), 'update trigger exists';
  assert exists (select 1 from pg_trigger where tgrelid = 'public.email_consent_events'::regclass and tgname = 'email_consent_events_no_update' and not tgisinternal), 'append-only trigger exists';
  assert (select count(*) from pg_proc where proname = 'set_email_consent' and pronamespace = 'public'::regnamespace) = 1, 'exactly one set_email_consent (no overload)';
end
$test$;

rollback;
