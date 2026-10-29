-- Reverses 20261029160300_sanskara_reminders.sql.
-- Drops the subscriptions (every reminder choice people made is discarded), the cancellation and validation triggers, the
-- selector and the send-time check, and restores the two M2 hooks to no-ops. Pending reminders already in
-- notification_candidates / notification_schedule are NOT touched: cancel them first (update both tables for
-- event_type / notification_type 'sanskar_milestone' with status pending, resolving or sending) if any exist, because after
-- this rollback nothing validates or cancels them. Run the M5 and M6 rollbacks first if they have been applied.
begin;

drop trigger if exists sanskara_validate_candidate on public.notification_candidates;
drop trigger if exists sanskara_kul_membership_end on public.kul_members;
drop trigger if exists sanskara_profile_reminder_guard on public.profiles;
drop trigger if exists sanskara_record_changed on public.sanskara_records;
drop index if exists public.notification_candidates_one_live_sanskar;
drop table if exists public.sanskara_subscriptions cascade;

drop function if exists public.sanskara_my_reminders();
drop function if exists public.sanskara_set_reminder(uuid, uuid, integer, boolean);
drop function if exists public.sanskara_reminders_due(timestamptz, interval, interval);
drop function if exists public.sanskara_validate_candidate();
drop function if exists public.sanskara_reminder_still_valid(uuid, integer, integer, integer);
drop function if exists public.sanskara_kul_membership_end();
drop function if exists public.sanskara_profile_reminder_guard();
drop function if exists public.sanskara_record_changed();
drop function if exists public.sanskara_subscription_changed();
drop function if exists public.sanskara_subscription_removed();
drop function if exists public.sanskara_cancel_reminders(uuid, uuid, uuid, text);
drop function if exists public.sanskara_cancel_reminder_rows(text[], text);

-- The M2 hooks go back to doing nothing.
create or replace function public.sanskara_on_access_lost(p_subject uuid, p_account uuid) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  null;
end;
$$;
create or replace function public.sanskara_on_record_completed(p_record uuid) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  null;
end;
$$;

commit;
