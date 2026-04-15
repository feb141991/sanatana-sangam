-- ============================================================
-- Migration 009: Shloka Memorisation — SM-2 Spaced Repetition
-- Implements the SuperMemo SM-2 algorithm for shloka memorisation.
-- SAFE TO RE-RUN — all IF NOT EXISTS / CREATE OR REPLACE.
-- ============================================================

-- ── 1. Memorisation queue ──
-- One row per (user, verse). Tracks SM-2 state.

CREATE TABLE IF NOT EXISTS memorisation_queue (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chunk_id        UUID NOT NULL,   -- references scripture_chunks.id
  text_id         TEXT NOT NULL,   -- 'gita', 'isha_upanishad', etc.
  chapter         INT,
  verse           INT,

  -- SM-2 algorithm state
  ease_factor     FLOAT  DEFAULT 2.5,   -- starts at 2.5, min 1.3
  interval_days   INT    DEFAULT 1,     -- days until next review
  repetitions     INT    DEFAULT 0,     -- successful reviews in a row
  next_review_at  DATE   DEFAULT CURRENT_DATE,
  last_reviewed   DATE,

  -- Quality of last review (0-5 scale per SM-2)
  last_quality    INT CHECK (last_quality BETWEEN 0 AND 5),

  -- Status
  status          TEXT DEFAULT 'learning'  -- 'learning' | 'reviewing' | 'mastered'
                  CHECK (status IN ('learning', 'reviewing', 'mastered')),

  added_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT memorisation_user_chunk UNIQUE (user_id, chunk_id)
);

-- ── 2. Memorisation history ──
-- Audit trail of every review session

CREATE TABLE IF NOT EXISTS memorisation_history (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chunk_id    UUID NOT NULL,
  quality     INT NOT NULL CHECK (quality BETWEEN 0 AND 5),
  time_taken_s INT,          -- seconds spent on this card
  reviewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 3. Indexes ──

CREATE INDEX IF NOT EXISTS idx_memorisation_due
  ON memorisation_queue (user_id, next_review_at);

CREATE INDEX IF NOT EXISTS idx_memorisation_status
  ON memorisation_queue (user_id, status);

CREATE INDEX IF NOT EXISTS idx_memorisation_history_user
  ON memorisation_history (user_id, reviewed_at DESC);

-- ── 4. RLS ──

ALTER TABLE memorisation_queue   ENABLE ROW LEVEL SECURITY;
ALTER TABLE memorisation_history ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'memorisation_queue' AND policyname = 'Users manage own queue'
  ) THEN
    CREATE POLICY "Users manage own queue"
      ON memorisation_queue FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'memorisation_history' AND policyname = 'Users manage own history'
  ) THEN
    CREATE POLICY "Users manage own history"
      ON memorisation_history FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ── 5. SM-2 review function ──
-- Call after each review with the quality score (0-5).
-- Returns the updated queue row.
--
-- SM-2 algorithm:
--   if quality >= 3 (remembered):
--     if repetitions = 0: interval = 1
--     if repetitions = 1: interval = 6
--     else:               interval = round(interval * ease_factor)
--     ease_factor = ease_factor + 0.1 - (5 - quality) * 0.08 + (5 - quality) * 0.02
--     ease_factor = max(1.3, ease_factor)
--     repetitions += 1
--   else (forgot):
--     repetitions = 0
--     interval = 1
--   next_review_at = today + interval

CREATE OR REPLACE FUNCTION sm2_review(
  p_user_id  UUID,
  p_chunk_id UUID,
  p_quality  INT,         -- 0-5
  p_time_s   INT DEFAULT NULL
) RETURNS memorisation_queue AS $$
DECLARE
  v_row       memorisation_queue;
  v_ef        FLOAT;
  v_interval  INT;
  v_reps      INT;
  v_status    TEXT;
BEGIN
  -- Fetch current state (insert if first review)
  INSERT INTO memorisation_queue (user_id, chunk_id, text_id)
  SELECT p_user_id, p_chunk_id, COALESCE(text_id, 'unknown')
  FROM scripture_chunks WHERE id = p_chunk_id
  ON CONFLICT (user_id, chunk_id) DO NOTHING;

  SELECT * INTO v_row FROM memorisation_queue
  WHERE user_id = p_user_id AND chunk_id = p_chunk_id;

  v_ef       := v_row.ease_factor;
  v_interval := v_row.interval_days;
  v_reps     := v_row.repetitions;

  IF p_quality >= 3 THEN
    -- Remembered
    IF v_reps = 0 THEN
      v_interval := 1;
    ELSIF v_reps = 1 THEN
      v_interval := 6;
    ELSE
      v_interval := ROUND(v_interval * v_ef)::INT;
    END IF;
    v_ef   := v_ef + 0.1 - (5 - p_quality) * 0.08 + (5 - p_quality) * 0.02;
    v_ef   := GREATEST(1.3, v_ef);
    v_reps := v_reps + 1;
  ELSE
    -- Forgot
    v_reps     := 0;
    v_interval := 1;
  END IF;

  -- Determine status
  IF v_reps >= 10 AND v_ef >= 2.3 THEN
    v_status := 'mastered';
  ELSIF v_reps >= 3 THEN
    v_status := 'reviewing';
  ELSE
    v_status := 'learning';
  END IF;

  -- Update queue
  UPDATE memorisation_queue SET
    ease_factor    = v_ef,
    interval_days  = v_interval,
    repetitions    = v_reps,
    last_quality   = p_quality,
    last_reviewed  = CURRENT_DATE,
    next_review_at = CURRENT_DATE + v_interval,
    status         = v_status,
    updated_at     = NOW()
  WHERE user_id = p_user_id AND chunk_id = p_chunk_id;

  -- Log history
  INSERT INTO memorisation_history (user_id, chunk_id, quality, time_taken_s)
  VALUES (p_user_id, p_chunk_id, p_quality, p_time_s);

  SELECT * INTO v_row FROM memorisation_queue
  WHERE user_id = p_user_id AND chunk_id = p_chunk_id;
  RETURN v_row;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 6. Due cards view ──

CREATE OR REPLACE VIEW memorisation_due AS
SELECT
  mq.*,
  sc.sanskrit,
  sc.transliteration,
  sc.translation,
  sc.chapter,
  sc.verse
FROM memorisation_queue mq
JOIN scripture_chunks sc ON sc.id = mq.chunk_id
WHERE mq.next_review_at <= CURRENT_DATE
  AND mq.status != 'mastered';
