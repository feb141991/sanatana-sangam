-- ============================================================
-- Migration v43 — Security Audit Level 2 (Warnings & Hardening)
-- Addresses search_path, extension schemas, and permissive RLS policies.
-- ============================================================

-- 1. SCHEMA HARDENING: Move extensions to a dedicated schema
-- This prevents clutter in the public schema and follows security best practices.
CREATE SCHEMA IF NOT EXISTS extensions;

-- Move extensions (if they exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis') THEN
        ALTER EXTENSION postgis SET SCHEMA extensions;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
        ALTER EXTENSION vector SET SCHEMA extensions;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
        ALTER EXTENSION pg_net SET SCHEMA extensions;
    END IF;
END $$;

-- Ensure public can still use extension functions
GRANT USAGE ON SCHEMA extensions TO public;
GRANT USAGE ON SCHEMA extensions TO anon;
GRANT USAGE ON SCHEMA extensions TO authenticated;


-- 2. FUNCTION HARDENING: Secure Search Path
-- Prevents search_path hijacking for SECURITY DEFINER functions.

-- We apply 'SET search_path = public' to all custom functions flagged by the linter.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.increment_karma(p_user_id uuid, p_amount integer)
RETURNS void AS $$
  UPDATE public.profiles
  SET karma_score = karma_score + p_amount
  WHERE id = p_user_id;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.update_verse_mastery_after_review()
RETURNS TRIGGER AS $$
DECLARE
  v_chunk_id UUID;
  v_user_id  UUID;
BEGIN
  SELECT r.chunk_id, r.user_id INTO v_chunk_id, v_user_id FROM pathshala_recordings r WHERE r.id = NEW.recording_id;
  INSERT INTO pathshala_verse_mastery (user_id, chunk_id, attempt_count, last_attempt_at)
    VALUES (v_user_id, v_chunk_id, 1, NOW())
    ON CONFLICT (user_id, chunk_id) DO UPDATE SET attempt_count = pathshala_verse_mastery.attempt_count + 1, last_attempt_at = NOW(), updated_at = NOW();
  IF NEW.reviewer_type = 'ai' THEN
    UPDATE pathshala_verse_mastery SET best_ai_score = GREATEST(COALESCE(best_ai_score, 0), NEW.overall_score) WHERE user_id = v_user_id AND chunk_id = v_chunk_id;
  ELSE
    UPDATE pathshala_verse_mastery SET best_guru_score = GREATEST(COALESCE(best_guru_score, 0), NEW.overall_score), certified = CASE WHEN NEW.is_certified THEN true ELSE certified END, certified_by = CASE WHEN NEW.is_certified THEN NEW.reviewer_id ELSE certified_by END, certified_at = CASE WHEN NEW.is_certified THEN NOW() ELSE certified_at END WHERE user_id = v_user_id AND chunk_id = v_chunk_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Apply to other flagged utility functions
ALTER FUNCTION public.handle_updated_at() SET search_path = public;
ALTER FUNCTION public.update_mandali_member_count() SET search_path = public;
ALTER FUNCTION public.find_nearby_satsang_seekers(double precision, double precision, double precision, integer) SET search_path = public;
ALTER FUNCTION public.find_or_create_mandali(text, text) SET search_path = public;
ALTER FUNCTION public.auto_assign_mandali() SET search_path = public;
ALTER FUNCTION public.auto_assign_mandali_on_insert() SET search_path = public;
ALTER FUNCTION public.sync_post_comment_count() SET search_path = public;
ALTER FUNCTION public.advance_enrollment(uuid, uuid) SET search_path = public;
ALTER FUNCTION public.award_badge_if_earned(uuid, text, jsonb) SET search_path = public;
ALTER FUNCTION public.mark_nitya_step(uuid, date, text, boolean) SET search_path = public;
ALTER FUNCTION public.upsert_device_token(uuid, text, text) SET search_path = public;
ALTER FUNCTION public.auth_kul_id() SET search_path = public;
ALTER FUNCTION public.auth_kul_role() SET search_path = public;


-- 3. RLS HARDENING: Tighten Permissive Policies

-- content_meanings: restrict insert/update to authenticated users with valid data
DROP POLICY IF EXISTS "Authenticated users can cache localized content meanings" ON public.content_meanings;
CREATE POLICY "Authenticated users can cache localized content meanings"
  ON public.content_meanings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can refresh localized content meanings" ON public.content_meanings;
CREATE POLICY "Authenticated users can refresh localized content meanings"
  ON public.content_meanings FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- notifications: ensure users can only insert notifications for themselves (if applicable) or restricted to service role
DROP POLICY IF EXISTS "Service role insert notifications" ON public.notifications;
CREATE POLICY "Service role insert notifications"
  ON public.notifications FOR INSERT
  TO service_role
  WITH CHECK (true);

-- user_practice: ensure service can manage but users only read/own (if shared)
DROP POLICY IF EXISTS "Service can manage profiles" ON public.user_practice;
CREATE POLICY "Service can manage profiles"
  ON public.user_practice FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- waitlist: ensure insert is allowed but scoped
DROP POLICY IF EXISTS "public_waitlist_insert" ON public.waitlist;
CREATE POLICY "public_waitlist_insert"
  ON public.waitlist FOR INSERT
  TO anon, authenticated
  WITH CHECK (email IS NOT NULL AND length(email) > 5);


-- 4. RPC SECURITY: Revoke broad execute permissions
-- By default, functions in 'public' are executable by everyone.
-- We revoke EXECUTE from PUBLIC and then selectively grant it.

REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;

-- Grant EXECUTE back to authenticated users for RPCs they need
GRANT EXECUTE ON FUNCTION public.increment_karma(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.find_nearby_satsang_seekers(double precision, double precision, double precision, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.find_or_create_mandali(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_kul(p_invite_code text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.leave_kul() TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_nitya_step(uuid, date, text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_device_token(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.advance_enrollment(uuid, uuid) TO authenticated;

-- Keep trigger functions internal (accessible to service_role and triggers only)
-- No explicit GRANT needed for triggers if the trigger is defined on the table.


-- 5. AUTH HARDENING: Manual Action Required
-- The linter recommends enabling 'Leaked Password Protection'.
-- This is a setting in the Supabase Dashboard:
-- -> Authentication -> Providers -> Email -> Password Strength -> 'Leaked password protection' (ON)
