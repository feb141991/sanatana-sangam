-- ─── Migration: Cascade recommendations on user delete ────────────────────────
-- Fix: Prevent FK violation 23503 when deleting users from Auth / Admin
ALTER TABLE public.recommendations
  DROP CONSTRAINT IF EXISTS recommendations_user_id_fkey,
  ADD CONSTRAINT recommendations_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
