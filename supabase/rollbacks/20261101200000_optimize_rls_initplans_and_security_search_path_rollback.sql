-- Rollback: 20261101200000_optimize_rls_initplans_and_security_search_path_rollback.sql
-- Restores prior RLS policies and resets search_path settings on functions.

-- 1. vrat_observations
DROP POLICY IF EXISTS users_read_own_vrat_observations ON public.vrat_observations;
CREATE POLICY users_read_own_vrat_observations
  ON public.vrat_observations
  FOR SELECT
  TO public
  USING (auth.uid() = user_id);

-- 2. post_poll_votes
DROP POLICY IF EXISTS post_poll_votes_insert ON public.post_poll_votes;
CREATE POLICY post_poll_votes_insert
  ON public.post_poll_votes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 3. kul_tirtha_wishes
DROP POLICY IF EXISTS kul_tirtha_wishes_insert ON public.kul_tirtha_wishes;
CREATE POLICY kul_tirtha_wishes_insert
  ON public.kul_tirtha_wishes
  FOR INSERT
  TO authenticated
  WITH CHECK ((kul_id = auth_kul_id()) AND (added_by = auth.uid()));

-- 4. message_threads
DROP POLICY IF EXISTS "Authenticated users can insert own threads" ON public.message_threads;
CREATE POLICY "Authenticated users can insert own threads"
  ON public.message_threads
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- 5. user_activity_log
DROP POLICY IF EXISTS "Users can view own activity log" ON public.user_activity_log;
CREATE POLICY "Users can view own activity log"
  ON public.user_activity_log
  FOR SELECT
  TO authenticated
  USING ((auth.uid() = actor_id) OR (auth.uid() = target_id));

-- 6. tirtha_place_notes
DROP POLICY IF EXISTS "Public can read approved or own tirtha notes" ON public.tirtha_place_notes;
DROP POLICY IF EXISTS "Authenticated users can create tirtha notes" ON public.tirtha_place_notes;
DROP POLICY IF EXISTS "Users can update own pending tirtha notes" ON public.tirtha_place_notes;
DROP POLICY IF EXISTS "Users can delete own tirtha notes" ON public.tirtha_place_notes;

CREATE POLICY "Public can read approved tirtha notes"
  ON public.tirtha_place_notes
  FOR SELECT
  TO public
  USING (status = 'approved'::text);

CREATE POLICY "Users can read own tirtha notes"
  ON public.tirtha_place_notes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create tirtha notes"
  ON public.tirtha_place_notes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending tirtha notes"
  ON public.tirtha_place_notes
  FOR UPDATE
  TO authenticated
  USING ((auth.uid() = user_id) AND (status = 'pending'::text))
  WITH CHECK ((auth.uid() = user_id) AND (status = 'pending'::text));

CREATE POLICY "Users can delete own tirtha notes"
  ON public.tirtha_place_notes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 7. source_references
DROP POLICY IF EXISTS "Anyone can view source references" ON public.source_references;
DROP POLICY IF EXISTS "Admins can insert source references" ON public.source_references;
DROP POLICY IF EXISTS "Admins can update source references" ON public.source_references;
DROP POLICY IF EXISTS "Admins can delete source references" ON public.source_references;

CREATE POLICY "Anyone can view source references"
  ON public.source_references
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can manage source references"
  ON public.source_references
  FOR ALL
  TO public
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

-- 8. notification_templates
DROP POLICY IF EXISTS "Admins read notification templates" ON public.notification_templates;
DROP POLICY IF EXISTS "Admins insert notification templates" ON public.notification_templates;
DROP POLICY IF EXISTS "Admins update notification templates" ON public.notification_templates;
DROP POLICY IF EXISTS "Admins delete notification templates" ON public.notification_templates;

CREATE POLICY "Admins read notification templates"
  ON public.notification_templates
  FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

CREATE POLICY "Admins update notification templates"
  ON public.notification_templates
  FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

-- 9. Function mutable search_path rollback
ALTER FUNCTION public.bump_social_variant_content_version() RESET search_path;
ALTER FUNCTION public.count_distinct_native_telemetry_users(timestamp with time zone) RESET search_path;
ALTER FUNCTION public.handle_social_updated_at() RESET search_path;
ALTER FUNCTION public.protect_published_social_variant() RESET search_path;
ALTER FUNCTION public.rollup_social_post_status() RESET search_path;
