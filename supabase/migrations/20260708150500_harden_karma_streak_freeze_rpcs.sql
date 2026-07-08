-- Harden increment_karma and increment_streak_freeze (P0)
--
-- Same vulnerability class as increment_period_seva (see
-- 20260708140920_harden_increment_period_seva.sql): both functions are
-- SECURITY DEFINER with no check that p_user_id matches the calling user,
-- and increment_streak_freeze is additionally granted to `anon`. Any
-- authenticated (or, for the freeze function, unauthenticated) caller could
-- award or drain karma/streak-freezes on an arbitrary user id.
--
-- Verified safe to add an ownership check: every call site in the app
-- (src/app/api/vrat/observe, src/app/api/quiz/{save,practice},
-- src/app/api/sadhana/perfect-day, src/app/api/japa/complete,
-- src/app/(main)/japa/JapaClient.tsx) passes only the caller's own
-- auth user id — never a service-role/cron call on behalf of another user.

CREATE OR REPLACE FUNCTION public.increment_karma(p_user_id uuid, p_amount integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_amount integer;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF p_user_id IS DISTINCT FROM v_user_id THEN
    RAISE EXCEPTION 'Cannot modify another user''s karma';
  END IF;

  -- Clamp to the same bound used for increment_period_seva; no legitimate
  -- single award in this codebase exceeds this.
  v_amount := GREATEST(-500, LEAST(500, p_amount));

  UPDATE public.profiles
  SET seva_score = COALESCE(seva_score, 0) + v_amount
  WHERE id = v_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_karma(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.increment_karma(uuid, integer) TO authenticated, service_role;


CREATE OR REPLACE FUNCTION public.increment_streak_freeze(p_user_id uuid, p_amount integer DEFAULT 1)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  next_count integer;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF p_user_id IS DISTINCT FROM v_user_id THEN
    RAISE EXCEPTION 'Cannot modify another user''s streak freeze count';
  END IF;

  UPDATE public.profiles
  SET streak_freeze_count = LEAST(3, GREATEST(0, COALESCE(streak_freeze_count, 0) + p_amount))
  WHERE id = v_user_id
  RETURNING streak_freeze_count INTO next_count;

  RETURN COALESCE(next_count, 0);
END;
$$;

REVOKE ALL ON FUNCTION public.increment_streak_freeze(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.increment_streak_freeze(uuid, integer) TO authenticated, service_role;
