-- Tests for 20261112090000_notification_discreet_mode.sql. Plain DO-block assertions inside a rolled-back
-- transaction (scratch database or Supabase branch, after the migration). Not for production.
begin;

do $t$
declare
  c record;
  u uuid := gen_random_uuid();
begin
  select data_type, is_nullable, column_default into c
  from information_schema.columns
  where table_schema = 'public' and table_name = 'profiles' and column_name = 'notification_discreet_mode';
  assert c.data_type = 'boolean', 'the column is a boolean';
  assert c.is_nullable = 'NO', 'the column is NOT NULL: a missing value must never mean "unknown"';
  assert c.column_default = 'false', 'the default is false: nobody is switched on by default';

  -- A profile created the usual way (or by an older build that does not know the column) is off.
  insert into auth.users (id) values (u);
  insert into public.profiles (id, full_name, username) values (u, 'Discreet Test', 'discreet_' || substr(u::text, 1, 8));
  assert (select notification_discreet_mode from public.profiles where id = u) = false, 'a new profile is off';

  update public.profiles set notification_discreet_mode = true where id = u;
  assert (select notification_discreet_mode from public.profiles where id = u) = true, 'the person can switch it on';

  begin
    update public.profiles set notification_discreet_mode = null where id = u;
    assert false, 'NULL must be refused';
  exception when not_null_violation then null;
  end;

  assert (select count(*) from public.profiles where notification_discreet_mode is true) = 1,
    'only the profile the test switched on is on: the migration switched nobody on';
end
$t$;

do $t$ begin raise notice 'notification_discreet_mode: all assertions passed'; end $t$;
rollback;
