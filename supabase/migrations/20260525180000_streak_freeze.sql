ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS streak_freeze_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_freeze_used date;

CREATE OR REPLACE FUNCTION public.increment_streak_freeze(p_user_id uuid, p_amount integer DEFAULT 1)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  next_count integer;
BEGIN
  UPDATE public.profiles
  SET streak_freeze_count = LEAST(3, GREATEST(0, COALESCE(streak_freeze_count, 0) + p_amount))
  WHERE id = p_user_id
  RETURNING streak_freeze_count INTO next_count;

  RETURN COALESCE(next_count, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_streak_freeze(uuid, integer) TO authenticated;
