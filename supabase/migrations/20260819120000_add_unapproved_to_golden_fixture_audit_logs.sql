-- Widens golden_fixture_audit_logs.action to allow 'unapproved' -- a reviewer
-- revoking their own (or a prior reviewer's) sign-off on an already-approved
-- fixture, e.g. wanting a second look. Distinct from 'rejected', which means
-- the sourced citation itself was checked and found wrong (the D33 scenario).
-- Collapsing both into 'rejected' made the two indistinguishable in the one
-- audit trail this governance system exists to keep trustworthy.

ALTER TABLE public.golden_fixture_audit_logs
  DROP CONSTRAINT golden_fixture_audit_logs_action_check;

ALTER TABLE public.golden_fixture_audit_logs
  ADD CONSTRAINT golden_fixture_audit_logs_action_check
  CHECK (action IN ('newly_approved', 're_confirmed', 'rejected', 'unapproved', 'content_updated'));
