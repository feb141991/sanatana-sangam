-- Restores the early-access Pro behavior and the former tiered KUL limit.
-- Apply only when intentionally reintroducing the previous billing model.

BEGIN;

CREATE OR REPLACE FUNCTION public.fn_early_access_pro_on_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.entitlement_source IS NOT NULL
     AND NEW.entitlement_source <> 'early_access'
  THEN
    RETURN NEW;
  END IF;

  NEW.is_pro                 := true;
  NEW.subscription_status    := 'pro';
  NEW.entitlement_source     := 'early_access';
  NEW.entitlement_updated_at := now();
  NEW.pro_activated_at       := COALESCE(NEW.pro_activated_at, now());
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_early_access_pro_on_insert
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_early_access_pro_on_insert();

UPDATE public.profiles
SET is_pro = true,
    subscription_status = 'pro',
    entitlement_updated_at = now(),
    pro_activated_at = COALESCE(pro_activated_at, now())
WHERE entitlement_source = 'early_access';

CREATE OR REPLACE FUNCTION public.propagate_kul_pro(
  p_kul_id uuid,
  p_expires_at timestamptz
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles p
     SET is_pro = true,
         subscription_status = 'kul_pro',
         entitlement_source = 'kul',
         subscription_expires_at = p_expires_at
  FROM public.kul_members km
  WHERE km.kul_id = p_kul_id
    AND km.user_id = p.id
    AND p.entitlement_source IS DISTINCT FROM 'lifetime';
END;
$$;

GRANT EXECUTE ON FUNCTION public.propagate_kul_pro(uuid, timestamptz) TO service_role;

CREATE OR REPLACE FUNCTION public.revoke_kul_pro(p_kul_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles p
     SET is_pro = false,
         subscription_status = 'expired',
         entitlement_source = NULL,
         subscription_expires_at = now()
  FROM public.kul_members km
  WHERE km.kul_id = p_kul_id
    AND km.user_id = p.id
    AND p.entitlement_source = 'kul'
    AND p.entitlement_source IS DISTINCT FROM 'lifetime';
END;
$$;

GRANT EXECUTE ON FUNCTION public.revoke_kul_pro(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.kul_member_limit(p_kul_id uuid)
RETURNS int
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_is_pro boolean;
BEGIN
  SELECT is_pro INTO v_is_pro FROM public.kuls WHERE id = p_kul_id;
  RETURN CASE WHEN v_is_pro THEN 6 ELSE 3 END;
END;
$$;

GRANT EXECUTE ON FUNCTION public.kul_member_limit(uuid) TO authenticated;

COMMIT;
