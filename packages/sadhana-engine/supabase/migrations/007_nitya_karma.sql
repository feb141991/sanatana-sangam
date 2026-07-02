-- ============================================================
-- Migration 007: Nitya Karma — Daily Ritual Tracker
-- Tracks morning sequence completion step by step.
-- SAFE TO RE-RUN — all IF NOT EXISTS / CREATE OR REPLACE.
-- ============================================================

-- ── 1. Nitya karma daily log ──
-- One row per user per day, with each step tracked as a boolean.
-- Steps mirror the morning sequence: snana → tilak → sandhya → japa → shloka → aarti

CREATE TABLE IF NOT EXISTS nitya_karma_log (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date           DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Morning sequence steps (tappable in UI)
  woke_brahma_muhurta  BOOLEAN DEFAULT false,  -- woke before sunrise
  snana_done           BOOLEAN DEFAULT false,  -- ritual bath
  tilak_done           BOOLEAN DEFAULT false,  -- tilak/chandan applied
  sandhya_done         BOOLEAN DEFAULT false,  -- sandhya vandana
  japa_done            BOOLEAN DEFAULT false,  -- morning japa session
  shloka_done          BOOLEAN DEFAULT false,  -- daily shloka reading
  aarti_done           BOOLEAN DEFAULT false,  -- diya/aarti

  -- Computed
  steps_completed      INT GENERATED ALWAYS AS (
    (woke_brahma_muhurta::int + snana_done::int + tilak_done::int +
     sandhya_done::int + japa_done::int + shloka_done::int + aarti_done::int)
  ) STORED,
  full_sequence        BOOLEAN GENERATED ALWAYS AS (
    woke_brahma_muhurta AND snana_done AND tilak_done AND
    sandhya_done AND japa_done AND shloka_done AND aarti_done
  ) STORED,

  completed_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT nitya_karma_log_user_date UNIQUE (user_id, date)
);

-- ── 2. Nitya karma streaks ──
-- Separate from sadhana streak — tracks consecutive days of full sequence

CREATE TABLE IF NOT EXISTS nitya_karma_streaks (
  user_id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak  INT DEFAULT 0,
  longest_streak  INT DEFAULT 0,
  last_full_date  DATE,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── 3. Indexes ──

CREATE INDEX IF NOT EXISTS idx_nitya_karma_user_date
  ON nitya_karma_log (user_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_nitya_karma_full
  ON nitya_karma_log (user_id, full_sequence)
  WHERE full_sequence = true;

-- ── 4. RLS ──

ALTER TABLE nitya_karma_log     ENABLE ROW LEVEL SECURITY;
ALTER TABLE nitya_karma_streaks ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'nitya_karma_log' AND policyname = 'Users manage own nitya karma'
  ) THEN
    CREATE POLICY "Users manage own nitya karma"
      ON nitya_karma_log FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'nitya_karma_streaks' AND policyname = 'Users manage own nitya streaks'
  ) THEN
    CREATE POLICY "Users manage own nitya streaks"
      ON nitya_karma_streaks FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ── 5. Upsert helper ──
-- Called from client to mark a step complete

CREATE OR REPLACE FUNCTION mark_nitya_step(
  p_user_id UUID,
  p_date    DATE,
  p_step    TEXT,   -- 'woke_brahma_muhurta' | 'snana_done' | etc.
  p_done    BOOLEAN DEFAULT true
) RETURNS nitya_karma_log AS $$
DECLARE
  v_row nitya_karma_log;
BEGIN
  -- Ensure row exists
  INSERT INTO nitya_karma_log (user_id, date)
  VALUES (p_user_id, p_date)
  ON CONFLICT (user_id, date) DO NOTHING;

  -- Update the specific step using dynamic SQL
  EXECUTE format(
    'UPDATE nitya_karma_log SET %I = $1, updated_at = NOW() WHERE user_id = $2 AND date = $3',
    p_step
  ) USING p_done, p_user_id, p_date;

  SELECT * INTO v_row FROM nitya_karma_log WHERE user_id = p_user_id AND date = p_date;
  RETURN v_row;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
