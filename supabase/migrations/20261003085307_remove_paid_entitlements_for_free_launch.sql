-- Free-launch entitlement retirement.
-- Paid feature checks are removed from application code; this migration also
-- stops historical early-access Pro stamping and normalizes those grants to the
-- free state. Existing paid-provider rows, if any, are left untouched.

BEGIN;

DROP TRIGGER IF EXISTS trg_early_access_pro_on_insert ON public.profiles;
DROP FUNCTION IF EXISTS public.fn_early_access_pro_on_insert();

UPDATE public.profiles
SET is_pro = false,
    subscription_status = 'free',
    subscription_expires_at = NULL,
    entitlement_updated_at = now()
WHERE entitlement_source = 'early_access';

-- Family circles use the former paid maximum for every account at launch.
-- This preserves the existing hard ceiling while eliminating tier-dependent
-- membership capacity from the native membership RPC.
CREATE OR REPLACE FUNCTION public.kul_member_limit(p_kul_id uuid)
RETURNS int
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 6;
$$;

GRANT EXECUTE ON FUNCTION public.kul_member_limit(uuid) TO authenticated;

-- No application or provider webhook calls these after billing retirement.
DROP FUNCTION IF EXISTS public.propagate_kul_pro(uuid, timestamptz);
DROP FUNCTION IF EXISTS public.revoke_kul_pro(uuid);

COMMIT;
