-- Tests for 20261003150400_account_deletion_notices. Rolled back; run on a
-- scratch database or Supabase branch after the migration.

begin;

insert into auth.users (id) values ('00000000-0000-0000-0000-0000000000f1') on conflict (id) do nothing;

do $t$
declare n integer;
begin
  insert into public.account_deletion_notices (user_id, deletion_requested_at, kind)
  values ('00000000-0000-0000-0000-0000000000f1', '2026-10-01T10:00:00Z', 'scheduled')
  on conflict do nothing;
  insert into public.account_deletion_notices (user_id, deletion_requested_at, kind)
  values ('00000000-0000-0000-0000-0000000000f1', '2026-10-01T10:00:00Z', 'scheduled')
  on conflict do nothing;
  select count(*) into n from public.account_deletion_notices where user_id = '00000000-0000-0000-0000-0000000000f1';
  assert n = 1, format('a notice must be recorded once per request and kind, got %s', n);

  begin
    insert into public.account_deletion_notices (user_id, deletion_requested_at, kind)
    values ('00000000-0000-0000-0000-0000000000f1', '2026-10-01T10:00:00Z', 'marketing');
    assert false, 'unknown kinds must be rejected';
  exception when check_violation then null;
  end;

  assert not has_table_privilege('anon', 'public.account_deletion_notices', 'select'), 'anon must not read the ledger';
  assert not has_table_privilege('authenticated', 'public.account_deletion_notices', 'select'), 'authenticated must not read the ledger';

  delete from auth.users where id = '00000000-0000-0000-0000-0000000000f1';
  select count(*) into n from public.account_deletion_notices where user_id = '00000000-0000-0000-0000-0000000000f1';
  assert n = 0, 'notices must be removed with the user';
end
$t$;

rollback;
