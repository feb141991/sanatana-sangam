-- Create database function to resolve invite code to sthapaka number
CREATE OR REPLACE FUNCTION public.resolve_invite_code(p_code TEXT)
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_num INTEGER;
BEGIN
  -- If it's already an integer, return it
  IF p_code ~ '^[0-9]+$' THEN
    RETURN p_code::INTEGER;
  END IF;

  -- Otherwise, try to match the hex suffix of the user ID
  SELECT founding_number INTO v_num
  FROM public.profiles
  WHERE upper(replace(id::text, '-', '')) LIKE '%' || upper(p_code)
  LIMIT 1;

  RETURN v_num;
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_invite_code(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_invite_code(TEXT) TO anon;
