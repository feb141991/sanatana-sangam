-- Rollback for 20261029151743_notification_item_destinations.sql
begin;

drop trigger if exists notification_item_destination on public.notifications;
drop function if exists public.set_notification_item_destination();

commit;

