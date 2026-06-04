-- 1. Create monthly_challenges table
CREATE TABLE IF NOT EXISTS public.monthly_challenges (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month       TEXT NOT NULL UNIQUE, -- format: 'YYYY-MM'
  theme       TEXT NOT NULL,
  theme_sub   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create challenge_packs table
CREATE TABLE IF NOT EXISTS public.challenge_packs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID REFERENCES public.monthly_challenges(id) ON DELETE CASCADE NOT NULL,
  pack_number  INTEGER NOT NULL,
  title        TEXT NOT NULL,
  is_free      BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (challenge_id, pack_number)
);

-- 3. Create challenge_questions table
CREATE TABLE IF NOT EXISTS public.challenge_questions (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id            UUID REFERENCES public.challenge_packs(id) ON DELETE CASCADE NOT NULL,
  question_number    INTEGER NOT NULL,
  question_text      TEXT NOT NULL,
  options            TEXT[] NOT NULL, -- exactly 4 options
  correct_option_idx INTEGER NOT NULL CHECK (correct_option_idx BETWEEN 0 AND 3),
  explanation        TEXT NOT NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (pack_id, question_number)
);

-- 4. Create user_challenge_progress table
CREATE TABLE IF NOT EXISTS public.user_challenge_progress (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  pack_id       UUID REFERENCES public.challenge_packs(id) ON DELETE CASCADE NOT NULL,
  unlocked      BOOLEAN NOT NULL DEFAULT false,
  completed     BOOLEAN NOT NULL DEFAULT false,
  score         INTEGER NOT NULL DEFAULT 0, -- number of correct answers
  answers       JSONB NOT NULL DEFAULT '{}'::jsonb, -- e.g. { "question_id": { "selected": 0, "is_correct": true } }
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, pack_id)
);

-- Enable RLS
ALTER TABLE public.monthly_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_challenge_progress ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
-- Allow anyone to read challenges, packs, and questions
DROP POLICY IF EXISTS "Anyone can read monthly challenges" ON public.monthly_challenges;
CREATE POLICY "Anyone can read monthly challenges"
  ON public.monthly_challenges FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can read challenge packs" ON public.challenge_packs;
CREATE POLICY "Anyone can read challenge packs"
  ON public.challenge_packs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can read challenge questions" ON public.challenge_questions;
CREATE POLICY "Anyone can read challenge questions"
  ON public.challenge_questions FOR SELECT USING (true);

-- Allow authenticated users to manage their own progress
DROP POLICY IF EXISTS "Users can view own challenge progress" ON public.user_challenge_progress;
CREATE POLICY "Users can view own challenge progress"
  ON public.user_challenge_progress FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own challenge progress" ON public.user_challenge_progress;
CREATE POLICY "Users can insert own challenge progress"
  ON public.user_challenge_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own challenge progress" ON public.user_challenge_progress;
CREATE POLICY "Users can update own challenge progress"
  ON public.user_challenge_progress FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_challenge_progress_user ON public.user_challenge_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_packs_challenge ON public.challenge_packs(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_questions_pack ON public.challenge_questions(pack_id);

-- Helper RPC functions
CREATE OR REPLACE FUNCTION public.deduct_karma(p_user_id UUID, p_amount INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current INTEGER;
BEGIN
  -- Row locking to prevent race conditions
  SELECT karma_points INTO v_current FROM public.profiles WHERE id = p_user_id FOR UPDATE;
  IF v_current IS NULL OR v_current < p_amount THEN
    RETURN FALSE;
  END IF;

  UPDATE public.profiles
  SET karma_points = karma_points - p_amount
  WHERE id = p_user_id;

  -- Log in ledger
  INSERT INTO public.karma_ledger (user_id, amount, reason, source_route)
  VALUES (p_user_id, -p_amount, 'challenge_unlock', '/api/challenge/unlock');

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.deduct_karma(UUID, INTEGER) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_challenge_leaderboard(p_challenge_id UUID, p_tradition TEXT DEFAULT NULL)
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  username TEXT,
  avatar_url TEXT,
  tradition TEXT,
  active_symbol_id TEXT,
  is_pro BOOLEAN,
  total_score BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.full_name,
    p.username,
    p.avatar_url,
    p.tradition,
    p.active_symbol_id,
    p.is_pro,
    SUM(ucp.score)::BIGINT
  FROM public.user_challenge_progress ucp
  JOIN public.challenge_packs cp ON ucp.pack_id = cp.id
  JOIN public.profiles p ON ucp.user_id = p.id
  WHERE cp.challenge_id = p_challenge_id
    AND (p_tradition IS NULL OR p.tradition = p_tradition)
  GROUP BY p.id, p.full_name, p.username, p.avatar_url, p.tradition, p.active_symbol_id, p.is_pro
  ORDER BY SUM(ucp.score) DESC, p.username ASC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.get_challenge_leaderboard(UUID, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_challenge_tradition_ranks(p_challenge_id UUID)
RETURNS TABLE (
  tradition TEXT,
  total_score BIGINT,
  participant_count BIGINT,
  average_score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.tradition,
    SUM(ucp.score)::BIGINT,
    COUNT(DISTINCT p.id)::BIGINT,
    ROUND(AVG(ucp.score), 2)
  FROM public.user_challenge_progress ucp
  JOIN public.challenge_packs cp ON ucp.pack_id = cp.id
  JOIN public.profiles p ON ucp.user_id = p.id
  WHERE cp.challenge_id = p_challenge_id
    AND p.tradition IS NOT NULL
  GROUP BY p.tradition
  ORDER BY SUM(ucp.score) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.get_challenge_tradition_ranks(UUID) TO authenticated;

-- Seed default badge if it does not exist
INSERT INTO public.pathshala_badges (slug, title, emoji, description, category)
VALUES ('monthly_challenge_complete', 'Dharma Challenger', '🏆', 'Complete a full Monthly Dharma Challenge', 'mastery')
ON CONFLICT (slug) DO NOTHING;
