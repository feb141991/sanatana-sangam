-- Migration: 20261031140000_unschedule_nightly_personalise_cron.sql
-- Status: PREPARED, NOT APPLIED.
--
-- PURPOSE:
--   Unschedules the broken pg_cron job `nightly-personalise` originally scheduled at 04:00 UTC
--   (from packages/sadhana-engine/supabase/migrations/005_patch_idempotency.sql).
--
-- EVIDENCE & CONTEXT:
--   - Fails 100% of runs with "unrecognized configuration parameter app.supabase_url" because custom
--     `app.*` settings do not exist on Supabase Postgres.
--   - It runs at 04:00 UTC, directly colliding with the 03:00 to 04:30 UTC nightly disk I/O stall
--     documented in docs/DB_CRON_STALL_PROFILE_2026-10-31.md.
--   - The underlying Edge Function ai-personalise invokes Gemini (violating AGENTS.md Rule 11: Sarvam Only)
--     and hand-written astronomy physics (violating Calendar Rule 15).
--   - Replaced by the governed, Sarvam-powered batch personalisation route /api/cron/personalise scheduled
--     in lean hours (21:30 UTC / 03:00 AM IST) outside the DB stall window.
--
-- IDEMPOTENT: does nothing if the job is already unscheduled. No data is modified.
--
-- ROLLBACK: supabase/rollbacks/20261031140000_unschedule_nightly_personalise_cron_rollback.sql

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'nightly-personalise') THEN
    PERFORM cron.unschedule('nightly-personalise');
  END IF;
END $$;
