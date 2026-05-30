-- migration-v81-karma-award-log.sql
-- Adds a daily per-reason karma award log to prevent unlimited self-award.
-- Each (user_id, reason, awarded_date) is unique — subsequent calls on the
-- same day for the same reason are rejected at the application layer.
-- A separate daily_total cap (MAX 500 karma/day) is enforced in the route.

CREATE TABLE IF NOT EXISTS public.karma_award_log (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason       text        NOT NULL,
  amount       integer     NOT NULL CHECK (amount > 0 AND amount <= 100),
  awarded_date date        NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- One award per reason per day per user
CREATE UNIQUE INDEX IF NOT EXISTS karma_award_log_user_reason_date
  ON public.karma_award_log(user_id, reason, awarded_date);

-- Fast lookup for daily-total cap check
CREATE INDEX IF NOT EXISTS karma_award_log_user_date
  ON public.karma_award_log(user_id, awarded_date);

ALTER TABLE public.karma_award_log ENABLE ROW LEVEL SECURITY;

-- Users can only see their own log
CREATE POLICY "karma_award_log_select_own"
  ON public.karma_award_log FOR SELECT
  USING (auth.uid() = user_id);

-- No client inserts — the route uses the service role / server client
CREATE POLICY "karma_award_log_no_client_insert"
  ON public.karma_award_log FOR INSERT
  WITH CHECK (false);
