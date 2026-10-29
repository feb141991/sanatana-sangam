-- Notification locators only: existing producer consent, recipients, content and
-- dedupe remain unchanged. IDs travel in action_url (push-server forwards it as
-- data.url), so no new column or client payload schema is required.
-- RLS/grants: unchanged. SECURITY INVOKER uses the producer's existing privileges;
-- this trigger cannot be called as an RPC. Lookup is only to find a comment's
-- parent. Native must recheck access through /api/mandali/notification-target.
-- Rollback: drop trigger notification_item_destination on public.notifications;
-- drop function public.set_notification_item_destination(); old clients already
-- tolerate the new query parameters. Existing rows are intentionally not rewritten.
begin;

create or replace function public.set_notification_item_destination()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  target_id text;
  parent_id uuid;
begin
  if new.action_url is distinct from '/mandali' then return new; end if;
  target_id := split_part(coalesce(new.notification_key, ''), ':', 2);
  if target_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    -- An unknown/legacy mention format must not guess which post it meant.
    -- The recipient's own notification remains the authoritative receipt.
    new.action_url := '/notifications?notificationId=' || new.id::text;
    return new;
  end if;

  if new.type in ('connection_request', 'connection_accepted', 'connection_rejected', 'connection_cancelled')
     and split_part(new.notification_key, ':', 1) = new.type then
    new.action_url := '/mandali?requestId=' || target_id;
  elsif new.type = 'post_reaction' and split_part(new.notification_key, ':', 1) = 'post_reaction' then
    new.action_url := '/mandali?postId=' || target_id;
  elsif new.type in ('comment_reaction', 'mandali_comment') and split_part(new.notification_key, ':', 1) = new.type then
    -- comment_reaction:<comment>:<reactor> and mandali_comment:<comment> (trg_notify_mandali_comment is AFTER INSERT on
    -- post_comments, so the comment exists here). Both open the comment inside its post. Formats read from production
    -- 2026-10-30; there is no 'mandali_mention' type.
    select post_id into parent_id from public.post_comments where id = target_id::uuid;
    if parent_id is not null then
      new.action_url := '/mandali?postId=' || parent_id::text || '&commentId=' || target_id;
    else
      new.action_url := '/notifications?notificationId=' || new.id::text;
    end if;
  else
    -- Blocking/report receipts must never navigate back to hidden content or
    -- reveal moderation records. Unsupported mention formats also use a receipt.
    new.action_url := '/notifications?notificationId=' || new.id::text;
  end if;
  return new;
end;
$function$;

revoke all on function public.set_notification_item_destination() from public, anon, authenticated;
drop trigger if exists notification_item_destination on public.notifications;
create trigger notification_item_destination
before insert on public.notifications
for each row execute function public.set_notification_item_destination();

commit;
