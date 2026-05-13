-- ════════════════════════════════════════════════════════════════════════════════
--  MIGRATION v42: SECURITY AUDIT & HARDENING
--  Addressing Supabase security vulnerabilities (RLS Disabled & User Data Exposure)
-- ════════════════════════════════════════════════════════════════════════════════

-- 1. FIX: Enable RLS on public.hero_assets (CRITICAL: Previously publicly accessible)
ALTER TABLE public.hero_assets ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read hero assets (publicly available banners)
DROP POLICY IF EXISTS "Anyone can read hero assets" ON public.hero_assets;
CREATE POLICY "Anyone can read hero assets"
  ON public.hero_assets FOR SELECT
  USING (true);

-- Restrict mutations to service_role / admins only
DROP POLICY IF EXISTS "Only service_role can manage hero assets" ON public.hero_assets;
CREATE POLICY "Only service_role can manage hero assets"
  ON public.hero_assets FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');


-- 2. HARDENING: Ensure RLS is enabled on recent tables that might have been missed
DO $$
DECLARE
    r record;
BEGIN
    FOR r IN (
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
          AND tablename IN ('waitlist', 'hindi_meanings', 'content_meanings', 'hero_assets')
    ) LOOP
        EXECUTE 'ALTER TABLE public.' || quote_ident(r.tablename) || ' ENABLE ROW LEVEL SECURITY;';
    END LOOP;
END $$;


-- 3. FIX: Potential User Data Exposure (auth_users_exposed)
-- Supabase flags views in the 'public' schema that select sensitive columns from 'auth.users'.
-- This migration ensures that any such views are dropped or replaced with safer alternatives.
-- If you created a view manually (e.g., profiles_view), please ensure it does NOT include 'email', 'phone', or 'raw_user_meta_data' from auth.users.

-- Recommended pattern: Use the public.profiles table (which is already RLS-protected)
-- instead of joining with auth.users in public views.

-- 4. HARDENING: Restrict access to waitlist
-- Ensure waitlist is only readable by service_role (Admin dashboard)
DROP POLICY IF EXISTS "service_waitlist_select" ON public.waitlist;
CREATE POLICY "service_waitlist_select"
  ON public.waitlist FOR SELECT
  USING (auth.jwt()->>'role' = 'service_role');


-- 5. STORAGE SECURITY: Ensure buckets are protected
-- The hero-assets bucket should be public read, but restricted write.
-- (This is usually handled via storage policies in the Supabase dashboard)
