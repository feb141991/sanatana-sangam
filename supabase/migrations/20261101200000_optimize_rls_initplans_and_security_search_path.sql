-- Migration: 20261101200000_optimize_rls_initplans_and_security_search_path.sql
-- Status: PREPARED
--
-- PURPOSE:
--   1. Fix `auth_rls_initplan` warnings on 8 tables by wrapping `auth.uid()` in `(select auth.uid())`.
--      Postgres evaluates standalone `auth.uid()` dynamically on every single row scanned;
--      wrapping it in `(select auth.uid())` creates an InitPlan, evaluating it once per query and caching it.
--   2. Fix `multiple_permissive_policies` on `source_references`, `notification_templates`, and `tirtha_place_notes`.
--      Separates broad `FOR ALL` admin policies into granular INSERT/UPDATE/DELETE so SELECT only evaluates a single policy.
--   3. Fix `function_search_path_mutable` on 5 social functions by setting `search_path = public, pg_temp`.
--
-- ROLLBACK: supabase/rollbacks/20261101200000_optimize_rls_initplans_and_security_search_path_rollback.sql

-- 1. vrat_observations
DROP POLICY IF EXISTS users_read_own_vrat_observations ON public.vrat_observations;
CREATE POLICY users_read_own_vrat_observations
  ON public.vrat_observations
  FOR SELECT
  TO public
  USING ((select auth.uid()) = user_id);

-- 2. post_poll_votes
DROP POLICY IF EXISTS post_poll_votes_insert ON public.post_poll_votes;
CREATE POLICY post_poll_votes_insert
  ON public.post_poll_votes
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- 3. kul_tirtha_wishes
DROP POLICY IF EXISTS kul_tirtha_wishes_insert ON public.kul_tirtha_wishes;
CREATE POLICY kul_tirtha_wishes_insert
  ON public.kul_tirtha_wishes
  FOR INSERT
  TO authenticated
  WITH CHECK ((kul_id = auth_kul_id()) AND (added_by = (select auth.uid())));

-- 4. message_threads
DROP POLICY IF EXISTS "Authenticated users can insert own threads" ON public.message_threads;
CREATE POLICY "Authenticated users can insert own threads"
  ON public.message_threads
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);

-- 5. user_activity_log
DROP POLICY IF EXISTS "Users can view own activity log" ON public.user_activity_log;
CREATE POLICY "Users can view own activity log"
  ON public.user_activity_log
  FOR SELECT
  TO authenticated
  USING (((select auth.uid()) = actor_id) OR ((select auth.uid()) = target_id));

-- 6. tirtha_place_notes
DROP POLICY IF EXISTS "Authenticated users can create tirtha notes" ON public.tirtha_place_notes;
DROP POLICY IF EXISTS "Users can read own tirtha notes" ON public.tirtha_place_notes;
DROP POLICY IF EXISTS "Public can read approved tirtha notes" ON public.tirtha_place_notes;
DROP POLICY IF EXISTS "Users can update own pending tirtha notes" ON public.tirtha_place_notes;
DROP POLICY IF EXISTS "Users can delete own tirtha notes" ON public.tirtha_place_notes;

CREATE POLICY "Public can read approved or own tirtha notes"
  ON public.tirtha_place_notes
  FOR SELECT
  TO public
  USING (status = 'approved' OR user_id = (select auth.uid()));

CREATE POLICY "Authenticated users can create tirtha notes"
  ON public.tirtha_place_notes
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own pending tirtha notes"
  ON public.tirtha_place_notes
  FOR UPDATE
  TO authenticated
  USING (((select auth.uid()) = user_id) AND (status = 'pending'::text))
  WITH CHECK (((select auth.uid()) = user_id) AND (status = 'pending'::text));

CREATE POLICY "Users can delete own tirtha notes"
  ON public.tirtha_place_notes
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- 7. source_references
DROP POLICY IF EXISTS "Admins can manage source references" ON public.source_references;
DROP POLICY IF EXISTS "Anyone can view source references" ON public.source_references;

CREATE POLICY "Anyone can view source references"
  ON public.source_references
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can insert source references"
  ON public.source_references
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (select auth.uid()) AND profiles.is_admin = true));

CREATE POLICY "Admins can update source references"
  ON public.source_references
  FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (select auth.uid()) AND profiles.is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (select auth.uid()) AND profiles.is_admin = true));

CREATE POLICY "Admins can delete source references"
  ON public.source_references
  FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (select auth.uid()) AND profiles.is_admin = true));

-- 8. notification_templates
DROP POLICY IF EXISTS "Admins read notification templates" ON public.notification_templates;
DROP POLICY IF EXISTS "Admins update notification templates" ON public.notification_templates;

CREATE POLICY "Admins read notification templates"
  ON public.notification_templates
  FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (select auth.uid()) AND profiles.is_admin = true));

CREATE POLICY "Admins insert notification templates"
  ON public.notification_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (select auth.uid()) AND profiles.is_admin = true));

CREATE POLICY "Admins update notification templates"
  ON public.notification_templates
  FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (select auth.uid()) AND profiles.is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (select auth.uid()) AND profiles.is_admin = true));

CREATE POLICY "Admins delete notification templates"
  ON public.notification_templates
  FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (select auth.uid()) AND profiles.is_admin = true));

-- 9. Function mutable search_path hardening
ALTER FUNCTION public.bump_social_variant_content_version() SET search_path = public, pg_temp;
ALTER FUNCTION public.count_distinct_native_telemetry_users(timestamp with time zone) SET search_path = public, pg_temp;
ALTER FUNCTION public.handle_social_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION public.protect_published_social_variant() SET search_path = public, pg_temp;
ALTER FUNCTION public.rollup_social_post_status() SET search_path = public, pg_temp;
