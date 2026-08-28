-- Mandali comment edit/delete + comment-level reactions (native-focused
-- push per owner's direction: PWA is being retired, so no PWA UI work
-- accompanies this).
--
-- Edit/delete: RLS on post_comments already has author-only UPDATE and
-- DELETE policies (predates this migration), but no column exists to mark
-- a comment as edited or soft-deleted, and no API route exposes either
-- action. This adds updated_at/deleted_at and rides the *existing* UPDATE
-- policy for both edit (set body + updated_at) and delete (set deleted_at,
-- body left intact for moderation/audit history) -- soft delete so a
-- deleted root comment doesn't orphan its replies or break
-- report/content_reports' reference to it. No RLS change needed here.
--
-- Reactions: comment_upvotes mirrors post_upvotes' shape (this repo's own
-- precedent), but deliberately single-reaction (a plain heart, no
-- pranam/insightful/love variety) -- comments are a lighter-weight surface
-- than a full post.
--
-- Note: notify_mandali_comment() / sync_post_comment_count() already exist
-- live in production (created directly, not through a tracked migration --
-- pre-existing drift, not introduced here) and are left untouched.

-- upvotes is a real denormalized counter kept in sync by a trigger below
-- (unlike posts.upvotes, which has no such trigger today and only stays
-- correct via client-side optimistic patching -- a pre-existing drift risk
-- in that table, left alone here since it's out of this migration's scope,
-- but deliberately not repeated for comments).
ALTER TABLE public.post_comments
  ADD COLUMN IF NOT EXISTS updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS upvotes integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.comment_upvotes (
  comment_id uuid NOT NULL REFERENCES public.post_comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (comment_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_comment_upvotes_comment ON public.comment_upvotes(comment_id);

ALTER TABLE public.comment_upvotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comment_upvotes_select" ON public.comment_upvotes
  FOR SELECT USING (true);

CREATE POLICY "comment_upvotes_insert" ON public.comment_upvotes
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "comment_upvotes_delete" ON public.comment_upvotes
  FOR DELETE USING (user_id = (select auth.uid()));

-- Notify a comment's author when someone hearts it. Mirrors log_post_reaction's
-- gating exactly (skip self, respect wants_community_notifications, respect
-- both block direction and the recipient's own mutes -- the mute check
-- matches notify_mandali_comment's precedent, not log_post_reaction's, since
-- it's the more complete of the two existing gates).
CREATE OR REPLACE FUNCTION public.log_comment_reaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  comment_author uuid;
  reactor_name text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT author_id INTO comment_author FROM public.post_comments WHERE id = NEW.comment_id;
    PERFORM public.log_user_activity(NEW.user_id, comment_author, 'comment_reaction_added', 'post_comment', NEW.comment_id, '{}'::jsonb);

    IF comment_author IS NOT NULL AND comment_author <> NEW.user_id
       AND COALESCE((SELECT wants_community_notifications FROM public.profiles WHERE id = comment_author), true)
       AND NOT EXISTS (
         SELECT 1 FROM public.user_blocked_profiles
         WHERE (blocker_id = comment_author AND blocked_user_id = NEW.user_id)
            OR (blocker_id = NEW.user_id AND blocked_user_id = comment_author)
       )
       AND NOT EXISTS (
         SELECT 1 FROM public.user_muted_profiles
         WHERE muter_id = comment_author AND muted_user_id = NEW.user_id
       )
    THEN
      SELECT COALESCE(full_name, username, 'A fellow seeker') INTO reactor_name FROM public.profiles WHERE id = NEW.user_id;
      INSERT INTO public.notifications (user_id, title, body, emoji, type, action_url, notification_key)
      VALUES (comment_author, reactor_name || ' liked your comment', 'Tap to see it.', '❤️', 'comment_reaction', '/mandali', 'comment_reaction:' || NEW.comment_id || ':' || NEW.user_id)
      ON CONFLICT (user_id, notification_key) WHERE notification_key IS NOT NULL DO NOTHING;
    END IF;

    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    SELECT author_id INTO comment_author FROM public.post_comments WHERE id = OLD.comment_id;
    PERFORM public.log_user_activity(OLD.user_id, comment_author, 'comment_reaction_removed', 'post_comment', OLD.comment_id, '{}'::jsonb);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

CREATE TRIGGER trg_log_comment_reaction
AFTER INSERT OR DELETE ON public.comment_upvotes
FOR EACH ROW
EXECUTE FUNCTION public.log_comment_reaction();

-- Keeps post_comments.upvotes durable and correct across devices/sessions,
-- mirroring sync_post_comment_count's already-correct pattern for
-- posts.comment_count (rather than posts.upvotes' unmaintained-column gap).
CREATE OR REPLACE FUNCTION public.sync_comment_upvote_count()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.post_comments SET upvotes = upvotes + 1 WHERE id = NEW.comment_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.post_comments SET upvotes = GREATEST(upvotes - 1, 0) WHERE id = OLD.comment_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

CREATE TRIGGER sync_comment_upvote_count_on_insert
AFTER INSERT ON public.comment_upvotes
FOR EACH ROW
EXECUTE FUNCTION public.sync_comment_upvote_count();

CREATE TRIGGER sync_comment_upvote_count_on_delete
AFTER DELETE ON public.comment_upvotes
FOR EACH ROW
EXECUTE FUNCTION public.sync_comment_upvote_count();
