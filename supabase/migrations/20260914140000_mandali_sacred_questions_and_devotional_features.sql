-- Mandali Sacred Questions & Devotional Features
-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Tradition-Aware Devotional Reactions
-- 2. Calendar-Aware Questions (observance_tag on mandali_prompts)
-- 3. Multiple-Choice Community Polls (post_polls, post_poll_options, post_poll_votes)
-- 4. Highlighted Reflections ("Guru Prasad" / "Insightful" pin on post_comments)
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Devotional Reactions Expansion ───────────────────────────────────────
ALTER TABLE public.post_upvotes
  DROP CONSTRAINT IF EXISTS post_upvotes_reaction_type_check;

ALTER TABLE public.post_upvotes
  ADD CONSTRAINT post_upvotes_reaction_type_check
  CHECK (reaction_type IN ('pranam', 'love', 'insightful', 'bhakti', 'jnana', 'chardi_kala', 'shanti'));

ALTER TABLE public.comment_upvotes
  DROP CONSTRAINT IF EXISTS comment_upvotes_reaction_type_check;

ALTER TABLE public.comment_upvotes
  ADD CONSTRAINT comment_upvotes_reaction_type_check
  CHECK (reaction_type IN ('pranam', 'love', 'insightful', 'bhakti', 'jnana', 'chardi_kala', 'shanti'));

-- Update reaction notification trigger with expanded emoji mapping
CREATE OR REPLACE FUNCTION public.handle_post_upvote_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  post_author uuid;
  reactor_name text;
  reaction_emoji text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT author_id INTO post_author FROM public.posts WHERE id = NEW.post_id;
    PERFORM public.log_user_activity(NEW.user_id, post_author, 'post_reaction_added', 'post', NEW.post_id, jsonb_build_object('reaction_type', NEW.reaction_type));

    IF post_author IS NOT NULL AND post_author <> NEW.user_id
       AND COALESCE((SELECT wants_community_notifications FROM public.profiles WHERE id = post_author), true)
       AND NOT EXISTS (
         SELECT 1 FROM public.user_blocked_profiles
         WHERE (blocker_id = post_author AND blocked_user_id = NEW.user_id)
            OR (blocker_id = NEW.user_id AND blocked_user_id = post_author)
       )
    THEN
      SELECT COALESCE(full_name, username, 'A fellow seeker') INTO reactor_name FROM public.profiles WHERE id = NEW.user_id;
      reaction_emoji := CASE NEW.reaction_type
        WHEN 'pranam' THEN '🙏'
        WHEN 'bhakti' THEN '🪷'
        WHEN 'jnana' THEN '🪔'
        WHEN 'chardi_kala' THEN '🌸'
        WHEN 'shanti' THEN '🕊️'
        WHEN 'insightful' THEN '💡'
        ELSE '❤️'
      END;
      INSERT INTO public.notifications (user_id, title, body, emoji, type, action_url, notification_key)
      VALUES (post_author, reactor_name || ' reacted to your post', 'Tap to see it.', reaction_emoji, 'post_reaction', '/mandali', 'post_reaction:' || NEW.post_id || ':' || NEW.user_id)
      ON CONFLICT (user_id, notification_key) WHERE notification_key IS NOT NULL DO NOTHING;
    END IF;

    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    SELECT author_id INTO post_author FROM public.posts WHERE id = OLD.post_id;
    PERFORM public.log_user_activity(OLD.user_id, post_author, 'post_reaction_removed', 'post', OLD.post_id, jsonb_build_object('reaction_type', OLD.reaction_type));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

-- ── 2. Calendar-Aware Questions ─────────────────────────────────────────────
ALTER TABLE public.mandali_prompts
  ADD COLUMN IF NOT EXISTS observance_tag text;

CREATE INDEX IF NOT EXISTS idx_mandali_prompts_observance_tag
  ON public.mandali_prompts (observance_tag)
  WHERE active = true;

-- ── 3. Multiple-Choice Community Polls ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.post_polls (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  question   text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT post_polls_post_id_key UNIQUE (post_id)
);

CREATE TABLE IF NOT EXISTS public.post_poll_options (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id     uuid NOT NULL REFERENCES public.post_polls(id) ON DELETE CASCADE,
  text_en     text NOT NULL,
  text_hi     text,
  text_pa     text,
  order_index integer NOT NULL DEFAULT 0,
  vote_count  integer NOT NULL DEFAULT 0,
  CONSTRAINT post_poll_options_order_key UNIQUE (poll_id, order_index)
);

CREATE TABLE IF NOT EXISTS public.post_poll_votes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id    uuid NOT NULL REFERENCES public.post_polls(id) ON DELETE CASCADE,
  option_id  uuid NOT NULL REFERENCES public.post_poll_options(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT post_poll_votes_poll_user_key UNIQUE (poll_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_post_polls_post_id ON public.post_polls(post_id);
CREATE INDEX IF NOT EXISTS idx_post_poll_options_poll_id ON public.post_poll_options(poll_id);
CREATE INDEX IF NOT EXISTS idx_post_poll_votes_poll_id ON public.post_poll_votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_post_poll_votes_user_id ON public.post_poll_votes(user_id);

ALTER TABLE public.post_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_poll_votes ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT SELECT ON public.post_polls TO anon, authenticated;
GRANT SELECT ON public.post_poll_options TO anon, authenticated;
GRANT SELECT ON public.post_poll_votes TO authenticated;
GRANT INSERT ON public.post_poll_votes TO authenticated;
GRANT ALL ON public.post_polls TO service_role;
GRANT ALL ON public.post_poll_options TO service_role;
GRANT ALL ON public.post_poll_votes TO service_role;

-- RLS Policies
DROP POLICY IF EXISTS "post_polls_select" ON public.post_polls;
CREATE POLICY "post_polls_select" ON public.post_polls
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "post_poll_options_select" ON public.post_poll_options;
CREATE POLICY "post_poll_options_select" ON public.post_poll_options
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "post_poll_votes_select" ON public.post_poll_votes;
CREATE POLICY "post_poll_votes_select" ON public.post_poll_votes
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "post_poll_votes_insert" ON public.post_poll_votes;
CREATE POLICY "post_poll_votes_insert" ON public.post_poll_votes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ── 4. Highlighted Reflections ("Guru Prasad" Pin) ──────────────────────────
ALTER TABLE public.post_comments
  ADD COLUMN IF NOT EXISTS is_highlighted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS highlight_label text,
  ADD COLUMN IF NOT EXISTS highlighted_at timestamptz,
  ADD COLUMN IF NOT EXISTS highlighted_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_post_comments_highlighted
  ON public.post_comments (post_id)
  WHERE is_highlighted = true;
