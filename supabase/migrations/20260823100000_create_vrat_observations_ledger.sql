-- Migration: Canonical Vrat Observation Ledger & Service-Role Atomic Karma RPC
-- Fully occurrence-qualified, non-forgeable, idempotent database ledger.

CREATE TABLE IF NOT EXISTS public.vrat_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  occurrence_id UUID NOT NULL REFERENCES public.observance_occurrences(id) ON DELETE RESTRICT,
  definition_id UUID NOT NULL REFERENCES public.observance_definitions(id) ON DELETE RESTRICT,
  vrat_id TEXT NOT NULL,
  vrat_name TEXT,
  occurrence_date DATE NOT NULL,
  calendar_profile TEXT,
  tradition TEXT,
  sampradaya TEXT,
  variant_key TEXT,
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
-- Direct client mutation is completely forbidden.

-- Revoke all table mutations from PUBLIC, anon, and authenticated
REVOKE INSERT, UPDATE, DELETE ON TABLE public.vrat_observations FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.vrat_observations TO authenticated;
GRANT ALL ON TABLE public.vrat_observations TO service_role;

-- Service-role internal transaction function for atomic ledger insertion and karma award
CREATE OR REPLACE FUNCTION public.record_vrat_observation(
  p_user_id UUID,
  p_occurrence_id UUID,
  p_calendar_profile TEXT,
  p_tradition TEXT,
  p_sampradaya TEXT,
  p_spiritual_tradition TEXT,
  p_variant_key TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_inserted_id UUID;
  v_occurrence RECORD;
  v_profile RECORD;
  v_user_spiritual_date DATE;
  v_karma INTEGER := 25;
  v_batch RECORD;
BEGIN
  IF p_user_id IS NULL OR p_occurrence_id IS NULL THEN
    RAISE EXCEPTION 'p_user_id and p_occurrence_id are required';
  END IF;

  -- 1. Fetch user profile and compute current local spiritual date (4 AM boundary)
  SELECT timezone, calendar_profile, tradition, sampradaya
  INTO v_profile
  FROM public.profiles
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found for id: %', p_user_id;
  END IF;

  IF v_profile.timezone IS NULL OR trim(v_profile.timezone) = '' THEN
    RAISE EXCEPTION 'User profile timezone is missing';
  END IF;

  v_user_spiritual_date := (now() AT TIME ZONE v_profile.timezone - interval '4 hours')::date;

  -- 2. Fetch and strictly validate the canonical occurrence & definition
  SELECT
    oo.id,
    oo.definition_id,
    oo.date,
    oo.calendar_profile,
    oo.spiritual_tradition,
    oo.variant_key,
    oo.audit_status,
    oo.review_status,
    oo.verification_status,
    oo.final_date_source,
    oo.locked_for_regeneration,
    oo.batch_id,
    oo.publication_status,
    od.slug AS definition_slug,
    od.display_name AS definition_name,
    od.kind AS definition_kind,
    od.tradition AS definition_tradition,
    od.active AS definition_active
  INTO v_occurrence
  FROM public.observance_occurrences oo
  JOIN public.observance_definitions od ON od.id = oo.definition_id
  WHERE oo.id = p_occurrence_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Canonical occurrence not found: %', p_occurrence_id;
  END IF;

  -- Definition validation: must be active vrat
  IF v_occurrence.definition_kind IS DISTINCT FROM 'vrat' OR v_occurrence.definition_active IS NOT TRUE THEN
    RAISE EXCEPTION 'Occurrence is not an active vrat';
  END IF;

  -- Positive verification: exact published / reviewed / verified / audited states
  IF v_occurrence.publication_status IS DISTINCT FROM 'published' THEN
    RAISE EXCEPTION 'Occurrence is not published: %', v_occurrence.publication_status;
  END IF;

  IF COALESCE(v_occurrence.review_status, 'needs_review') != 'reviewed' THEN
    RAISE EXCEPTION 'Occurrence review status is not reviewed: %', v_occurrence.review_status;
  END IF;

  IF COALESCE(v_occurrence.verification_status, 'not_checked') != 'verified' THEN
    RAISE EXCEPTION 'Occurrence verification status is not verified: %', v_occurrence.verification_status;
  END IF;

  IF COALESCE(v_occurrence.audit_status, 'not_run') != 'completed' THEN
    RAISE EXCEPTION 'Occurrence audit status is not completed: %', v_occurrence.audit_status;
  END IF;

  IF v_occurrence.final_date_source = 'fallback' THEN
    RAISE EXCEPTION 'Occurrence is sourced from fallback';
  END IF;

  -- Disputed / withheld check
  IF v_occurrence.publication_status = 'withheld_disputed' OR v_occurrence.review_status = 'disputed' THEN
    RAISE EXCEPTION 'Occurrence is withheld or disputed';
  END IF;

  -- Materialisation batch check (if occurrence is linked to a batch)
  IF v_occurrence.batch_id IS NOT NULL THEN
    SELECT status, expected_row_count, produced_row_count
    INTO v_batch
    FROM public.observance_materialisation_batches
    WHERE id = v_occurrence.batch_id;

    IF NOT FOUND OR v_batch.status != 'complete' OR v_batch.produced_row_count < v_batch.expected_row_count THEN
      RAISE EXCEPTION 'Occurrence materialisation batch is incomplete';
    END IF;
  END IF;

  -- Bind the service caller's canonical resolution to the CURRENT profile.
  -- Variant selection remains owned by the shared calendar formatter; the RPC
  -- enforces that the resolved identity cannot drift or be substituted.
  IF p_calendar_profile IS DISTINCT FROM COALESCE(v_profile.calendar_profile, 'legacy-ujjain') THEN
    RAISE EXCEPTION 'Resolved calendar profile does not match current user profile';
  END IF;

  IF p_tradition IS DISTINCT FROM COALESCE(v_profile.tradition, 'hindu') THEN
    RAISE EXCEPTION 'Resolved tradition does not match current user profile';
  END IF;

  IF p_sampradaya IS DISTINCT FROM v_profile.sampradaya THEN
    RAISE EXCEPTION 'Resolved sampradaya does not match current user profile';
  END IF;

  IF p_variant_key IS DISTINCT FROM v_occurrence.variant_key
     OR p_spiritual_tradition IS DISTINCT FROM v_occurrence.spiritual_tradition THEN
    RAISE EXCEPTION 'Resolved occurrence variant identity does not match canonical row';
  END IF;

  -- Profile / broad-tradition compatibility. `oo.spiritual_tradition` is a
  -- row-level sampradaya identity, not the definition's broad tradition.
  IF v_occurrence.calendar_profile IS NOT NULL
     AND v_occurrence.calendar_profile != p_calendar_profile
     AND v_occurrence.calendar_profile NOT IN ('legacy-ujjain', 'global_sanatan') THEN
    RAISE EXCEPTION 'Occurrence calendar profile (%) does not match user profile (%)',
      v_occurrence.calendar_profile, COALESCE(v_profile.calendar_profile, 'legacy-ujjain');
  END IF;

  IF v_occurrence.definition_tradition IS NOT NULL
     AND v_occurrence.definition_tradition != p_tradition
     AND v_occurrence.definition_tradition != 'all' THEN
    RAISE EXCEPTION 'Occurrence tradition (%) does not match user tradition (%)',
      v_occurrence.definition_tradition, p_tradition;
  END IF;

  -- Date check: occurrence date must match spiritual date
  IF v_occurrence.date != v_user_spiritual_date THEN
    RAISE EXCEPTION 'Occurrence date (%) does not match current spiritual date (%)',
      v_occurrence.date, v_user_spiritual_date;
  END IF;

  -- 3. Idempotent check: return success if already observed
  IF EXISTS (
    SELECT 1 FROM public.vrat_observations
    WHERE user_id = p_user_id AND occurrence_id = p_occurrence_id
  ) THEN
    RETURN json_build_object(
      'success', true,
      'already_observed', true,
      'karma_earned', 0,
      'occurrence_date', v_occurrence.date
    );
  END IF;

  -- 4. Atomic insert with conflict protection
  INSERT INTO public.vrat_observations (
    user_id,
    occurrence_id,
    definition_id,
    vrat_id,
    vrat_name,
    occurrence_date,
    calendar_profile,
    tradition,
    sampradaya,
    variant_key,
    timezone,
    karma_awarded
  )
  VALUES (
    p_user_id,
    p_occurrence_id,
    v_occurrence.definition_id,
    v_occurrence.definition_slug,
    v_occurrence.definition_name,
    v_occurrence.date,
    COALESCE(v_occurrence.calendar_profile, v_profile.calendar_profile, 'legacy-ujjain'),
    p_tradition,
    p_sampradaya,
    v_occurrence.variant_key,
    v_profile.timezone,
    v_karma
  )
  ON CONFLICT (user_id, occurrence_id) DO NOTHING
  RETURNING id INTO v_inserted_id;

  IF v_inserted_id IS NULL THEN
    RETURN json_build_object(
      'success', true,
      'already_observed', true,
      'karma_earned', 0,
      'occurrence_date', v_occurrence.date
    );
  END IF;

  -- 5. Atomic karma award in same transaction
  UPDATE public.profiles
  SET seva_score = COALESCE(seva_score, 0) + v_karma
  WHERE id = p_user_id;

  INSERT INTO public.karma_ledger (user_id, amount, reason, source_route)
  VALUES (p_user_id, v_karma, 'vrat_observed:' || v_occurrence.definition_slug, '/api/vrat/observe');

  RETURN json_build_object(
    'success', true,
    'already_observed', false,
    'karma_earned', v_karma,
    'occurrence_date', v_occurrence.date
  );
END;
$$;

-- Revoke all execution from public, anon, and authenticated
REVOKE ALL ON FUNCTION public.record_vrat_observation(UUID, UUID, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
-- Grant execute strictly to service_role
GRANT EXECUTE ON FUNCTION public.record_vrat_observation(UUID, UUID, TEXT, TEXT, TEXT, TEXT, TEXT) TO service_role;
