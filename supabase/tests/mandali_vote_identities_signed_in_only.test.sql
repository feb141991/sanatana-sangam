-- Assertions for 20261112160000_mandali_vote_identities_signed_in_only.sql. Run on a scratch database after applying it. Rolls back.
begin;
insert into public.post_upvotes (post_id, user_id) values (1, 'aaaaaaaa-0000-0000-0000-000000000001');
insert into public.comment_upvotes (comment_id, user_id) values (1, 'aaaaaaaa-0000-0000-0000-000000000001');
insert into public.event_rsvps (post_id, user_id) values (1, 'aaaaaaaa-0000-0000-0000-000000000001');
insert into public.posts (id, content) values (1, 'a post anyone may read');

set local role anon;
do $t$ begin
  assert (select count(*) from public.post_upvotes) = 0, 'a signed-out reader sees no upvoter';
  assert (select count(*) from public.comment_upvotes) = 0, 'a signed-out reader sees no comment upvoter';
  assert (select count(*) from public.event_rsvps) = 0, 'a signed-out reader sees no RSVP';
  assert (select count(*) from public.posts) = 1, 'posts stay readable for guests';
end $t$;
reset role;

set local role authenticated;
do $t$ begin
  assert (select count(*) from public.post_upvotes) = 1, 'a signed-in reader still sees upvoters';
  assert (select count(*) from public.comment_upvotes) = 1, 'a signed-in reader still sees comment upvoters';
  assert (select count(*) from public.event_rsvps) = 1, 'a signed-in reader still sees RSVPs';
end $t$;
reset role;
rollback;
