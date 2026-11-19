-- Assertions for 20261119183000_support_tickets_system.sql. Run on a scratch database after applying it. Rolls back.
begin;
do $test$
declare
  u uuid := gen_random_uuid(); t uuid := gen_random_uuid(); t_guest uuid := gen_random_uuid(); t_old uuid := gen_random_uuid();
  job text;
begin
  insert into auth.users (id) values (u);
  insert into public.support_tickets (id, ticket_number, access_token_hash, user_id, seeker_name, seeker_email, category, subject, description)
    values (t, 'TKT-202611-AAAAAA', 'h1', u, 'A', 'a@example.com', 'general', 's', 'd');
  insert into public.support_ticket_messages (ticket_id, user_id, sender_type, sender_name, message) values (t, u, 'seeker', 'A', 'm');
  insert into public.support_ticket_messages (ticket_id, user_id, sender_type, sender_name, message, is_internal_note) values (t, null, 'admin', 'staff', 'note', true);

  -- A ticket needs an access code hash.
  begin
    insert into public.support_tickets (ticket_number, seeker_name, seeker_email, category, subject, description) values ('TKT-202611-BBBBBB', 'B', 'b@example.com', 'general', 's', 'd');
    assert false, 'a ticket without an access code hash must be refused';
  exception when not_null_violation then null; end;

  -- Bounds: oversize description and metadata are refused by the database, not only by the API.
  begin
    insert into public.support_tickets (ticket_number, access_token_hash, seeker_name, seeker_email, category, subject, description) values ('TKT-202611-CCCCCC', 'h', 'C', 'c@example.com', 'general', 's', repeat('x', 4001));
    assert false, 'a description over 4000 characters must be refused';
  exception when check_violation then null; end;

  -- No INSERT policy exists, so the anon and authenticated keys cannot write directly.
  assert not exists (select 1 from pg_policies where tablename in ('support_tickets', 'support_ticket_messages') and cmd = 'INSERT'), 'no direct INSERT policy';
  assert not exists (select 1 from pg_policies where tablename in ('support_tickets', 'support_ticket_messages') and cmd = 'ALL' and policyname not like 'Admins%'), 'only the admin policies cover all commands';

  -- Deleting the account deletes its tickets and messages (the internal note goes with the ticket).
  insert into public.support_tickets (id, ticket_number, access_token_hash, user_id, seeker_name, seeker_email, category, subject, description)
    values (t_guest, 'TKT-202611-DDDDDD', 'h2', null, 'G', 'g@example.com', 'general', 's', 'd');
  delete from auth.users where id = u;
  assert not exists (select 1 from public.support_tickets where id = t), 'owner ticket removed with the account';
  assert not exists (select 1 from public.support_ticket_messages where ticket_id = t), 'its messages removed too';
  assert exists (select 1 from public.support_tickets where id = t_guest), 'a guest ticket is not touched by an unrelated deletion';

  -- Retention: only resolved or closed tickets older than 365 days are purged.
  insert into public.support_tickets (id, ticket_number, access_token_hash, seeker_name, seeker_email, category, subject, description, status, updated_at)
    values (t_old, 'TKT-202511-EEEEEE', 'h3', 'O', 'o@example.com', 'general', 's', 'd', 'resolved', now() - interval '366 days'),
           (gen_random_uuid(), 'TKT-202511-FFFFFF', 'h4', 'O', 'o@example.com', 'general', 's', 'd', 'open', now() - interval '366 days'),
           (gen_random_uuid(), 'TKT-202611-GGGGGG', 'h5', 'O', 'o@example.com', 'general', 's', 'd', 'resolved', now() - interval '364 days');
  for job in select command from cron.job where jobname = 'purge-support-tickets-daily' loop execute job; end loop;
  assert not exists (select 1 from public.support_tickets where id = t_old), 'a resolved ticket past 365 days is purged';
  assert (select count(*) from public.support_tickets where ticket_number in ('TKT-202511-FFFFFF', 'TKT-202611-GGGGGG')) = 2, 'an open old ticket and a recent resolved one stay';
end
$test$;
rollback;
