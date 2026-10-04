-- Revoke anon/authenticated EXECUTE on PostGIS's st_estimatedextent(...)
-- overloads. Flagged by the Supabase security linter (0028/0029): these are
-- PostGIS-shipped functions granted to PUBLIC by the extension's own install
-- script, not app RPCs -- confirmed via repo-wide grep that no backend or
-- native code calls `st_estimatedextent` (directly or via
-- supabase.rpc('st_estimatedextent', ...)). Estimating a geometry column's
-- bounding-box extent from table statistics has no legitimate end-user use
-- case here, so there is no reason for anon or authenticated to be able to
-- invoke it via /rest/v1/rpc/st_estimatedextent.
--
-- Rollback: re-grant if ever needed --
--   GRANT EXECUTE ON FUNCTION public.st_estimatedextent(text, text) TO anon, authenticated;
--   GRANT EXECUTE ON FUNCTION public.st_estimatedextent(text, text, text) TO anon, authenticated;
--   GRANT EXECUTE ON FUNCTION public.st_estimatedextent(text, text, text, boolean) TO anon, authenticated;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE EXECUTE ON FUNCTION public.st_estimatedextent(text, text) FROM anon;
    REVOKE EXECUTE ON FUNCTION public.st_estimatedextent(text, text, text) FROM anon;
    REVOKE EXECUTE ON FUNCTION public.st_estimatedextent(text, text, text, boolean) FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE EXECUTE ON FUNCTION public.st_estimatedextent(text, text) FROM authenticated;
    REVOKE EXECUTE ON FUNCTION public.st_estimatedextent(text, text, text) FROM authenticated;
    REVOKE EXECUTE ON FUNCTION public.st_estimatedextent(text, text, text, boolean) FROM authenticated;
  END IF;
END $$;
