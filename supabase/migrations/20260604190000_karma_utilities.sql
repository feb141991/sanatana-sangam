-- ─────────────────────────────────────────────────────────────────────────────
-- Shoonaya — Karma Utility Functions (standalone)
-- Extracted from 20260604120000_monthly_dharma_challenge.sql so these
-- helpers are not tied to the challenge feature's migration lifecycle.
--
-- deduct_karma  — atomically subtract karma from a user's seva_score.
--                 Returns TRUE on success, FALSE if insufficient balance.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.deduct_karma(
  p_user_id UUID,
  p_amount   INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_score INTEGER;
BEGIN
  -- Lock the row so concurrent calls don't double-deduct
  SELECT seva_score
    INTO v_current_score
    FROM public.profiles
   WHERE id = p_user_id
     FOR UPDATE;

  IF v_current_score IS NULL THEN
    RETURN FALSE;
  END IF;

  IF v_current_score < p_amount THEN
    RETURN FALSE;   -- Insufficient Seva Credits
  END IF;

  UPDATE public.profiles
     SET seva_score = seva_score - p_amount
   WHERE id = p_user_id;

  -- Record the deduction in the karma ledger for auditability
  INSERT INTO public.karma_ledger (user_id, reason, amount, date)
  VALUES (p_user_id, 'challenge_unlock_seva', -p_amount, CURRENT_DATE)
  ON CONFLICT DO NOTHING;

  RETURN TRUE;
END;
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.deduct_karma(UUID, INTEGER) TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- award_karma_safe — thin wrapper used by challenge answer route to award
-- karma without hitting the daily-cap RPC (challenges have their own cap logic)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.award_karma_safe(
  p_user_id UUID,
  p_reason   TEXT,
  p_amount   INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
     SET seva_score = COALESCE(seva_score, 0) + p_amount
   WHERE id = p_user_id;

  INSERT INTO public.karma_ledger (user_id, reason, amount, date)
  VALUES (p_user_id, p_reason, p_amount, CURRENT_DATE)
  ON CONFLICT DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION public.award_karma_safe(UUID, TEXT, INTEGER) TO authenticated;
