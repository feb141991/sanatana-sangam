-- ─────────────────────────────────────────────────────────────────────────────
-- Shoonaya — Kul Pro: family subscription propagation
-- When one family member (guardian) activates Kul Pro, all kul_members
-- in their kul inherit Zenith benefits for the subscription period.
-- ─────────────────────────────────────────────────────────────────────────────

-- Add kul-level pro columns if not already present
ALTER TABLE public.kuls
  ADD COLUMN IF NOT EXISTS is_pro            boolean   NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pro_activated_at  timestamptz,
  ADD COLUMN IF NOT EXISTS pro_expires_at    timestamptz,
  ADD COLUMN IF NOT EXISTS pro_activated_by  uuid REFERENCES public.profiles(id);

-- ── propagate_kul_pro ─────────────────────────────────────────────────────
-- Called after kul-level is_pro is set to TRUE.
-- Grants is_pro=true to every member of the kul for the subscription period.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.propagate_kul_pro(
  p_kul_id       uuid,
  p_expires_at   timestamptz
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update every member of this kul
  UPDATE public.profiles p
     SET is_pro               = true,
         subscription_status  = 'kul_pro',
         entitlement_source   = 'kul',
         subscription_expires_at = p_expires_at
  FROM public.kul_members km
  WHERE km.kul_id = p_kul_id
    AND km.user_id = p.id
    AND p.entitlement_source IS DISTINCT FROM 'lifetime'; -- don't override lifetime pass holders
END;
$$;

GRANT EXECUTE ON FUNCTION public.propagate_kul_pro(uuid, timestamptz) TO service_role;

-- ── revoke_kul_pro ────────────────────────────────────────────────────────
-- Called when Kul Pro subscription expires or is cancelled.
-- Reverts kul members to free (unless they have their own individual sub).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.revoke_kul_pro(p_kul_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles p
     SET is_pro               = false,
         subscription_status  = 'expired',
         entitlement_source   = null,
         subscription_expires_at = now()
  FROM public.kul_members km
  WHERE km.kul_id = p_kul_id
    AND km.user_id = p.id
    -- Only revert members whose access came from this kul (not their own sub)
    AND p.entitlement_source = 'kul'
    AND p.entitlement_source IS DISTINCT FROM 'lifetime';
END;
$$;

GRANT EXECUTE ON FUNCTION public.revoke_kul_pro(uuid) TO service_role;

-- ── Kul member limit: free = 3, kul_pro = 6 ──────────────────────────────
-- Enforced in application layer (/api/kul/invite/route.ts) via this function.
CREATE OR REPLACE FUNCTION public.kul_member_limit(p_kul_id uuid)
RETURNS int
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
DECLARE
  v_is_pro boolean;
BEGIN
  SELECT is_pro INTO v_is_pro FROM public.kuls WHERE id = p_kul_id;
  RETURN CASE WHEN v_is_pro THEN 6 ELSE 3 END;
END;
$$;

GRANT EXECUTE ON FUNCTION public.kul_member_limit(uuid) TO authenticated;
