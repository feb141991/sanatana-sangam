-- ─── Migration v14 — User Safety Controls ───────────────────────────────────
-- Adds user-side block / mute / hide state so members can protect their own
-- experience before admin moderation is needed.

CREATE TABLE IF NOT EXISTS public.user_blocked_profiles (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id      uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (blocker_id, blocked_user_id),
  CONSTRAINT user_blocked_profiles_no_self CHECK (blocker_id <> blocked_user_id)
);

CREATE TABLE IF NOT EXISTS public.user_muted_profiles (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  muter_id      uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  muted_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (muter_id, muted_user_id),
  CONSTRAINT user_muted_profiles_no_self CHECK (muter_id <> muted_user_id)
);

CREATE TABLE IF NOT EXISTS public.user_hidden_content (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content_type text NOT NULL CHECK (content_type IN ('mandali_post', 'thread', 'reply')),
  content_id   uuid NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, content_type, content_id)
);

CREATE INDEX IF NOT EXISTS idx_user_blocked_profiles_blocker
  ON public.user_blocked_profiles(blocker_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_blocked_profiles_blocked
  ON public.user_blocked_profiles(blocked_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_muted_profiles_muter
  ON public.user_muted_profiles(muter_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_hidden_content_user
  ON public.user_hidden_content(user_id, created_at DESC);

ALTER TABLE public.user_blocked_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_muted_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_hidden_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can see block relationships involving them"
  ON public.user_blocked_profiles;
DROP POLICY IF EXISTS "Users can create their own blocks"
  ON public.user_blocked_profiles;
DROP POLICY IF EXISTS "Users can delete their own blocks"
  ON public.user_blocked_profiles;

DROP POLICY IF EXISTS "Users can see their own mutes"
  ON public.user_muted_profiles;
DROP POLICY IF EXISTS "Users can create their own mutes"
  ON public.user_muted_profiles;
DROP POLICY IF EXISTS "Users can delete their own mutes"
  ON public.user_muted_profiles;

DROP POLICY IF EXISTS "Users can see their own hidden content"
  ON public.user_hidden_content;
DROP POLICY IF EXISTS "Users can hide their own content view"
  ON public.user_hidden_content;
DROP POLICY IF EXISTS "Users can unhide their own content view"
  ON public.user_hidden_content;

CREATE POLICY "Users can see block relationships involving them"
  ON public.user_blocked_profiles FOR SELECT
  USING (auth.uid() = blocker_id OR auth.uid() = blocked_user_id);

CREATE POLICY "Users can create their own blocks"
  ON public.user_blocked_profiles FOR INSERT
  WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can delete their own blocks"
  ON public.user_blocked_profiles FOR DELETE
  USING (auth.uid() = blocker_id);

CREATE POLICY "Users can see their own mutes"
  ON public.user_muted_profiles FOR SELECT
  USING (auth.uid() = muter_id);

CREATE POLICY "Users can create their own mutes"
  ON public.user_muted_profiles FOR INSERT
  WITH CHECK (auth.uid() = muter_id);

CREATE POLICY "Users can delete their own mutes"
  ON public.user_muted_profiles FOR DELETE
  USING (auth.uid() = muter_id);

CREATE POLICY "Users can see their own hidden content"
  ON public.user_hidden_content FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can hide their own content view"
  ON public.user_hidden_content FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unhide their own content view"
  ON public.user_hidden_content FOR DELETE
  USING (auth.uid() = user_id);
