-- 1. Add weekly and monthly seva columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS weekly_seva integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS monthly_seva integer DEFAULT 0;

-- 2. Create indexes for efficient sorting by the new periods
CREATE INDEX IF NOT EXISTS idx_profiles_weekly_seva ON public.profiles (weekly_seva DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_monthly_seva ON public.profiles (monthly_seva DESC);

-- 3. Create or replace the RPC to increment all three counters atomically
CREATE OR REPLACE FUNCTION public.increment_period_seva(p_user_id uuid, p_points integer)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.profiles
  SET seva_score   = COALESCE(seva_score, 0) + p_points,
      weekly_seva  = COALESCE(weekly_seva, 0) + p_points,
      monthly_seva = COALESCE(monthly_seva, 0) + p_points
  WHERE id = p_user_id;
END;
$$;

-- 4. Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.increment_period_seva(uuid, integer) TO authenticated;
