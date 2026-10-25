-- push_token_events.event_type's CHECK constraint only ever allowed
-- 'registered', 'pruned_device_not_registered', 'pruned_other'
-- (20260825221500_push_token_and_dispatch_audit_logs.sql). The
-- 'registration_failed' event type was added to the application on
-- 2026-09-09 (src/lib/push-token-audit.ts's PushTokenEventType, written by
-- the native repo's registerPushToken diagnostic beacon) without a matching
-- migration here, so every insert of that event type has been rejected by
-- this constraint since -- confirmed in production logs recurring through
-- 2026-10-24. The insert's own error handling silently logs and swallows
-- the failure (push-token-audit.ts's recordPushTokenEvent/Batch are
-- deliberately fail-open), so this was pure, invisible loss of
-- failure-diagnostic data -- it never caused a request to fail or slow
-- down; the caller always received an "acknowledged" response regardless.
alter table public.push_token_events
  drop constraint if exists push_token_events_event_type_check;
alter table public.push_token_events
  add constraint push_token_events_event_type_check
  check (event_type in ('registered', 'pruned_device_not_registered', 'pruned_other', 'registration_failed'));
