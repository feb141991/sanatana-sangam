-- Removes the atomic persistence RPC. Candidate rows that were reconciled
-- from deferred to suppressed by the forward migration intentionally remain
-- suppressed: replaying time-sensitive engagement after rollback is unsafe.
DROP FUNCTION IF EXISTS public.persist_notification_candidate_resolution(jsonb, jsonb, jsonb);
