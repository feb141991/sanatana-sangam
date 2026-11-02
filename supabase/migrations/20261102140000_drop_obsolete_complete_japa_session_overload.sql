-- Migration: 20261102140000_drop_obsolete_complete_japa_session_overload.sql
-- Status: PREPARED
--
-- PURPOSE:
--   Drop the obsolete duplicate overload of public.complete_japa_session(uuid, text, integer, integer, integer, text, text, text).
--
-- CAUSE & CONTEXT:
--   In migration 20261101020000_optimize_timezone_lookups.sql, complete_japa_session was redefined
--   with an updated signature:
--     (p_client_completion_id uuid, p_count integer, p_rounds integer, p_duration_seconds integer, p_mantra text, ...)
--   The previous definition from 20260905232420_repair_japa_completion_contract_drift.sql had:
--     (p_client_completion_id uuid, p_mantra text, p_count integer, p_rounds integer, p_duration_seconds integer, ...)
--   Because the parameter type order differed, PostgreSQL CREATE OR REPLACE FUNCTION created
--   a second overloaded function instead of replacing the existing one.
--   When PostgREST receives an RPC call with named parameters, it fails with:
--     PGRST203: "Could not choose the best candidate function between..."
--   causing every Japa session completion on /api/japa/complete to return HTTP 500.
--
-- FIX:
--   Drop the obsolete pre-20261101 signature. The 20261101020000 signature remains as the sole
--   complete_japa_session function, resolving PGRST203 ambiguity.
--
-- PRIVILEGES & SECURITY:
--   Revoke all from public, anon; grant execute to authenticated and service_role.
--
-- ROLLBACK: supabase/rollbacks/20261102140000_drop_obsolete_complete_japa_session_overload_rollback.sql

DROP FUNCTION IF EXISTS public.complete_japa_session(
  uuid,
  text,
  integer,
  integer,
  integer,
  text,
  text,
  text
);

-- Re-verify permissions on the surviving 20261101020000 signature
REVOKE ALL ON FUNCTION public.complete_japa_session(
  uuid,
  integer,
  integer,
  integer,
  text,
  text,
  text,
  text
) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.complete_japa_session(
  uuid,
  integer,
  integer,
  integer,
  text,
  text,
  text,
  text
) TO authenticated, service_role;
