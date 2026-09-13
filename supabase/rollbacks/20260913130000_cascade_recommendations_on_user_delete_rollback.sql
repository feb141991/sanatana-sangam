-- ─── Rollback: Revert recommendations CASCADE to NO ACTION ───────────────────
ALTER TABLE public.recommendations
  DROP CONSTRAINT IF EXISTS recommendations_user_id_fkey,
  ADD CONSTRAINT recommendations_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id);
