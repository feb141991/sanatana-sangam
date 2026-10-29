-- Synthetic fixtures only; these are route checks, not production delivery.
do $test$
declare
  target constant text := '11111111-1111-4111-8111-111111111111';
  parent constant text := '22222222-2222-4222-8222-222222222222';
  kind text;
  actual text;
  receipt uuid;
  checks integer := 0;
begin
  foreach kind in array array['connection_request','connection_accepted','connection_rejected','connection_cancelled'] loop
    insert into public.notifications(type,action_url,notification_key) values(kind,'/mandali',kind || ':' || target) returning action_url into actual;
    if actual is distinct from '/mandali?requestId=' || target then raise exception 'bad request route: %', actual; end if;
    checks := checks + 1;
  end loop;
  insert into public.notifications(type,action_url,notification_key) values('post_reaction','/mandali','post_reaction:' || target || ':' || parent) returning action_url into actual;
  if actual is distinct from '/mandali?postId=' || target then raise exception 'bad post route: %', actual; end if;
  checks := checks + 1;
  insert into public.post_comments values(target::uuid,parent::uuid);
  insert into public.notifications(type,action_url,notification_key) values('comment_reaction','/mandali','comment_reaction:' || target || ':' || parent) returning action_url into actual;
  if actual is distinct from '/mandali?postId=' || parent || '&commentId=' || target then raise exception 'bad comment route: %', actual; end if;
  checks := checks + 1;
  insert into public.notifications(type,action_url,notification_key) values('mandali_comment','/mandali','mandali_comment:' || target) returning action_url into actual;
  if actual is distinct from '/mandali?postId=' || parent || '&commentId=' || target then raise exception 'bad mandali_comment route: %', actual; end if;
  checks := checks + 1;
  insert into public.notifications(type,action_url,notification_key) values('mandali_comment','/mandali','mandali_comment:33333333-3333-4333-8333-333333333333') returning id,action_url into receipt,actual;
  if actual is distinct from '/notifications?notificationId=' || receipt::text then raise exception 'comment that no longer exists must fall back to its receipt: %', actual; end if;
  checks := checks + 1;
  foreach kind in array array['user_blocked','content_reported','mandali_mention'] loop
    insert into public.notifications(type,action_url,notification_key) values(kind,'/mandali',kind || ':' || target) returning id,action_url into receipt,actual;
    if actual is distinct from '/notifications?notificationId=' || receipt::text then raise exception 'bad receipt route: %', actual; end if;
    checks := checks + 1;
  end loop;
  insert into public.notifications(type,action_url,notification_key) values('post_reaction','/mandali','post_reaction:bad-id') returning id,action_url into receipt,actual;
  if actual is distinct from '/notifications?notificationId=' || receipt::text then raise exception 'bad malformed route: %', actual; end if;
  checks := checks + 1;
  insert into public.notifications(type,action_url,notification_key) values('festival','/panchang?date=2026-09-27','pitru-paksha:2026-09-27') returning action_url into actual;
  if actual is distinct from '/panchang?date=2026-09-27' then raise exception 'changed unrelated destination'; end if;
  checks := checks + 1;
  if has_function_privilege('anon','public.set_notification_item_destination()','EXECUTE') or has_function_privilege('authenticated','public.set_notification_item_destination()','EXECUTE') then raise exception 'trigger exposed as RPC'; end if;
  if (select prosecdef from pg_proc where oid = 'public.set_notification_item_destination()'::regprocedure) then raise exception 'unexpected security definer'; end if;
  checks := checks + 1;
  raise notice '% migration checks passed; 0 failed; 0 skipped', checks;
end;
$test$;
