-- Migration: 20260914170000_fix_mark_panchang_viewed_permission.sql
--
-- PROBLEM: Native app's "Mark today's Panchang as observed" returns
-- "permission denied for table daily_sadhana" (500 from the API).
--
-- ROOT CAUSE (two failure paths):
--
-- Path A — Migration 20260708163000 NOT applied to this environment:
--   mark_panchang_viewed does not exist → route 500s.
--
-- Path B — 20260708163000 WAS applied but the function was created by
--   'authenticated' role (dashboard SQL editor, or via an anon session):
--   SECURITY DEFINER runs as 'authenticated', which no longer has INSERT
--   on daily_sadhana after that migration's column-level REVOKE.
--   → "permission denied for table daily_sadhana"
--
-- FIX: Re-CREATE the function and transfer OWNER TO postgres (the table
-- owner). SECURITY DEFINER + postgres owner = full INSERT/UPDATE rights
-- on daily_sadhana, bypassing both RLS and column-level privilege checks.
--
-- SAFETY:
--   - Does NOT re-add the broad GRANT ALL revoked in 20260708163000.
--   - Does NOT change RLS policies on daily_sadhana.
--   - Does NOT affect any other functions or tables.
--   - Idempotent: safe to run twice.
--
-- ROLLBACK: DROP FUNCTION IF EXISTS public.mark_panchang_viewed(uuid, date);

-- Ensure the column exists (no-op if already present from baseline or
-- from migration 20260708163000).
ALTER TABLE public.daily_sadhana
  ADD COLUMN IF NOT EXISTS panchang_viewed boolean DEFAULT false;

-- Re-create with correct SECURITY DEFINER + ownership.
CREATE OR REPLACE FUNCTION public.mark_panchang_viewed(p_user_id uuid, p_date date)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;
  IF p_user_id IS DISTINCT FROM v_user_id THEN
    RAISE EXCEPTION 'Cannot modify another user''s daily sadhana'
      USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.daily_sadhana (user_id, date, panchang_viewed)
  VALUES (v_user_id, p_date, true)
  ON CONFLICT (user_id, date) DO UPDATE
    SET panchang_viewed = true;
END;
$$;

-- Transfer ownership so SECURITY DEFINER always runs as postgres
-- (the table owner), regardless of which role's session created it.
ALTER FUNCTION public.mark_panchang_viewed(uuid, date) OWNER TO postgres;

-- Privilege hygiene (idempotent).
REVOKE ALL ON FUNCTION public.mark_panchang_viewed(uuid, date)
  FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.mark_panchang_viewed(uuid, date)
  TO authenticated, service_role;
