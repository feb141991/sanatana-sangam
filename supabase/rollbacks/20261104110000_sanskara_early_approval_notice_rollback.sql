-- Rollback for 20261104110000_sanskara_early_approval_notice.sql.
-- Pending early-approval notices are cancelled first (they could not be validated or cancelled once the functions are gone); sent notices
-- and bell records are history and are left alone. The milestone trigger returns to the WHEN set by 20261103110000 (instances not starting with 'H').
begin;
set local lock_timeout = '5s';

update public.notification_candidates
set status = 'cancelled', decision_reason = 'sanskara_early_approval_rolled_back', resolved_at = now(), updated_at = now()
where event_type = 'sanskar_milestone' and event_instance = 'Eapproval' and status in ('pending', 'resolving');
update public.notification_schedule
set status = 'cancelled', error = 'sanskara_early_approval_rolled_back'
where notification_type = 'sanskar_milestone' and status in ('pending', 'sending') and metadata ->> 'handover_id' is not null;

drop trigger sanskara_early_approval_profile_change on public.profiles;
drop trigger sanskara_early_approval_manager_removed on public.sanskara_subject_managers;
drop trigger sanskara_early_approval_given on public.sanskara_early_approvals;
drop trigger sanskara_early_approval_handover_deleted on public.sanskara_early_handovers;
drop trigger sanskara_early_approval_handover_moved on public.sanskara_early_handovers;
drop trigger sanskara_validate_early_approval_candidate on public.notification_candidates;
drop trigger sanskara_validate_candidate on public.notification_candidates;
create trigger sanskara_validate_candidate before insert on public.notification_candidates
  for each row when (new.event_type = 'sanskar_milestone' and new.event_instance !~ '^H')
  execute function public.sanskara_validate_candidate();

drop function public.sanskara_early_approval_profile_change();
drop function public.sanskara_early_approval_manager_removed();
drop function public.sanskara_early_approval_given();
drop function public.sanskara_early_approval_handover_deleted();
drop function public.sanskara_early_approval_handover_moved();
drop function public.sanskara_cancel_early_approval_notices(uuid, uuid, text);
drop function public.sanskara_validate_early_approval_candidate();
drop function public.sanskara_early_approval_due(timestamptz, interval);
drop function public.sanskara_early_approval_still_valid(uuid, uuid, integer);

commit;
