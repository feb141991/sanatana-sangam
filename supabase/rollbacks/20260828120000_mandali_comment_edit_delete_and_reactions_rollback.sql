DROP TRIGGER IF EXISTS sync_comment_upvote_count_on_insert ON public.comment_upvotes;
DROP TRIGGER IF EXISTS sync_comment_upvote_count_on_delete ON public.comment_upvotes;
DROP FUNCTION IF EXISTS public.sync_comment_upvote_count();
DROP TRIGGER IF EXISTS trg_log_comment_reaction ON public.comment_upvotes;
DROP FUNCTION IF EXISTS public.log_comment_reaction();
DROP TABLE IF EXISTS public.comment_upvotes;
ALTER TABLE public.post_comments
  DROP COLUMN IF EXISTS updated_at,
  DROP COLUMN IF EXISTS deleted_at,
  DROP COLUMN IF EXISTS upvotes;
