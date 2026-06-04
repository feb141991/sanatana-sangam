-- Drop the old 6-argument version of award_karma
DROP FUNCTION IF EXISTS public.award_karma(UUID, TEXT, INTEGER, DATE, INTEGER, TEXT);

-- Create the new 7-argument version of award_karma supporting metadata
CREATE OR REPLACE FUNCTION public.award_karma(
  p_user_id      UUID,
  p_reason       TEXT,
  p_amount       INTEGER,
  p_date         DATE,
  p_daily_cap    INTEGER,
  p_source_route TEXT DEFAULT NULL,
  p_metadata     JSONB DEFAULT NULL
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
  INSERT INTO karma_ledger (user_id, amount, reason, source_route, metadata)
  VALUES (p_user_id, p_amount, p_reason, p_source_route, p_metadata);

  v_new_total := v_daily_total + p_amount;
  RETURN json_build_object('status', 'ok', 'karma_earned', p_amount, 'daily_total', v_new_total);
END;
$$;

GRANT EXECUTE ON FUNCTION public.award_karma(UUID, TEXT, INTEGER, DATE, INTEGER, TEXT, JSONB) TO authenticated;
