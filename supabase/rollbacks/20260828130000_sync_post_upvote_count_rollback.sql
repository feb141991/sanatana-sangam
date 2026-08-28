DROP TRIGGER IF EXISTS sync_post_upvote_count_on_insert ON public.post_upvotes;
DROP TRIGGER IF EXISTS sync_post_upvote_count_on_delete ON public.post_upvotes;
DROP FUNCTION IF EXISTS public.sync_post_upvote_count();
