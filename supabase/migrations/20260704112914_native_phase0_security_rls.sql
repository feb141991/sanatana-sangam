-- Native Phase 0 security closure.
-- This migration is intentionally defensive and idempotent:
-- - user-editable profile fields remain editable through existing profile RLS
-- - entitlement/admin/moderation columns are not directly updateable by clients
-- - canonical Tirtha places are readable publicly but writable only by service role
-- - user-owned Tirtha saves/check-ins/reports are protected by auth.uid()

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

REVOKE UPDATE (
  is_pro,
  subscription_status,
  subscription_expires_at,
  entitlement_source,
  entitlement_updated_at,
  is_admin,
  is_banned,
  ban_reason,
  kul_id,
  karma_points,
  is_founding_member,
  founding_number,
  seva_score,
  weekly_seva,
  monthly_seva,
  streak_freeze_count,
  last_freeze_used
) ON public.profiles FROM anon, authenticated;

ALTER TABLE public.tirtha_places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tirtha_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tirtha_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tirtha_reports ENABLE ROW LEVEL SECURITY;

REVOKE INSERT, UPDATE, DELETE ON public.tirtha_places FROM anon, authenticated;

DROP POLICY IF EXISTS "Public can read tirtha places" ON public.tirtha_places;
DROP POLICY IF EXISTS "Authenticated users can import tirtha places" ON public.tirtha_places;
DROP POLICY IF EXISTS "Authenticated users can refresh imported tirtha places" ON public.tirtha_places;
DROP POLICY IF EXISTS "Service role can manage tirtha places" ON public.tirtha_places;

CREATE POLICY "Public can read tirtha places"
  ON public.tirtha_places
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Service role can manage tirtha places"
  ON public.tirtha_places
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users manage own tirtha saves" ON public.tirtha_saves;
DROP POLICY IF EXISTS "Users can read own tirtha saves" ON public.tirtha_saves;
DROP POLICY IF EXISTS "Users can create own tirtha saves" ON public.tirtha_saves;
DROP POLICY IF EXISTS "Users can update own tirtha saves" ON public.tirtha_saves;
DROP POLICY IF EXISTS "Users can delete own tirtha saves" ON public.tirtha_saves;

CREATE POLICY "Users can read own tirtha saves"
  ON public.tirtha_saves
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can create own tirtha saves"
  ON public.tirtha_saves
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own tirtha saves"
  ON public.tirtha_saves
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own tirtha saves"
  ON public.tirtha_saves
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users read own and public tirtha checkins" ON public.tirtha_checkins;
DROP POLICY IF EXISTS "Users create own tirtha checkins" ON public.tirtha_checkins;
DROP POLICY IF EXISTS "Users update own tirtha checkins" ON public.tirtha_checkins;
DROP POLICY IF EXISTS "Users delete own tirtha checkins" ON public.tirtha_checkins;

CREATE POLICY "Users read own and public tirtha checkins"
  ON public.tirtha_checkins
  FOR SELECT
  TO authenticated
  USING (((select auth.uid()) = user_id) OR privacy = 'public');

CREATE POLICY "Users create own tirtha checkins"
  ON public.tirtha_checkins
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users update own tirtha checkins"
  ON public.tirtha_checkins
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users delete own tirtha checkins"
  ON public.tirtha_checkins
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users create own tirtha reports" ON public.tirtha_reports;
DROP POLICY IF EXISTS "Users read own tirtha reports" ON public.tirtha_reports;

CREATE POLICY "Users create own tirtha reports"
  ON public.tirtha_reports
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users read own tirtha reports"
  ON public.tirtha_reports
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);
