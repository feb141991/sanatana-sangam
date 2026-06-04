-- Add columns to karma_ledger if they are missing
ALTER TABLE public.karma_ledger 
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT NULL;

ALTER TABLE public.karma_ledger 
  ADD COLUMN IF NOT EXISTS earned_date date DEFAULT CURRENT_DATE;

-- Backfill earned_date for any existing records
UPDATE public.karma_ledger 
   SET earned_date = created_at::date 
 WHERE earned_date IS NULL;

-- Drop old signatures to avoid conflicts
DROP FUNCTION IF EXISTS public.award_karma(UUID, TEXT, INTEGER, DATE, INTEGER, TEXT);
DROP FUNCTION IF EXISTS public.award_karma(UUID, TEXT, INTEGER, DATE, INTEGER, TEXT, JSONB);

-- Create the new 7-argument version of award_karma returning integer
CREATE OR REPLACE FUNCTION public.award_karma(
  p_user_id      uuid,
  p_reason       text,
  p_amount       integer,
  p_date         date,
  p_daily_cap    integer,
  p_source_route text    DEFAULT NULL,
  p_metadata     jsonb   DEFAULT NULL
) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_today integer;
  awarded        integer;
BEGIN
  -- Serialise concurrent awards for this user to prevent race conditions
  PERFORM id FROM public.profiles WHERE id = p_user_id FOR UPDATE;

  SELECT COALESCE(SUM(amount), 0)
    INTO existing_today
    FROM public.karma_ledger
   WHERE user_id = p_user_id
     AND earned_date = p_date
     AND reason = p_reason;

  awarded := LEAST(p_amount, GREATEST(0, p_daily_cap - existing_today));
  IF awarded <= 0 THEN RETURN 0; END IF;

  INSERT INTO public.karma_ledger
    (user_id, reason, amount, earned_date, source_route, metadata)
  VALUES
    (p_user_id, p_reason, awarded, p_date, p_source_route, p_metadata);

  UPDATE public.profiles
     SET seva_score  = COALESCE(seva_score,  0) + awarded,
         weekly_seva  = COALESCE(weekly_seva,  0) + awarded,
         monthly_seva = COALESCE(monthly_seva, 0) + awarded
   WHERE id = p_user_id;

  RETURN awarded;
END;
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.award_karma(UUID, TEXT, INTEGER, DATE, INTEGER, TEXT, JSONB) TO authenticated;
