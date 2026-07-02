-- Migration: Karma Transaction Ledger for Shoonaya
CREATE TABLE IF NOT EXISTS karma_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  source_route TEXT,      -- e.g. '/api/quiz/save', '/api/karma/award'
  metadata JSONB,         -- optional context (quiz_id, session_id, etc.)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS karma_ledger_user_date
  ON karma_ledger (user_id, created_at DESC);

ALTER TABLE karma_ledger ENABLE ROW LEVEL SECURITY;

-- Users can read their own ledger (for future "karma history" UI)
CREATE POLICY "users_read_own_karma_ledger" ON karma_ledger
  FOR SELECT USING (auth.uid() = user_id);

-- Only service role can insert (API routes use service key or RPC)
-- API routes insert via the server Supabase client which bypasses RLS
-- when using the service role key. Anon/user role cannot insert directly.
CREATE POLICY "service_insert_karma_ledger" ON karma_ledger
  FOR INSERT WITH CHECK (true);
