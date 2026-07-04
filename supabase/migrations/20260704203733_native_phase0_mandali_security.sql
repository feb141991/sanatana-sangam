-- Native Phase 0 Mandali security closure.
-- Prevent users from posting into arbitrary Mandalis by spoofing mandali_id.

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can post" ON public.posts;
CREATE POLICY "Authenticated users can post"
  ON public.posts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (select auth.uid()) = author_id
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = (select auth.uid())
        AND p.mandali_id = posts.mandali_id
    )
  );

DROP POLICY IF EXISTS "Authors can update own posts" ON public.posts;
CREATE POLICY "Authors can update own posts"
  ON public.posts
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = author_id)
  WITH CHECK (
    (select auth.uid()) = author_id
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = (select auth.uid())
        AND p.mandali_id = posts.mandali_id
    )
  );

DROP POLICY IF EXISTS "Authors can delete own posts" ON public.posts;
CREATE POLICY "Authors can delete own posts"
  ON public.posts
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = author_id);

ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can create content reports" ON public.content_reports;
CREATE POLICY "Users can create content reports"
  ON public.content_reports
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = reported_by);
