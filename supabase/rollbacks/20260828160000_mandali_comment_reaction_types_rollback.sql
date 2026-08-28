-- Rollback: Mandali comment reaction types

DROP POLICY IF EXISTS "comment_upvotes_update" ON public.comment_upvotes;

ALTER TABLE public.comment_upvotes
  DROP COLUMN IF EXISTS reaction_type;
