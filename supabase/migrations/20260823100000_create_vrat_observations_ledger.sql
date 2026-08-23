-- Migration: Canonical Vrat Observation Ledger and Atomic Karma Award
-- Replaces non-atomic check-then-upsert in /api/vrat/observe with an occurrence-qualified,
-- idempotent database ledger.

CREATE TABLE IF NOT EXISTS public.vrat_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vrat_id TEXT NOT NULL,
  vrat_name TEXT,
  occurrence_date DATE NOT NULL,
  occurrence_id UUID REFERENCES public.observance_occurrences(id) ON DELETE SET NULL,
  calendar_profile TEXT,
  tradition TEXT,
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  karma_awarded INTEGER NOT NULL DEFAULT 0,
  observed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_vrat_occurrence_date UNIQUE (user_id, vrat_id, occurrence_date)
);

CREATE INDEX IF NOT EXISTS idx_vrat_observations_user_date
  ON public.vrat_observations (user_id, occurrence_date DESC);

CREATE INDEX IF NOT EXISTS idx_vrat_observations_vrat_date
  ON public.vrat_observations (vrat_id, occurrence_date DESC);

ALTER TABLE public.vrat_observations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own vrat observations"
  ON public.vrat_observations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vrat observations"
  ON public.vrat_observations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Atomic observation recording and idempotent karma award RPC
CREATE OR REPLACE FUNCTION public.record_vrat_observation(
  p_vrat_id TEXT,
  p_vrat_name TEXT,
  p_occurrence_date DATE,
  p_occurrence_id UUID DEFAULT NULL,
  p_calendar_profile TEXT DEFAULT NULL,
  p_tradition TEXT DEFAULT NULL,
  p_timezone TEXT DEFAULT 'Asia/Kolkata',
  p_karma INTEGER DEFAULT 25
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_inserted_id UUID;
  v_amount INTEGER;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 1. Deduplication check
  IF EXISTS (
    SELECT 1 FROM public.vrat_observations
    WHERE user_id = v_user_id AND vrat_id = p_vrat_id AND occurrence_date = p_occurrence_date
  ) THEN
    RETURN json_build_object(
      'success', true,
      'already_observed', true,
      'karma_earned', 0,
      'occurrence_date', p_occurrence_date
    );
  END IF;

  v_amount := GREATEST(0, LEAST(100, COALESCE(p_karma, 25)));

  -- 2. Atomic insert with conflict protection
  INSERT INTO public.vrat_observations (
    user_id,
    vrat_id,
    vrat_name,
    occurrence_date,
    occurrence_id,
    calendar_profile,
    tradition,
    timezone,
    karma_awarded
  )
  VALUES (
    v_user_id,
    p_vrat_id,
    p_vrat_name,
    p_occurrence_date,
    p_occurrence_id,
    p_calendar_profile,
    p_tradition,
    COALESCE(p_timezone, 'Asia/Kolkata'),
    v_amount
  )
  ON CONFLICT (user_id, vrat_id, occurrence_date) DO NOTHING
  RETURNING id INTO v_inserted_id;

  -- 3. If another concurrent request won the race
  IF v_inserted_id IS NULL THEN
    RETURN json_build_object(
      'success', true,
      'already_observed', true,
      'karma_earned', 0,
      'occurrence_date', p_occurrence_date
    );
  END IF;

  -- 4. Award karma in the same transaction
  IF v_amount > 0 THEN
    UPDATE public.profiles
    SET seva_score = COALESCE(seva_score, 0) + v_amount
    WHERE id = v_user_id;

    -- Audit trail
    INSERT INTO public.karma_ledger (user_id, amount, reason, source_route)
    VALUES (v_user_id, v_amount, 'vrat_observed:' || p_vrat_id, '/api/vrat/observe');
  END IF;

  RETURN json_build_object(
    'success', true,
    'already_observed', false,
    'karma_earned', v_amount,
    'occurrence_date', p_occurrence_date
  );
END;
$$;

REVOKE ALL ON FUNCTION public.record_vrat_observation(TEXT, TEXT, DATE, UUID, TEXT, TEXT, TEXT, INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_vrat_observation(TEXT, TEXT, DATE, UUID, TEXT, TEXT, TEXT, INTEGER) TO authenticated, service_role;
