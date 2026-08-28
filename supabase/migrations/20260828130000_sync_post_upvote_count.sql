-- posts.upvotes has no database-level sync trigger today -- it only stays
-- correct via client-side optimistic patching in native's
-- app/(tabs)/mandali.tsx (handleSelectReaction/handleRemoveReaction/
-- handleUpvoteRealtimeChange), which is a drift risk (a write that succeeds
-- without its optimistic patch landing -- app killed mid-request, a device
-- not running to see the realtime event, concurrent writes from two
-- devices -- permanently skews the stored count with nothing to correct
-- it). Confirmed via `select tgname from pg_trigger where
-- tgrelid='public.posts'::regclass` / `='public.post_upvotes'::regclass`:
-- only set_posts_updated_at and trg_log_post_reaction exist, neither
-- touches upvotes. Mirrors sync_post_comment_count's already-correct
-- pattern for posts.comment_count, and the trigger added for
-- post_comments.upvotes in 20260828120000.
--
-- post_upvotes has one row per (post_id, user_id) with a mutable
-- reaction_type (switching reactions is an UPDATE, not insert/delete), so
-- the count is a plain row count, not reaction-type-specific.

-- One-time reconciliation in case production has already drifted (checked
-- via a live query first -- zero rows differed at migration-authoring
-- time -- but this stays safe/idempotent to run regardless).
UPDATE public.posts p
SET upvotes = sub.actual_count
FROM (
  SELECT post_id, count(*) AS actual_count
  FROM public.post_upvotes
  GROUP BY post_id
) sub
WHERE p.id = sub.post_id AND p.upvotes <> sub.actual_count;

-- Posts with zero rows in post_upvotes aren't covered by the join above.
UPDATE public.posts p
SET upvotes = 0
WHERE p.upvotes <> 0
  AND NOT EXISTS (SELECT 1 FROM public.post_upvotes pu WHERE pu.post_id = p.id);

CREATE OR REPLACE FUNCTION public.sync_post_upvote_count()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET upvotes = upvotes + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET upvotes = GREATEST(upvotes - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

CREATE TRIGGER sync_post_upvote_count_on_insert
AFTER INSERT ON public.post_upvotes
FOR EACH ROW
EXECUTE FUNCTION public.sync_post_upvote_count();

CREATE TRIGGER sync_post_upvote_count_on_delete
AFTER DELETE ON public.post_upvotes
FOR EACH ROW
EXECUTE FUNCTION public.sync_post_upvote_count();
