-- Safe fallback if the policy change must be rolled back. This intentionally
-- retains the non-recursive profile-linked scope; restoring the former
-- self-querying policy would make authenticated KUL reads fail with 42P17.
DROP POLICY IF EXISTS kul_members_select ON public.kul_members;

CREATE POLICY kul_members_select
  ON public.kul_members
  FOR SELECT
  TO authenticated
  USING (kul_id = public.auth_kul_id());
