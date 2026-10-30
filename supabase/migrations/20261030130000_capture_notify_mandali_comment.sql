-- Migration: 20261030130000_capture_notify_mandali_comment.sql
-- Status: PREPARED, NOT APPLIED. To be applied by the founder.
--
-- PURPOSE:
--   Records, in repository history, the Mandali comment-notification function and trigger that were created
--   directly in production and never checked in (drift noted in AGENTS.md, "Notification Target Integrity").
--
-- THIS IS A CAPTURE, NOT A CHANGE. The function body below is the production definition, read-only, via
--   SELECT pg_get_functiondef('public.notify_mandali_comment'::regproc);
--   SELECT pg_get_triggerdef(oid) FROM pg_trigger WHERE tgname = 'trg_notify_mandali_comment';
-- on project mnbwodcswxoojndytngu (PostgreSQL 17.6) on 2026-10-31. Fingerprints of that read:
--   function  md5(pg_get_functiondef) = 5058bac9b160499303b8a20804d1111b  (2237 characters)
--   trigger   md5(pg_get_triggerdef)  = 68b7e582dfdb813174eb9324b413219f
-- scripts/db-tests/verify-notify-mandali-comment-migration.sh asserts both fingerprints after applying this file,
-- so applying it to production must leave the definitions byte-identical (a no-op). If production has changed
-- since 2026-10-31, re-read it and update this file and the fingerprints together; never edit the body by hand.
--
-- BEHAVIOUR (as in production):
--   AFTER INSERT on public.post_comments. The recipient is the parent comment's author for a reply, otherwise the
--   post's author. No notification for self-comments, a deleted parent, a recipient with
--   profiles.wants_community_notifications = false (NULL counts as true), either direction of a block, or a mute by
--   the recipient. Writes type 'mandali_comment', key 'mandali_comment:<comment_id>', action_url '/mandali', and
--   the first 140 characters of the comment. 20261029151743_notification_item_destinations.sql then rewrites
--   action_url to /mandali?postId=&commentId= in its BEFORE INSERT trigger.
--
-- PRIVILEGES:
--   SECURITY DEFINER, search_path = public. Production ACL is {postgres=X/postgres,service_role=X/postgres}: no
--   PUBLIC, anon or authenticated EXECUTE. The REVOKE below is therefore a no-op in production and only matters
--   when this file is replayed on a fresh database.
--
-- ROLLBACK:
--   supabase/rollbacks/20261030130000_capture_notify_mandali_comment_rollback.sql is intentionally a no-op:
--   the function and trigger existed before this migration, and dropping them would silently remove every
--   Mandali comment notification.

CREATE OR REPLACE FUNCTION public.notify_mandali_comment()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  recipient_id uuid;
  commenter_name text;
  notif_title text;
  notif_body text;
BEGIN
  -- Recipient is the parent comment's author for a reply, otherwise the post's author.
  IF NEW.parent_id IS NOT NULL THEN
    SELECT author_id INTO recipient_id FROM public.post_comments WHERE id = NEW.parent_id;
  ELSE
    SELECT author_id INTO recipient_id FROM public.posts WHERE id = NEW.post_id;
  END IF;

  -- Never notify yourself, and bail quietly if the parent row is gone.
  IF recipient_id IS NULL OR recipient_id = NEW.author_id THEN
    RETURN NEW;
  END IF;

  -- Respect the recipient's community-notifications preference (profiles.wants_community_notifications).
  IF NOT COALESCE((SELECT wants_community_notifications FROM public.profiles WHERE id = recipient_id), true) THEN
    RETURN NEW;
  END IF;

  -- Mirror the app's existing symmetric block check (lib/mandali.ts's filterAuthoredPosts)
  -- and the recipient's own mutes, so a blocked/muted author's comment never notifies you.
  IF EXISTS (
    SELECT 1 FROM public.user_blocked_profiles
    WHERE (blocker_id = recipient_id AND blocked_user_id = NEW.author_id)
       OR (blocker_id = NEW.author_id AND blocked_user_id = recipient_id)
  ) OR EXISTS (
    SELECT 1 FROM public.user_muted_profiles
    WHERE muter_id = recipient_id AND muted_user_id = NEW.author_id
  ) THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(full_name, username, 'A fellow seeker') INTO commenter_name
  FROM public.profiles WHERE id = NEW.author_id;

  notif_title := commenter_name || CASE WHEN NEW.parent_id IS NOT NULL THEN ' replied to your comment' ELSE ' commented on your post' END;
  notif_body := CASE WHEN length(NEW.body) > 140 THEN left(NEW.body, 140) || '…' ELSE NEW.body END;

  INSERT INTO public.notifications (user_id, title, body, emoji, type, action_url, notification_key)
  VALUES (recipient_id, notif_title, notif_body, '💬', 'mandali_comment', '/mandali', 'mandali_comment:' || NEW.id)
  ON CONFLICT (user_id, notification_key) WHERE notification_key IS NOT NULL DO NOTHING;

  RETURN NEW;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.notify_mandali_comment() FROM PUBLIC, anon, authenticated;

-- CREATE OR REPLACE swaps an identical trigger in place; DROP + CREATE would briefly leave post_comments
-- without it.
CREATE OR REPLACE TRIGGER trg_notify_mandali_comment
AFTER INSERT ON public.post_comments
FOR EACH ROW
EXECUTE FUNCTION public.notify_mandali_comment();
