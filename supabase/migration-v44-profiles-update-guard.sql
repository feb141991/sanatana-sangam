-- ─── Migration v44 — Profiles Column-Level Security ─────────────────────────
-- WHY THIS IS NEEDED
-- ─────────────────────────────────────────────────────────────────────────────
-- profiles.kul_id is managed exclusively by the create_kul / join_kul /
-- leave_kul SECURITY DEFINER RPCs (migration-v8-rpc-kul.sql).
--
-- A standard authenticated client UPDATE must never be able to change kul_id
-- directly.  Without a guard, an exploited payload could:
--   • Trigger the kul_members UNIQUE(kul_id,user_id) constraint
--   • Bypass the "one Kul per user" guard enforced inside the RPCs
--
-- FIX: Column-level REVOKE on the 'authenticated' role.
--
-- WHY NOT A TRIGGER?
-- ─────────────────────────────────────────────────────────────────────────────
-- A BEFORE UPDATE trigger that resets column values to OLD.* would also block
-- SECURITY DEFINER functions, because triggers fire based on the table being
-- modified, regardless of the caller's privileges.  Specifically:
--
--   create_kul / join_kul / leave_kul do:
--     UPDATE profiles SET kul_id = ... WHERE id = ...
--   → A reset trigger would silently undo those writes, breaking Kul membership.
--
--   auto_assign_mandali (on_profile_location_change) sets NEW.mandali_id.
--   Postgres fires BEFORE UPDATE triggers alphabetically:
--     1. on_profile_location_change (auto_assign_mandali) — letter 'o'
--     2. set_profiles_updated_at                          — letter 's'
--     3. any trigger starting with 't' would fire LAST
--   A 'trg_*' reset trigger would overwrite mandali_id back to OLD, undoing
--   the auto-assign — breaking geo-based Mandali assignment.
--
-- Column-level REVOKE is the correct, surgical fix:
--   • Blocks direct writes from the 'authenticated' role
--   • Does NOT affect SECURITY DEFINER functions (they run as the function
--     owner / postgres superuser, not as 'authenticated')
--   • Does NOT affect service_role operations (admin panel, webhooks)
--   • Does NOT interfere with any triggers
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Revoke direct column-write access for authenticated users ─────────────────

-- kul_id: only writable by create_kul / join_kul / leave_kul SECURITY DEFINER RPCs.
-- This is the primary guard that prevents a client from accidentally triggering
-- the kul_members UNIQUE(kul_id, user_id) constraint via a rogue profile UPDATE.
REVOKE UPDATE (kul_id) ON public.profiles FROM authenticated;

-- Privilege columns: set by admin actions only.
-- The admin panel writes these via /api/admin/users/[userId] which uses
-- createServiceRoleSupabaseClient() (service_role) — unaffected by this REVOKE.
REVOKE UPDATE (is_admin) ON public.profiles FROM authenticated;
REVOKE UPDATE (is_pro)   ON public.profiles FROM authenticated;

-- Moderation columns: set by admin panel via service_role only (same route).
REVOKE UPDATE (is_banned)   ON public.profiles FROM authenticated;
REVOKE UPDATE (ban_reason)  ON public.profiles FROM authenticated;

-- ── Columns intentionally NOT revoked ────────────────────────────────────────
--
-- seva_score:
--   Written client-side in two places via the 'authenticated' role:
--     • src/lib/api/kul.ts          — completeKulTask() increments seva_score by 10
--     • src/app/(main)/home/HomeDashboard.tsx — shloka completion fallback (+5)
--   Revoking would silently break task completion and the home shloka reward.
--   Protection is handled at the TypeScript layer: sanitizePayload() in
--   src/lib/api/profile.ts strips seva_score from standard profile UPDATE calls.
--
-- mandali_id:
--   Auto-assigned by the auto_assign_mandali SECURITY DEFINER trigger whenever
--   city / country changes. TypeScript sanitizePayload() already strips it from
--   client payloads, which is sufficient protection.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Verify the revoke took effect (advisory — does not fail migration) ────────
DO $$
DECLARE
  v_has_priv boolean;
BEGIN
  SELECT pg_catalog.has_column_privilege('authenticated', 'public.profiles', 'kul_id', 'UPDATE')
    INTO v_has_priv;
  IF v_has_priv THEN
    RAISE WARNING 'migration-v44: REVOKE on kul_id does not appear to have taken effect — check role grants.';
  ELSE
    RAISE NOTICE  'migration-v44: kul_id column-level UPDATE revoke confirmed ✓';
  END IF;
END;
$$;
