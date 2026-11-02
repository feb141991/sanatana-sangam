-- Rollback for 20261103110000_sanskara_handover_notices.sql.
-- Pending handover notices are cancelled first (they could not be validated or cancelled once the functions are gone); sent
-- notices and bell records are history and are left alone. The milestone trigger returns to its original WHEN.
begin;

update public.notification_candidates
set status = 'cancelled', decision_reason = 'sanskara_handover_rolled_back', resolved_at = now(), updated_at = now()
where event_type = 'sanskar_milestone' and event_instance ~ '^H' and status in ('pending', 'resolving');
update public.notification_schedule
set status = 'cancelled', error = 'sanskara_handover_rolled_back'
where notification_type = 'sanskar_milestone' and status in ('pending', 'sending') and metadata ->> 'notice' is not null;

drop trigger sanskara_handover_profile_change on public.profiles;
drop trigger sanskara_handover_claim_started on public.sanskara_claims;
drop trigger sanskara_handover_manager_removed on public.sanskara_subject_managers;
drop trigger sanskara_validate_handover_candidate on public.notification_candidates;
drop trigger sanskara_validate_candidate on public.notification_candidates;
create trigger sanskara_validate_candidate before insert on public.notification_candidates
  for each row when (new.event_type = 'sanskar_milestone')
  execute function public.sanskara_validate_candidate();

drop function public.sanskara_handover_profile_change();
drop function public.sanskara_handover_claim_started();
drop function public.sanskara_handover_manager_removed();
drop function public.sanskara_cancel_handover(uuid, uuid, boolean, text);
drop function public.sanskara_validate_handover_candidate();
drop function public.sanskara_handover_due(timestamptz, interval, interval);
drop function public.sanskara_handover_still_valid(uuid, uuid, text, integer, date);
drop function public.sanskara_handover_notice_date(date, text);

commit;
