-- Tests for 20261003150300_unlist_deleting_accounts_from_challenge_leaderboard.
-- Plain DO-block assertions in a rolled-back transaction; run on a scratch
-- database or Supabase branch after the migration.

begin;

insert into auth.users (id, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000c1', '{"username": "lb_test_active", "full_name": "Active"}'::jsonb),
  ('00000000-0000-0000-0000-0000000000c2', '{"username": "lb_test_legacy", "full_name": "Legacy"}'::jsonb),
  ('00000000-0000-0000-0000-0000000000c3', '{"username": "lb_test_deleting", "full_name": "Deleting"}'::jsonb)
on conflict (id) do nothing;

insert into public.profiles (id, full_name, username, tradition, is_deleting) values
  ('00000000-0000-0000-0000-0000000000c1', 'Active', 'lb_test_active', 'hindu', false),
  ('00000000-0000-0000-0000-0000000000c2', 'Legacy', 'lb_test_legacy', 'hindu', false),
  ('00000000-0000-0000-0000-0000000000c3', 'Deleting', 'lb_test_deleting', 'hindu', true)
on conflict (id) do update set is_deleting = excluded.is_deleting, full_name = excluded.full_name, username = excluded.username, tradition = excluded.tradition;

insert into public.monthly_challenges (id, month, theme)
values ('00000000-0000-0000-0000-0000000000d1', '2099-01', 'leaderboard deletion test');
insert into public.challenge_packs (id, challenge_id, pack_number, title)
values ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000d1', 1, 'pack');
insert into public.user_challenge_progress (user_id, pack_id, score) values
  ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000e1', 5),
  ('00000000-0000-0000-0000-0000000000c2', '00000000-0000-0000-0000-0000000000e1', 4),
  ('00000000-0000-0000-0000-0000000000c3', '00000000-0000-0000-0000-0000000000e1', 9);

do $t$
declare ids uuid[];
begin
  select array_agg(user_id order by total_score desc) into ids
  from public.get_challenge_leaderboard('00000000-0000-0000-0000-0000000000d1');
  assert ids = array['00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000c2']::uuid[],
    format('leaderboard must list exactly the active users in score order, got %s', ids);

  update public.profiles set is_deleting = false where id = '00000000-0000-0000-0000-0000000000c3';
  select array_agg(user_id order by total_score desc) into ids
  from public.get_challenge_leaderboard('00000000-0000-0000-0000-0000000000d1');
  assert ids[1] = '00000000-0000-0000-0000-0000000000c3' and cardinality(ids) = 3,
    format('a cancelled deletion must reappear at its rank, got %s', ids);
end
$t$;

rollback;
