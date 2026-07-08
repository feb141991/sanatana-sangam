-- Complete the increment_period_seva hardening by revoking the default
-- PUBLIC function execute privilege.
--
-- The previous hardening migration revoked `anon`, but Postgres functions are
-- executable by PUBLIC by default unless explicitly revoked. Because all roles
-- inherit PUBLIC privileges, leaving this grant in place can keep the function
-- callable outside the intended authenticated/service_role surface.

REVOKE ALL ON FUNCTION public.increment_period_seva(uuid, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.increment_period_seva(uuid, integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.increment_period_seva(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_period_seva(uuid, integer) TO service_role;
