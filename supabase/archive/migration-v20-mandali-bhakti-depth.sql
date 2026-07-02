-- ─── Migration v20 — Mandali depth + Bhakti practice state ──────────────────

CREATE TABLE IF NOT EXISTS public.post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body text NOT NULL,
  parent_id uuid REFERENCES public.post_comments(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_post_comments_post
  ON public.post_comments(post_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_post_comments_parent
  ON public.post_comments(parent_id, created_at ASC);

ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Post comments viewable by all"
  ON public.post_comments;
DROP POLICY IF EXISTS "Authenticated users can comment"
  ON public.post_comments;
DROP POLICY IF EXISTS "Authors can update own post comments"
  ON public.post_comments;
DROP POLICY IF EXISTS "Authors can delete own post comments"
  ON public.post_comments;

CREATE POLICY "Post comments viewable by all"
  ON public.post_comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can comment"
  ON public.post_comments FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update own post comments"
  ON public.post_comments FOR UPDATE
  USING (auth.uid() = author_id);

CREATE POLICY "Authors can delete own post comments"
  ON public.post_comments FOR DELETE
  USING (auth.uid() = author_id);

CREATE OR REPLACE FUNCTION public.sync_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts
    SET comment_count = comment_count + 1
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts
    SET comment_count = GREATEST(comment_count - 1, 0)
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_post_comment_count_on_insert
  ON public.post_comments;
DROP TRIGGER IF EXISTS sync_post_comment_count_on_delete
  ON public.post_comments;

CREATE TRIGGER sync_post_comment_count_on_insert
  AFTER INSERT ON public.post_comments
  FOR EACH ROW EXECUTE PROCEDURE public.sync_post_comment_count();

CREATE TRIGGER sync_post_comment_count_on_delete
  AFTER DELETE ON public.post_comments
  FOR EACH ROW EXECUTE PROCEDURE public.sync_post_comment_count();

CREATE TABLE IF NOT EXISTS public.event_rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('going', 'interested', 'not_going')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_event_rsvps_post
  ON public.event_rsvps(post_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_event_rsvps_user
  ON public.event_rsvps(user_id, created_at DESC);

ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Event RSVPs viewable by all"
  ON public.event_rsvps;
DROP POLICY IF EXISTS "Users can manage own RSVPs"
  ON public.event_rsvps;

CREATE POLICY "Event RSVPs viewable by all"
  ON public.event_rsvps FOR SELECT
  USING (true);

CREATE POLICY "Users can manage own RSVPs"
  ON public.event_rsvps FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS set_event_rsvps_updated_at
  ON public.event_rsvps;

CREATE TRIGGER set_event_rsvps_updated_at
  BEFORE UPDATE ON public.event_rsvps
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TABLE IF NOT EXISTS public.mala_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mantra text NOT NULL,
  chant_source text,
  count integer NOT NULL DEFAULT 0 CHECK (count >= 0),
  target_count integer,
  duration_seconds integer DEFAULT 0 CHECK (duration_seconds >= 0),
  notes text,
  share_scope text NOT NULL DEFAULT 'private' CHECK (share_scope IN ('private', 'kul', 'public')),
  completed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mala_sessions_user
  ON public.mala_sessions(user_id, completed_at DESC);

ALTER TABLE public.mala_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own mala sessions"
  ON public.mala_sessions;
DROP POLICY IF EXISTS "Users can create own mala sessions"
  ON public.mala_sessions;
DROP POLICY IF EXISTS "Users can update own mala sessions"
  ON public.mala_sessions;
DROP POLICY IF EXISTS "Users can delete own mala sessions"
  ON public.mala_sessions;

CREATE POLICY "Users can read own mala sessions"
  ON public.mala_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own mala sessions"
  ON public.mala_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mala sessions"
  ON public.mala_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own mala sessions"
  ON public.mala_sessions FOR DELETE
  USING (auth.uid() = user_id);
