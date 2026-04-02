BEGIN;

CREATE OR REPLACE FUNCTION public.refresh_forum_thread_metrics(target_thread_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.forum_threads
  SET
    reply_count = (
      SELECT COUNT(*)
      FROM public.forum_replies
      WHERE thread_id = target_thread_id
    ),
    upvotes = (
      SELECT COUNT(*)
      FROM public.thread_upvotes
      WHERE thread_id = target_thread_id
    )
  WHERE id = target_thread_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.sync_forum_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.refresh_forum_thread_metrics(OLD.thread_id);
    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.thread_id IS DISTINCT FROM NEW.thread_id THEN
    PERFORM public.refresh_forum_thread_metrics(OLD.thread_id);
  END IF;

  PERFORM public.refresh_forum_thread_metrics(NEW.thread_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_forum_reply_count_on_change ON public.forum_replies;

CREATE TRIGGER sync_forum_reply_count_on_change
AFTER INSERT OR UPDATE OR DELETE ON public.forum_replies
FOR EACH ROW EXECUTE PROCEDURE public.sync_forum_reply_count();

CREATE OR REPLACE FUNCTION public.sync_forum_thread_upvotes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.refresh_forum_thread_metrics(OLD.thread_id);
    RETURN OLD;
  END IF;

  PERFORM public.refresh_forum_thread_metrics(NEW.thread_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_forum_thread_upvotes_on_change ON public.thread_upvotes;

CREATE TRIGGER sync_forum_thread_upvotes_on_change
AFTER INSERT OR DELETE ON public.thread_upvotes
FOR EACH ROW EXECUTE PROCEDURE public.sync_forum_thread_upvotes();

UPDATE public.forum_threads thread
SET
  reply_count = COALESCE(replies.count, 0),
  upvotes = COALESCE(votes.count, 0)
FROM (
  SELECT id, 0 AS count
  FROM public.forum_threads
) base
LEFT JOIN (
  SELECT thread_id, COUNT(*)::INTEGER AS count
  FROM public.forum_replies
  GROUP BY thread_id
) replies ON replies.thread_id = base.id
LEFT JOIN (
  SELECT thread_id, COUNT(*)::INTEGER AS count
  FROM public.thread_upvotes
  GROUP BY thread_id
) votes ON votes.thread_id = base.id
WHERE thread.id = base.id;

COMMIT;
