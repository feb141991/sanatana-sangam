-- ─── Migration v52 — Fix auth function permissions ──────────────
-- Grant execute permissions to authenticated users for the Kul helper functions
-- This resolves "permission denied" errors when performing RLS-protected operations.

GRANT EXECUTE ON FUNCTION public.auth_kul_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.auth_kul_role() TO authenticated;

-- Also ensure the functions are accessible to the public if needed (though authenticated should suffice)
GRANT EXECUTE ON FUNCTION public.auth_kul_id() TO anon;
GRANT EXECUTE ON FUNCTION public.auth_kul_role() TO anon;

-- Re-verify the kul_update policy to ensure it doesn't conflict with migration-v49
DROP POLICY IF EXISTS "Guardians can update kul cover" ON public.kuls;
DROP POLICY IF EXISTS "kul_update" ON public.kuls;

CREATE POLICY "kul_update"
  ON public.kuls FOR UPDATE
  TO authenticated
  USING (id = auth_kul_id() AND auth_kul_role() = 'guardian')
  WITH CHECK (id = auth_kul_id() AND auth_kul_role() = 'guardian');
