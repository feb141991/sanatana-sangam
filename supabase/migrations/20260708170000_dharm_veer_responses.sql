-- Dharm Veer server-backed completion evidence.
--
-- Previously /api/sadhana/perfect-day trusted daily_sadhana.dharmveer_done
-- directly (see that route's own file header, and the P0-3 migration
-- 20260708163000_harden_daily_sadhana_completion_writes.sql, which revoked
-- direct client writes to that column but explicitly disclosed that
-- dharmveer_done has "no independent completion signal anywhere in the
-- schema" — a real swipe/read never had to happen for the column to be set,
-- only ownership was ever enforced). This migration closes that gap by
-- giving Dharm Veer its own append-only evidence table, the same pattern
-- mala_sessions/quiz_responses/nitya_karma_log already use for the other
-- four practices.
--
-- daily_sadhana.dharmveer_done itself is NOT removed or stopped: it is read
-- for display in several places unrelated to rewards (Home, my-progress,
-- Kul hub, native home/progress-summary, weekly-summary cron, streak-freeze
-- eligibility in use-freeze) and stays populated via the existing
-- complete_dharmveer RPC, called now from the new server route below. Only
-- /api/sadhana/perfect-day's trust boundary changes — it derives dharmveer
-- completion from this new table instead.
--
-- No FK from hero_id to dharm_veers.slug: the canonical roster
-- (getDharmVeerRoster / getDharmVeerBySlug in src/lib/dharm-veer-db.ts)
-- falls back to a static in-repo fixture (DHARM_VEERS) whenever the DB
-- table is incomplete, so a valid hero_id is not always present in
-- dharm_veers. Validation instead happens at the application layer in
-- POST /api/dharm-veer/submit, which calls getDharmVeerBySlug() (the same
-- canonical+fallback resolver every other Dharm Veer surface already uses)
-- before accepting a row.

CREATE TABLE IF NOT EXISTS public.dharm_veer_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hero_id text NOT NULL,
  tradition text,
  spiritual_date date NOT NULL,
  decision text NOT NULL,
  mood text,
  intention text,
  privacy text NOT NULL DEFAULT 'private',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT dharm_veer_responses_decision_check CHECK (decision IN ('inspired', 'skip', 'share')),
  CONSTRAINT dharm_veer_responses_privacy_check CHECK (privacy IN ('private', 'community')),
  CONSTRAINT dharm_veer_responses_mood_check CHECK (mood IS NULL OR mood IN ('gratitude', 'devotion', 'peace', 'courage')),
  CONSTRAINT dharm_veer_responses_intention_len CHECK (intention IS NULL OR char_length(intention) <= 2000),
  -- One response per user/hero/day — a duplicate submit (retry, double-tap)
  -- hits this instead of creating spam rows; the route treats 23505 as an
  -- idempotent success rather than an error.
  CONSTRAINT dharm_veer_responses_user_hero_date_key UNIQUE (user_id, spiritual_date, hero_id)
);

CREATE INDEX IF NOT EXISTS idx_dharm_veer_responses_user_date
  ON public.dharm_veer_responses (user_id, spiritual_date DESC);

ALTER TABLE public.dharm_veer_responses ENABLE ROW LEVEL SECURITY;

-- Owner-only read and insert. No UPDATE/DELETE policy at all: this is an
-- immutable response log (append-only), the same convention already used
-- for nitya_karma_log/mala_sessions as completion evidence — a response,
-- once recorded, should not be alterable by the user who logged it.
CREATE POLICY "Users can view own dharm veer responses"
  ON public.dharm_veer_responses
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own dharm veer responses"
  ON public.dharm_veer_responses
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Column-level, minimal grants from the start (this is a new table, so
-- there is no pre-existing blanket GRANT ALL to walk back the way P0-3
-- required elsewhere). No UPDATE/DELETE grant to authenticated at all —
-- RLS has no policy for those actions anyway, but the grant is withheld
-- too, in keeping with this repo's "deny at both layers" posture.
REVOKE ALL ON public.dharm_veer_responses FROM PUBLIC, anon;
GRANT SELECT, INSERT ON public.dharm_veer_responses TO authenticated;
GRANT ALL ON public.dharm_veer_responses TO service_role;
