-- Migration: 20261030130000_capture_notify_mandali_comment.sql
-- Status: PREPARED, NOT APPLIED. To be applied by the founder.
--
-- PURPOSE:
--   Captures the production definition of `notify_mandali_comment()` and its trigger
--   `trg_notify_mandali_comment` into repository migration history.
--
-- CONTEXT & AUDIT:
--   - In production, `notify_mandali_comment()` exists on `public.post_comments` and writes
--     notifications of type 'mandali_comment' with key 'mandali_comment:<comment_id>'
--     (confirmed in AGENTS.md, .claude/knowledge/architecture/notification-target-context.md,
--     and 20261029151743_notification_item_destinations.sql).
--   - However, the function was originally created directly in production and never checked into
--     tracked migrations, creating repository history drift.
--   - This migration closes the drift by declaring the canonical, idempotent definition.
--
-- FOUNDER VERIFICATION QUERY:
--   Run in Supabase SQL Editor to verify against live production:
--     SELECT pg_get_functiondef('public.notify_mandali_comment'::regproc);
--     SELECT pg_get_triggerdef(oid) FROM pg_trigger WHERE tgname = 'trg_notify_mandali_comment';
--
-- BEHAVIOR & GATING:
--   - Fires AFTER INSERT on `public.post_comments`.
--   - Looks up the post author from `public.posts`.
--   - Suppresses self-notifications (commenter is post author).
--   - Respects `profiles.wants_community_notifications` (defaults to true).
--   - Suppresses notifications if either user has blocked the other (public.user_blocked_profiles).
--   - Suppresses notifications if the post author has muted the commenter (public.user_muted_profiles).
--   - Emits notification with type 'mandali_comment' and key 'mandali_comment:<comment_id>'.
--     Downstream, `set_notification_item_destination` routes this to `/mandali?postId=<pid>&commentId=<cid>`.
--
-- PRIVILEGE & RLS REVIEW:
--   - `public.notify_mandali_comment` is SECURITY DEFINER with `search_path = 'public'`.
--   - EXECUTE privilege is REVOKED from PUBLIC, `anon`, and `authenticated`. It runs strictly
--     as a trigger, preventing direct PostgREST RPC invocation.
--
-- ROLLBACK GUIDANCE:
--   Execute `supabase/rollbacks/20261030130000_capture_notify_mandali_comment_rollback.sql`.

CREATE OR REPLACE FUNCTION public.notify_mandali_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  post_author uuid;
  commenter_name text;
BEGIN
  -- 1. Identify post author
  SELECT author_id INTO post_author FROM public.posts WHERE id = NEW.post_id;

  -- 2. Audit log entry via log_user_activity (if available)
  BEGIN
    PERFORM public.log_user_activity(
      NEW.author_id,
      post_author,
      'comment_added',
      'post_comment',
      NEW.id,
      '{}'::jsonb
    );
  EXCEPTION WHEN undefined_function THEN
    -- Fallback if log_user_activity is not available
    NULL;
  END;

  -- 3. Deliver notification subject to recipient preferences and privacy blocks
  IF post_author IS NOT NULL AND post_author <> NEW.author_id
     AND COALESCE((SELECT wants_community_notifications FROM public.profiles WHERE id = post_author), true)
     AND NOT EXISTS (
       SELECT 1 FROM public.user_blocked_profiles
       WHERE (blocker_id = post_author AND blocked_user_id = NEW.author_id)
          OR (blocker_id = NEW.author_id AND blocked_user_id = post_author)
     )
     AND NOT EXISTS (
       SELECT 1 FROM public.user_muted_profiles
       WHERE muter_id = post_author AND muted_user_id = NEW.author_id
     )
  THEN
    SELECT COALESCE(full_name, username, 'A fellow seeker') INTO commenter_name
    FROM public.profiles WHERE id = NEW.author_id;

    INSERT INTO public.notifications (
      user_id,
      title,
      body,
      emoji,
      type,
      action_url,
      notification_key
    ) VALUES (
      post_author,
      commenter_name || ' commented on your post',
      'Tap to see it.',
      '💬',
      'mandali_comment',
      '/mandali',
      'mandali_comment:' || NEW.id
    )
    ON CONFLICT (user_id, notification_key) WHERE notification_key IS NOT NULL DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;

-- Revoke direct client execution: trigger-only function
REVOKE EXECUTE ON FUNCTION public.notify_mandali_comment() FROM PUBLIC, anon, authenticated;

-- Ensure trigger is idempotently installed on public.post_comments
DROP TRIGGER IF EXISTS trg_notify_mandali_comment ON public.post_comments;
CREATE TRIGGER trg_notify_mandali_comment
AFTER INSERT ON public.post_comments
FOR EACH ROW
EXECUTE FUNCTION public.notify_mandali_comment();
