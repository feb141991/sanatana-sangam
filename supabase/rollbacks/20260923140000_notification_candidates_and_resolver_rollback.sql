-- Rollback: 20260923140000_notification_candidates_and_resolver_rollback.sql
-- Reverses Prompt 1: drops notification_resolver_events and notification_candidates tables and indexes.

DROP TABLE IF EXISTS public.notification_resolver_events CASCADE;
DROP TABLE IF EXISTS public.notification_candidates CASCADE;
