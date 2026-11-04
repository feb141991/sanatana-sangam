-- Rollback for 20261104100000_sanskara_early_handover.sql.
-- Open hand-overs and the switch are dropped with their tables; a child's records that were already moved cannot come back (that is the
-- feature). The five early_handover_* audit rows are deleted first, because the old CHECK constraint would refuse them. The audit
-- list is restored to production's list as of 2026-11-04 (including kul_link_set and kul_link_cleared).
begin;

drop trigger sanskara_early_managers_changed on public.sanskara_subject_managers;
drop function public.sanskara_start_early_handover(uuid, uuid);
drop function public.sanskara_approve_early_handover(uuid, uuid);
drop function public.sanskara_cancel_early_handover(uuid, uuid);
drop function public.sanskara_accept_early_handover(uuid, text);
drop function public.sanskara_confirm_early_handover(uuid, uuid);
drop function public.sanskara_early_handover_status(uuid);
drop function public.sanskara_early_managers_changed();
drop function public.sanskara_move_records_early(uuid, uuid);
drop function public.sanskara_early_in_window(uuid);
drop function public.sanskara_early_min_age();
drop table public.sanskara_early_approvals;
drop table public.sanskara_early_handovers;
drop table public.sanskara_settings;

delete from public.sanskara_audit where action like 'early\_handover\_%';
alter table public.sanskara_audit drop constraint sanskara_audit_action_check;
alter table public.sanskara_audit add constraint sanskara_audit_action_check check (action in (
  'dependent_created', 'dependent_deleted', 'subject_deleted', 'record_created', 'record_deleted',
  'grant_created', 'grant_revoked', 'manager_added', 'manager_removed', 'claim_started', 'claim_accepted',
  'consent_suspended', 'purged', 'kul_link_set', 'kul_link_cleared'));

commit;
