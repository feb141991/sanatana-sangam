-- A SELECT policy must not query kul_members from inside its own policy:
-- PostgreSQL recursively applies RLS to that subquery and raises 42P17.
-- Keep the caller's own row visible for membership-link repair, and expose
-- fellow members only when the caller's profile points at the same KUL.
DROP POLICY IF EXISTS kul_members_select ON public.kul_members;

CREATE POLICY kul_members_select
  ON public.kul_members
  FOR SELECT
  TO authenticated
  USING (
    kul_id = public.auth_kul_id()
    OR user_id = (SELECT auth.uid())
  );
