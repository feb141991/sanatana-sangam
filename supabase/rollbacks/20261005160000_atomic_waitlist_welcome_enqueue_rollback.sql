BEGIN;

REVOKE ALL ON FUNCTION public.register_waitlist_with_welcome(text, text, text, text, text, integer, text, jsonb)
  FROM PUBLIC, anon, authenticated, service_role;
DROP FUNCTION IF EXISTS public.register_waitlist_with_welcome(text, text, text, text, text, integer, text, jsonb);

COMMIT;
