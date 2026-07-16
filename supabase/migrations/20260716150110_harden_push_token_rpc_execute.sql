-- SECURITY DEFINER functions are executable by PUBLIC unless explicitly
-- revoked. These helpers are only called from service-role server routes;
-- direct anon/authenticated execution would let a client reassign arbitrary
-- Expo push tokens to arbitrary users.

REVOKE EXECUTE ON FUNCTION public.upsert_push_token(uuid, text, text)
  FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.delete_push_token(uuid, text)
  FROM PUBLIC, anon, authenticated;

-- Trigger functions should not be a public API surface either.
REVOKE EXECUTE ON FUNCTION public.update_push_token_timestamp()
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.upsert_push_token(uuid, text, text)
  TO service_role;

GRANT EXECUTE ON FUNCTION public.delete_push_token(uuid, text)
  TO service_role;
