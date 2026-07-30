-- Keep Dharm Veer completion evidence immutable while allowing its optional
-- reflection fields to be added after the 30-second read completion.
--
-- The completion row is inserted before a reader may open the reflection
-- sheet. The existing unique key makes that insert idempotent, but previously
-- caused a later mood/intention submission to be silently discarded. Only
-- the non-evidence columns below are writable, and only on the caller's row.

DROP POLICY IF EXISTS "Users can enrich own dharm veer reflections"
  ON public.dharm_veer_responses;

CREATE POLICY "Users can enrich own dharm veer reflections"
  ON public.dharm_veer_responses
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

REVOKE UPDATE ON public.dharm_veer_responses FROM authenticated;
GRANT UPDATE (mood, intention, privacy)
  ON public.dharm_veer_responses
  TO authenticated;
