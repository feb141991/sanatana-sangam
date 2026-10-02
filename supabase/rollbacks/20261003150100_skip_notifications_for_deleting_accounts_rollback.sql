-- Rollback for 20261003150100_skip_notifications_for_deleting_accounts.sql.
-- Notifications suppressed while the trigger was active are not recoverable.

begin;
drop trigger if exists notifications_skip_deleting_accounts on public.notifications;
drop function if exists public.skip_notifications_for_deleting_accounts();
commit;
