-- Tests for 20261003150200_block_push_registration_during_deletion.
--
-- Plain DO-block assertions (no pgTAP) inside a transaction that is rolled
-- back, so it can run on a scratch database or a Supabase branch. Run as a
-- role that can execute register_native_push_token (service_role or owner).

begin;

insert into auth.users (id, raw_user_meta_data) values ('00000000-0000-0000-0000-0000000000b1', '{"username": "push_deletion_test", "full_name": "Push Deletion Test"}'::jsonb) on conflict (id) do nothing;
insert into public.profiles (id, full_name, username)
values ('00000000-0000-0000-0000-0000000000b1', 'Push Deletion Test', 'push_deletion_test')
on conflict (id) do update set full_name = excluded.full_name, username = excluded.username;

-- 1. An active account registers exactly one token.
do $t$
declare n integer; v uuid;
begin
  v := public.register_native_push_token('00000000-0000-0000-0000-0000000000b1', 'ExponentPushToken[deletion-test-1]', 'ios');
  assert v is not null, 'active account must receive a binding version';
  select count(*) into n from public.push_tokens where user_id = '00000000-0000-0000-0000-0000000000b1';
  assert n = 1, format('active account must have exactly one token, got %s', n);
end
$t$;

-- 2. A deleting account is refused with SQLSTATE SHDEL and gains no token.
do $t$
declare n integer; refused boolean := false;
begin
  update public.profiles set is_deleting = true, deletion_requested_at = now()
  where id = '00000000-0000-0000-0000-0000000000b1';
  delete from public.push_tokens where user_id = '00000000-0000-0000-0000-0000000000b1';
  begin
    perform public.register_native_push_token('00000000-0000-0000-0000-0000000000b1', 'ExponentPushToken[deletion-test-2]', 'ios');
  exception when sqlstate 'SHDEL' then refused := true;
  end;
  assert refused, 'deleting account registration must raise SHDEL';
  select count(*) into n from public.push_tokens where user_id = '00000000-0000-0000-0000-0000000000b1';
  assert n = 0, format('deleting account must have zero tokens, got %s', n);
end
$t$;

-- 3. Cancelling deletion allows registration again.
do $t$
declare n integer;
begin
  update public.profiles set is_deleting = false, deletion_requested_at = null
  where id = '00000000-0000-0000-0000-0000000000b1';
  perform public.register_native_push_token('00000000-0000-0000-0000-0000000000b1', 'ExponentPushToken[deletion-test-3]', 'ios');
  select count(*) into n from public.push_tokens where user_id = '00000000-0000-0000-0000-0000000000b1';
  assert n = 1, format('cancelled deletion must register exactly one token, got %s', n);
end
$t$;

rollback;
