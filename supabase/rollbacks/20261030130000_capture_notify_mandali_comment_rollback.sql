-- Rollback for 20261030130000_capture_notify_mandali_comment.sql
-- Status: PREPARED, NOT APPLIED.
--
-- Drops the trigger and trigger function idempotently.

DROP TRIGGER IF EXISTS trg_notify_mandali_comment ON public.post_comments;
DROP FUNCTION IF EXISTS public.notify_mandali_comment();
