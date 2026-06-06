-- Migration: add metadata jsonb column to content_reports
-- Purpose: store AI-report context (ai_response, user_prompt, model) for Dharma Mitra reports.
-- Safe for existing rows: nullable with DEFAULT NULL, no backfill required.
-- RLS impact: existing policies (INSERT by authenticated users, SELECT by admins) apply
--   unchanged — a nullable column inherits the table's RLS without any new policy.
-- Note: content_author_id is stored as '' (empty string) for AI reports because there is no
--   real author UUID. The column is intentionally kept NOT NULL to avoid a breaking migration;
--   the empty-string convention is documented here and enforced at the application layer.

ALTER TABLE public.content_reports
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT NULL;

COMMENT ON COLUMN public.content_reports.metadata IS
  'Optional JSON payload for AI reports: {ai_response, user_prompt, model}. NULL for non-AI reports.';
