-- Atomic karma award function.
-- Replaces the 4-step check→check→insert→update sequence in /api/karma/award,
-- which had two races:
--   (a) two concurrent requests for different reasons could both pass the daily cap
--       check before either inserted, overflowing MAX_KARMA_PER_DAY.
--   (b) if increment_karma failed after karma_award_log was already inserted, the
--       user's daily quota for that reason was consumed but no karma was awarded.
--
-- This function locks the user's profile row first, serialising all concurrent
-- award calls for the same user. All writes happen in the same transaction, so
-- either everything commits or everything rolls back.
CREATE OR REPLACE FUNCTION public.award_karma(
  p_user_id     UUID,
  p_reason      TEXT,
  p_amount      INTEGER,
  p_date        DATE,
  p_daily_cap   INTEGER,
  p_source_route TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_daily_total INTEGER;
  v_new_total   INTEGER;
BEGIN
  -- Serialise concurrent awards for this user
  PERFORM id FROM profiles WHERE id = p_user_id FOR UPDATE;

  -- Per-reason deduplication
  IF EXISTS (
    SELECT 1 FROM karma_award_log
    WHERE user_id = p_user_id AND reason = p_reason AND awarded_date = p_date
  ) THEN
    RETURN json_build_object('status', 'already_awarded', 'karma_earned', 0, 'daily_total', 0);
  END IF;

  -- Daily cap check (now race-safe because of the FOR UPDATE above)
  SELECT COALESCE(SUM(amount), 0) INTO v_daily_total
  FROM karma_award_log
  WHERE user_id = p_user_id AND awarded_date = p_date;

  IF v_daily_total + p_amount > p_daily_cap THEN
    RETURN json_build_object('status', 'daily_cap_reached', 'karma_earned', 0, 'daily_total', v_daily_total);
  END IF;

  -- Record the award
  INSERT INTO karma_award_log (user_id, reason, amount, awarded_date)
  VALUES (p_user_id, p_reason, p_amount, p_date);

  -- Increment karma (same transaction — rolls back together if anything above fails)
  UPDATE profiles SET seva_score = seva_score + p_amount WHERE id = p_user_id;

  -- Ledger entry (audit trail, inside the same transaction)
  INSERT INTO karma_ledger (user_id, amount, reason, source_route)
  VALUES (p_user_id, p_amount, p_reason, p_source_route);

  v_new_total := v_daily_total + p_amount;
  RETURN json_build_object('status', 'ok', 'karma_earned', p_amount, 'daily_total', v_new_total);
END;
$$;

GRANT EXECUTE ON FUNCTION public.award_karma(UUID, TEXT, INTEGER, DATE, INTEGER, TEXT) TO authenticated;
