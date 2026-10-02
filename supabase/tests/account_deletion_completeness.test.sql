-- Tests for 20261003150000_account_deletion_purge_completeness and
-- 20261003150100_skip_notifications_for_deleting_accounts.
--
-- Plain DO-block assertions (no pgTAP) inside a transaction that is rolled
-- back, so it can run on a scratch database or a Supabase branch. Run after
-- both migrations are applied. Not for production: it creates and deletes
-- rows, though everything is rolled back.

begin;

insert into auth.users (id) values
  ('00000000-0000-0000-0000-0000000000a1'),
  ('00000000-0000-0000-0000-0000000000a2')
on conflict (id) do nothing;

insert into public.profiles (id, full_name, username) values
  ('00000000-0000-0000-0000-0000000000a1', 'Active Test', 'deletion_test_active'),
  ('00000000-0000-0000-0000-0000000000a2', 'Deleting Test', 'deletion_test_deleting')
on conflict (id) do nothing;

update public.profiles set is_deleting = true, deletion_requested_at = now()
where id = '00000000-0000-0000-0000-0000000000a2';

-- 1. Notifications: a deleting account gets nothing, an active one still does.
do $t$
declare n integer;
begin
  insert into public.notifications (user_id, title, body, type) values
    ('00000000-0000-0000-0000-0000000000a1', 'active', 'x', 'festival'),
    ('00000000-0000-0000-0000-0000000000a2', 'deleting routine', 'x', 'festival'),
    ('00000000-0000-0000-0000-0000000000a2', 'deleting nitya', 'x', 'nitya'),
    ('00000000-0000-0000-0000-0000000000a2', 'deleting security', 'x', 'security');

  select count(*) into n from public.notifications where user_id = '00000000-0000-0000-0000-0000000000a1' and title = 'active';
  assert n = 1, format('active account must still receive notifications, got %s', n);

  select count(*) into n from public.notifications where user_id = '00000000-0000-0000-0000-0000000000a2' and title in ('deleting routine', 'deleting nitya');
  assert n = 0, format('deleting account must receive no routine notifications, got %s', n);

  select count(*) into n from public.notifications where user_id = '00000000-0000-0000-0000-0000000000a2' and title = 'deleting security';
  assert n = 1, format('transactional notices must still reach a deleting account, got %s', n);
end
$t$;

-- 2. Cancelling the deletion restores delivery immediately.
do $t$
declare n integer;
begin
  update public.profiles set is_deleting = false, deletion_requested_at = null
  where id = '00000000-0000-0000-0000-0000000000a2';
  insert into public.notifications (user_id, title, body, type)
  values ('00000000-0000-0000-0000-0000000000a2', 'after cancel', 'x', 'festival');
  select count(*) into n from public.notifications where title = 'after cancel';
  assert n = 1, 'a cancelled deletion must receive notifications again';
end
$t$;

-- 3. Delete rules.
do $t$
declare rule "char";
begin
  select confdeltype into rule from pg_constraint where conname = 'dharm_veers_reviewed_by_fkey';
  assert rule = 'n', format('dharm_veers.reviewed_by must be SET NULL, got %s', rule);
  select confdeltype into rule from pg_constraint where conname = 'kuls_pro_activated_by_fkey';
  assert rule = 'n', format('kuls.pro_activated_by must be SET NULL, got %s', rule);

  for rule in
    select confdeltype from pg_constraint where conname in (
      'pathshala_circle_members_user_id_fkey', 'pathshala_enrollments_user_id_fkey',
      'pathshala_progress_user_id_fkey', 'pathshala_recordings_user_id_fkey',
      'pathshala_user_badges_user_id_fkey', 'pathshala_verse_mastery_user_id_fkey',
      'pathshala_recitation_reviews_reviewer_id_fkey', 'push_receipts_pending_user_id_fkey')
  loop
    assert rule = 'c', 'per-user tables must cascade with the user';
  end loop;
  assert (select count(*) from pg_constraint where conname in (
      'pathshala_circle_members_user_id_fkey', 'pathshala_enrollments_user_id_fkey',
      'pathshala_progress_user_id_fkey', 'pathshala_recordings_user_id_fkey',
      'pathshala_user_badges_user_id_fkey', 'pathshala_verse_mastery_user_id_fkey',
      'pathshala_recitation_reviews_reviewer_id_fkey', 'push_receipts_pending_user_id_fkey')) = 8,
    'all eight per-user foreign keys must exist';
end
$t$;

-- 4. Deleting the auth user removes a push receipt row that previously survived.
do $t$
declare n integer;
begin
  insert into public.push_receipts_pending (user_id, ticket_id, token)
  values ('00000000-0000-0000-0000-0000000000a1', 'deletion-test-ticket', 'deletion-test-token');
  delete from auth.users where id = '00000000-0000-0000-0000-0000000000a1';
  select count(*) into n from public.push_receipts_pending where ticket_id = 'deletion-test-ticket';
  assert n = 0, format('push receipts must be removed with the user, %s survived', n);
end
$t$;

-- 5. Regression guard: a per-user uuid column with no foreign key means the
--    purge silently leaves that data behind. Add the foreign key, or add the
--    table to this list with the reason it is intentionally exempt.
do $t$
declare leftover text;
begin
  select string_agg(c.table_name || '.' || c.column_name, ', ' order by c.table_name) into leftover
  from information_schema.columns c
  join information_schema.tables t
    on t.table_schema = c.table_schema and t.table_name = c.table_name and t.table_type = 'BASE TABLE'
  where c.table_schema = 'public' and c.data_type = 'uuid'
    and c.column_name ~* '(user|owner|author|creator|created_by|updated_by|member|host|student|teacher|sender|recipient|reviewer|reviewed_by|actor|profile|blocker|blocked|inviter|invitee|uid)'
    and c.column_name <> 'id'
    and (c.table_name || '.' || c.column_name) not in (
      -- Creator of a study circle: cascade would delete other members' circle and
      -- SET NULL would orphan it, so ownership needs a product decision.
      'pathshala_study_circles.created_by',
      -- Lock holder token, not a user.
      'notification_resolver_lock.owner_id')
    and not exists (
      select 1 from pg_constraint k
      where k.contype = 'f' and k.conrelid = (c.table_schema || '.' || c.table_name)::regclass
        and k.conkey = array[(select attnum from pg_attribute
                              where attrelid = (c.table_schema || '.' || c.table_name)::regclass and attname = c.column_name)]);
  assert leftover is null, format('per-user columns without a foreign key: %s', leftover);
end
$t$;

rollback;
