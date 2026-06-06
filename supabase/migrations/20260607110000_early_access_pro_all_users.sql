-- Migration: 20260607110000_early_access_pro_all_users
-- Purpose:   Grant Pro to every user during early access — no button, no friction.
--            1. Backfill all existing profiles that are not yet Pro.
--            2. Install a BEFORE INSERT trigger so every new profile row
--               is born with early-access Pro already set.
-- Rollback:  DROP TRIGGER trg_early_access_pro_on_insert ON public.profiles;
--            DROP FUNCTION public.fn_early_access_pro_on_insert();
--            (Backfilled rows are not automatically reversed — run a manual
--             UPDATE to reset if rollback is needed.)

-- ── 1. Backfill existing profiles ────────────────────────────────────────────
UPDATE public.profiles
SET
  is_pro                = true,
  subscription_status   = 'pro',
  entitlement_source    = 'early_access',
  entitlement_updated_at = now(),
  pro_activated_at      = COALESCE(pro_activated_at, now())
WHERE is_pro IS NOT TRUE;

-- ── 2. Trigger function: stamp early-access Pro on every new profile row ─────
CREATE OR REPLACE FUNCTION public.fn_early_access_pro_on_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Do not override a real paid entitlement if one somehow arrives at INSERT.
  -- 'early_access' is the only source we set here; anything else (stripe,
  -- app_store, etc.) should be left untouched.
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

-- ── 3. Attach the trigger (BEFORE INSERT so we mutate NEW in-place) ──────────
DROP TRIGGER IF EXISTS trg_early_access_pro_on_insert ON public.profiles;

CREATE TRIGGER trg_early_access_pro_on_insert
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_early_access_pro_on_insert();
