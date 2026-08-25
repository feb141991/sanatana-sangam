-- Versioned Terms/Privacy acceptance receipts. Records that a specific user
-- accepted a specific document version, when, and through which surface.
-- Append-only: acceptance history is never edited or deleted, only added to.

CREATE TABLE public.legal_acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  document TEXT NOT NULL CHECK (document IN ('terms', 'privacy')),
  version TEXT NOT NULL,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  surface TEXT NOT NULL
);

COMMENT ON TABLE public.legal_acceptances IS
  'Append-only versioned Terms/Privacy acceptance receipts. Never update or delete a row -- a re-acceptance is a new row.';

CREATE INDEX legal_acceptances_user_id_idx ON public.legal_acceptances (user_id, document, accepted_at DESC);

ALTER TABLE public.legal_acceptances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_acceptances FORCE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own acceptance history"
  ON public.legal_acceptances
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Inserts are server-only (via the authenticated user's own client, but the
-- API route is the sole caller) -- no UPDATE/DELETE policy exists for anyone
-- except service_role, matching the append-only, tamper-evident intent.
CREATE POLICY "Users can record own acceptance"
  ON public.legal_acceptances
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

REVOKE ALL ON TABLE public.legal_acceptances FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON TABLE public.legal_acceptances TO authenticated;
GRANT ALL ON TABLE public.legal_acceptances TO service_role;
