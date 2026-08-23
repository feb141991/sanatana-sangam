-- Migration: Canonical Vrat Observation Ledger and Atomic Karma Award
-- Fully occurrence-qualified, non-forgeable, idempotent database ledger.

CREATE TABLE IF NOT EXISTS public.vrat_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  occurrence_id UUID NOT NULL REFERENCES public.observance_occurrences(id) ON DELETE RESTRICT,
  vrat_id TEXT NOT NULL,
  vrat_name TEXT,
  occurrence_date DATE NOT NULL,
  calendar_profile TEXT,
  tradition TEXT,
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  karma_awarded INTEGER NOT NULL DEFAULT 25,
  observed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_occurrence UNIQUE (user_id, occurrence_id)
);

CREATE INDEX IF NOT EXISTS idx_vrat_observations_user_date
  ON public.vrat_observations (user_id, occurrence_date DESC);

CREATE INDEX IF NOT EXISTS idx_vrat_observations_occurrence
  ON public.vrat_observations (occurrence_id);

ALTER TABLE public.vrat_observations ENABLE ROW LEVEL SECURITY;

-- Read policy: users can only see their own observation ledger rows
CREATE POLICY "users_read_own_vrat_observations"
  ON public.vrat_observations
  FOR SELECT
  USING (auth.uid() = user_id);

-- Explicitly NO INSERT/UPDATE/DELETE policies for authenticated or anon.
-- Direct table mutation is forbidden; mutations occur ONLY through record_vrat_observation.

-- Atomic occurrence-qualified observation function
CREATE OR REPLACE FUNCTION public.record_vrat_observation(
  p_occurrence_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_inserted_id UUID;
  v_occurrence RECORD;
  v_profile RECORD;
  v_user_spiritual_date DATE;
  v_karma INTEGER := 25;
BEGIN
  -- 1. Authorization check
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 2. Fetch and strictly validate the canonical occurrence
  SELECT
    oo.id,
    oo.date,
    oo.calendar_profile,
    oo.spiritual_tradition,
    oo.audit_status,
    oo.review_status,
    oo.verification_status,
    oo.final_date_source,
    od.slug AS definition_slug,
    od.display_name AS definition_name,
    od.kind AS definition_kind,
    od.active AS definition_active
  INTO v_occurrence
  FROM public.observance_occurrences oo
  JOIN public.observance_definitions od ON od.id = oo.definition_id
  WHERE oo.id = p_occurrence_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Canonical occurrence not found: %', p_occurrence_id;
  END IF;

  -- Verify it is an active vrat
  IF v_occurrence.definition_kind IS DISTINCT FROM 'vrat' OR v_occurrence.definition_active IS NOT TRUE THEN
    RAISE EXCEPTION 'Occurrence is not an active vrat';
  END IF;

  -- Reject unverified, unaudited, or fallback occurrences
  IF v_occurrence.final_date_source = 'fallback'
     OR COALESCE(v_occurrence.audit_status, 'not_run') != 'completed'
     OR COALESCE(v_occurrence.review_status, 'reviewed') = 'needs_review'
     OR COALESCE(v_occurrence.verification_status, 'verified') = 'mismatch' THEN
    RAISE EXCEPTION 'Occurrence is unverified or under review';
  END IF;

  -- 3. Fetch user profile and compute current local spiritual date (4 AM boundary)
  SELECT timezone, calendar_profile, tradition
  INTO v_profile
  FROM public.profiles
  WHERE id = v_user_id;

  v_user_spiritual_date := (now() AT TIME ZONE COALESCE(v_profile.timezone, 'Asia/Kolkata') - interval '4 hours')::date;

  -- 4. Date validation: Occurrence date MUST match the user spiritual date today
  IF v_occurrence.date != v_user_spiritual_date THEN
    RAISE EXCEPTION 'Occurrence date (%) does not match current spiritual date (%)', v_occurrence.date, v_user_spiritual_date;
  END IF;

  -- 5. Deduplication check (idempotent)
  IF EXISTS (
    SELECT 1 FROM public.vrat_observations
    WHERE user_id = v_user_id AND occurrence_id = p_occurrence_id
  ) THEN
    RETURN json_build_object(
      'success', true,
      'already_observed', true,
      'karma_earned', 0,
      'occurrence_date', v_occurrence.date
    );
  END IF;

  -- 6. Atomic insert with conflict protection
  INSERT INTO public.vrat_observations (
    user_id,
    occurrence_id,
    vrat_id,
    vrat_name,
    occurrence_date,
    calendar_profile,
    tradition,
    timezone,
    karma_awarded
  )
  VALUES (
    v_user_id,
    p_occurrence_id,
    v_occurrence.definition_slug,
    v_occurrence.definition_name,
    v_occurrence.date,
    COALESCE(v_occurrence.calendar_profile, v_profile.calendar_profile, 'legacy-ujjain'),
    COALESCE(v_occurrence.spiritual_tradition, v_profile.tradition, 'hindu'),
    COALESCE(v_profile.timezone, 'Asia/Kolkata'),
    v_karma
  )
  ON CONFLICT (user_id, occurrence_id) DO NOTHING
  RETURNING id INTO v_inserted_id;

  -- 7. If another concurrent request won the race
  IF v_inserted_id IS NULL THEN
    RETURN json_build_object(
      'success', true,
      'already_observed', true,
      'karma_earned', 0,
      'occurrence_date', v_occurrence.date
    );
  END IF;

  -- 8. Award karma in the same atomic transaction
  UPDATE public.profiles
  SET seva_score = COALESCE(seva_score, 0) + v_karma
  WHERE id = v_user_id;

  -- Audit ledger
  INSERT INTO public.karma_ledger (user_id, amount, reason, source_route)
  VALUES (v_user_id, v_karma, 'vrat_observed:' || v_occurrence.definition_slug, '/api/vrat/observe');

  RETURN json_build_object(
    'success', true,
    'already_observed', false,
    'karma_earned', v_karma,
    'occurrence_date', v_occurrence.date
  );
END;
$$;

REVOKE ALL ON FUNCTION public.record_vrat_observation(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_vrat_observation(UUID) TO authenticated, service_role;
