-- ============================================================
-- Migration 011 — Pathshala Schema
--
-- Builds the complete learning platform layer:
--   • Corpus metadata extensions on scripture_chunks
--   • Multi-language translation store
--   • Curriculum paths + enrollment + progress
--   • Shruti: voice recitation recordings + AI/guru reviews
--   • Verse mastery rollup
--   • Badges / achievements
--   • Kul study circles
--
-- Safe to re-run: all DDL uses IF NOT EXISTS / DO $$ guards
-- ============================================================

-- ── 0. Enable required extensions ───────────────────────────

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- pgvector already enabled from 002_phase2_ai.sql

-- ============================================================
-- 1. EXTEND scripture_chunks
--    Add language, script, and corpus classification metadata
-- ============================================================

ALTER TABLE scripture_chunks
  ADD COLUMN IF NOT EXISTS language           TEXT    DEFAULT 'sa',
  ADD COLUMN IF NOT EXISTS script             TEXT    DEFAULT 'Devanagari',
  ADD COLUMN IF NOT EXISTS transliteration    TEXT,         -- IAST romanisation
  ADD COLUMN IF NOT EXISTS tradition_region   TEXT,         -- 'north' | 'south' | 'east' | 'west' | 'pan'
  ADD COLUMN IF NOT EXISTS text_category      TEXT    DEFAULT 'shruti';
  -- text_category: 'shruti' | 'smriti' | 'itihasa' | 'purana' | 'darshana'
  --                'bhakti' | 'stotra' | 'doha' | 'pasuram' | 'agama' | 'tantra'

COMMENT ON COLUMN scripture_chunks.language         IS 'ISO 639-1/3 language code: sa=Sanskrit, hi=Hindi, ta=Tamil, bn=Bengali, te=Telugu, kn=Kannada, ml=Malayalam, mr=Marathi, gu=Gujarati, or=Odia, awa=Awadhi, en=English';
COMMENT ON COLUMN scripture_chunks.script           IS 'Writing system: Devanagari, Tamil, Bengali, Telugu, Kannada, Malayalam, Gujarati, Odia, IAST, Latin';
COMMENT ON COLUMN scripture_chunks.transliteration  IS 'IAST romanisation for Sanskrit; helpful for non-script readers and STT comparison';
COMMENT ON COLUMN scripture_chunks.tradition_region IS 'Geographic tradition: north | south | east | west | pan (pan-India)';
COMMENT ON COLUMN scripture_chunks.text_category    IS 'Canonical text classification for corpus browsing';

-- Index for corpus browsing by language/category
CREATE INDEX IF NOT EXISTS idx_scripture_chunks_language
  ON scripture_chunks (language, text_category);

CREATE INDEX IF NOT EXISTS idx_scripture_chunks_tradition
  ON scripture_chunks (tradition_region, text_category);

-- ============================================================
-- 2. MULTI-LANGUAGE TRANSLATIONS
--    One row per (chunk × language). Keeps originals clean.
-- ============================================================

CREATE TABLE IF NOT EXISTS pathshala_translations (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  chunk_id        UUID        NOT NULL REFERENCES scripture_chunks (id) ON DELETE CASCADE,
  language        TEXT        NOT NULL,  -- ISO 639 code (hi, en, ta, bn ...)
  script          TEXT        NOT NULL,  -- script name
  translation     TEXT        NOT NULL,
  transliteration TEXT,                 -- romanised version where helpful
  translator      TEXT,                 -- name / source attribution
  is_ai_generated BOOLEAN     NOT NULL DEFAULT false,
  verified        BOOLEAN     NOT NULL DEFAULT false,  -- manually reviewed
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (chunk_id, language)
);

CREATE INDEX IF NOT EXISTS idx_pathshala_translations_chunk
  ON pathshala_translations (chunk_id, language);

-- ============================================================
-- 3. CURRICULUM PATHS
--    Predefined learning journeys (seeded in 012)
-- ============================================================

CREATE TABLE IF NOT EXISTS pathshala_paths (
  id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug                TEXT        NOT NULL UNIQUE,
  title               TEXT        NOT NULL,
  subtitle            TEXT,
  description         TEXT,
  language            TEXT        NOT NULL DEFAULT 'sa',
  tradition           TEXT,               -- shaiva | vaishnava | shakta | smarta | sant | jnana | yoga
  difficulty          TEXT        NOT NULL DEFAULT 'beginner'
                        CHECK (difficulty IN ('beginner','intermediate','advanced')),
  text_category       TEXT        NOT NULL DEFAULT 'smriti',
  total_chunks        INT         NOT NULL DEFAULT 0,
  estimated_weeks     INT         NOT NULL DEFAULT 4,
  cover_emoji         TEXT        DEFAULT '📖',
  cover_color         TEXT        DEFAULT '#FF6B35',  -- hex for UI theming
  is_active           BOOLEAN     NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE pathshala_paths IS 'Curriculum path definitions — seeded, not user-created. One row per course.';

-- ============================================================
-- 4. PATH → CHUNKS (ordered curriculum)
--    Maps which chunks belong to which path, in what order
-- ============================================================

CREATE TABLE IF NOT EXISTS pathshala_path_chunks (
  id          UUID  PRIMARY KEY DEFAULT uuid_generate_v4(),
  path_id     UUID  NOT NULL REFERENCES pathshala_paths    (id) ON DELETE CASCADE,
  chunk_id    UUID  NOT NULL REFERENCES scripture_chunks   (id) ON DELETE CASCADE,
  position    INT   NOT NULL,   -- global order within the path (1-based)
  week_number INT   NOT NULL DEFAULT 1,
  day_number  INT   NOT NULL DEFAULT 1,
  is_optional BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (path_id, chunk_id),
  UNIQUE (path_id, position)
);

CREATE INDEX IF NOT EXISTS idx_pathshala_path_chunks_path
  ON pathshala_path_chunks (path_id, position);

-- ============================================================
-- 5. ENROLLMENTS
--    User subscribes to a learning path
-- ============================================================

CREATE TABLE IF NOT EXISTS pathshala_enrollments (
  id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID        NOT NULL,
  path_id             UUID        NOT NULL REFERENCES pathshala_paths (id) ON DELETE CASCADE,
  enrolled_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_position    INT         NOT NULL DEFAULT 1,   -- position in pathshala_path_chunks
  completed_at        TIMESTAMPTZ,
  paused              BOOLEAN     NOT NULL DEFAULT false,
  language_pref       TEXT        NOT NULL DEFAULT 'en', -- preferred translation language
  daily_target_chunks INT         NOT NULL DEFAULT 1,    -- how many chunks per day
  last_activity_at    TIMESTAMPTZ,
  UNIQUE (user_id, path_id)
);

CREATE INDEX IF NOT EXISTS idx_pathshala_enrollments_user
  ON pathshala_enrollments (user_id);

CREATE INDEX IF NOT EXISTS idx_pathshala_enrollments_path
  ON pathshala_enrollments (path_id);

-- ============================================================
-- 6. LEARNING PROGRESS
--    Per-chunk completion record for each user
-- ============================================================

CREATE TABLE IF NOT EXISTS pathshala_progress (
  id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID        NOT NULL,
  chunk_id            UUID        NOT NULL REFERENCES scripture_chunks (id) ON DELETE CASCADE,
  path_id             UUID        REFERENCES pathshala_paths (id) ON DELETE SET NULL,
  enrollment_id       UUID        REFERENCES pathshala_enrollments (id) ON DELETE SET NULL,
  read_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_count          INT         NOT NULL DEFAULT 1,     -- re-reads tracked
  comprehension_score INT         CHECK (comprehension_score BETWEEN 1 AND 5),
  memorization_level  INT         NOT NULL DEFAULT 0 CHECK (memorization_level BETWEEN 0 AND 5),
  recitation_score    NUMERIC(3,1) CHECK (recitation_score BETWEEN 0 AND 5),
  notes               TEXT,       -- user's personal annotation/reflection
  UNIQUE (user_id, chunk_id, path_id)
);

CREATE INDEX IF NOT EXISTS idx_pathshala_progress_user
  ON pathshala_progress (user_id, path_id);

CREATE INDEX IF NOT EXISTS idx_pathshala_progress_chunk
  ON pathshala_progress (chunk_id, user_id);

-- ============================================================
-- 7. SHRUTI — RECITATION RECORDINGS
--    Audio blob references stored in Supabase Storage
-- ============================================================

CREATE TABLE IF NOT EXISTS pathshala_recordings (
  id                UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID        NOT NULL,
  chunk_id          UUID        NOT NULL REFERENCES scripture_chunks (id) ON DELETE CASCADE,
  enrollment_id     UUID        REFERENCES pathshala_enrollments (id) ON DELETE SET NULL,

  -- Storage
  audio_url         TEXT        NOT NULL,   -- Supabase Storage signed URL path
  audio_bucket      TEXT        NOT NULL DEFAULT 'pathshala-recordings',
  duration_s        NUMERIC(6,1),           -- recording duration in seconds
  file_size_bytes   INT,

  -- Language context
  language          TEXT        NOT NULL DEFAULT 'sa',
  script            TEXT        NOT NULL DEFAULT 'Devanagari',

  -- Transcript (filled after STT processing)
  transcript        TEXT,                   -- what Groq Whisper heard
  expected_text     TEXT        NOT NULL,   -- the correct shloka text (snapshot at time of recording)

  -- Workflow state
  status            TEXT        NOT NULL DEFAULT 'processing'
                      CHECK (status IN ('processing','scored','pending_guru','guru_reviewed','error')),
  error_message     TEXT,                   -- set if status = 'error'

  submitted_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  scored_at         TIMESTAMPTZ,
  reviewed_at       TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_pathshala_recordings_user
  ON pathshala_recordings (user_id, submitted_at DESC);

CREATE INDEX IF NOT EXISTS idx_pathshala_recordings_chunk
  ON pathshala_recordings (chunk_id, user_id);

CREATE INDEX IF NOT EXISTS idx_pathshala_recordings_status
  ON pathshala_recordings (status) WHERE status IN ('processing','pending_guru');

-- ============================================================
-- 8. SHRUTI — RECITATION REVIEWS
--    AI score (reviewer_id IS NULL) or human guru score
-- ============================================================

CREATE TABLE IF NOT EXISTS pathshala_recitation_reviews (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  recording_id    UUID        NOT NULL REFERENCES pathshala_recordings (id) ON DELETE CASCADE,

  reviewer_id     UUID,                     -- NULL = AI, UUID = guru/peer user
  reviewer_type   TEXT        NOT NULL DEFAULT 'ai'
                    CHECK (reviewer_type IN ('ai','guru','peer')),

  -- Dimension scores (1.0 – 5.0, NULL if not applicable)
  score_uccharan  NUMERIC(3,1) CHECK (score_uccharan  BETWEEN 1 AND 5),  -- pronunciation
  score_sandhi    NUMERIC(3,1) CHECK (score_sandhi    BETWEEN 1 AND 5),  -- word junctions (Sanskrit)
  score_visarga   NUMERIC(3,1) CHECK (score_visarga   BETWEEN 1 AND 5),  -- visarga accuracy (Sanskrit)
  score_laya      NUMERIC(3,1) CHECK (score_laya      BETWEEN 1 AND 5),  -- rhythm / meter
  score_svara     NUMERIC(3,1) CHECK (score_svara     BETWEEN 1 AND 5),  -- pitch accents (Vedic only)
  score_fluency   NUMERIC(3,1) CHECK (score_fluency   BETWEEN 1 AND 5),  -- smooth vs halting

  overall_score   NUMERIC(3,1) NOT NULL CHECK (overall_score BETWEEN 1 AND 5),

  -- Qualitative feedback
  feedback_text   TEXT,                     -- written feedback from guru or AI summary
  corrections     JSONB DEFAULT '[]'::jsonb,
  -- corrections structure:
  -- [{ "word": "dharmaḥ", "said": "dharma", "position": 3, "rule": "visarga dropped", "severity": "minor" }]

  -- Mastery certification (guru only)
  is_certified    BOOLEAN     NOT NULL DEFAULT false,

  reviewed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pathshala_reviews_recording
  ON pathshala_recitation_reviews (recording_id);

CREATE INDEX IF NOT EXISTS idx_pathshala_reviews_reviewer
  ON pathshala_recitation_reviews (reviewer_id) WHERE reviewer_id IS NOT NULL;

-- ============================================================
-- 9. VERSE MASTERY
--    Rollup of best scores per user × chunk
--    Updated by trigger after each review
-- ============================================================

CREATE TABLE IF NOT EXISTS pathshala_verse_mastery (
  user_id           UUID        NOT NULL,
  chunk_id          UUID        NOT NULL REFERENCES scripture_chunks (id) ON DELETE CASCADE,
  best_ai_score     NUMERIC(3,1),
  best_guru_score   NUMERIC(3,1),
  attempt_count     INT         NOT NULL DEFAULT 0,
  last_attempt_at   TIMESTAMPTZ,
  certified         BOOLEAN     NOT NULL DEFAULT false,
  certified_by      UUID,                   -- guru user_id who certified
  certified_at      TIMESTAMPTZ,
  -- Combined mastery: reading + memorisation + recitation
  memorization_sm2  INT         NOT NULL DEFAULT 0,  -- SM-2 repetitions from memorisation_queue
  comprehension     INT         NOT NULL DEFAULT 0,  -- best comprehension quiz score (1-5)
  is_fully_mastered BOOLEAN     GENERATED ALWAYS AS (
    certified AND memorization_sm2 >= 3 AND comprehension >= 4
  ) STORED,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, chunk_id)
);

CREATE INDEX IF NOT EXISTS idx_pathshala_verse_mastery_user
  ON pathshala_verse_mastery (user_id, certified, is_fully_mastered);

-- Trigger: update verse_mastery after each recitation review
CREATE OR REPLACE FUNCTION update_verse_mastery_after_review()
RETURNS TRIGGER AS $$
DECLARE
  v_chunk_id UUID;
  v_user_id  UUID;
BEGIN
  -- Get recording context
  SELECT r.chunk_id, r.user_id
    INTO v_chunk_id, v_user_id
    FROM pathshala_recordings r
   WHERE r.id = NEW.recording_id;

  -- Upsert mastery record
  INSERT INTO pathshala_verse_mastery (user_id, chunk_id, attempt_count, last_attempt_at)
    VALUES (v_user_id, v_chunk_id, 1, NOW())
    ON CONFLICT (user_id, chunk_id)
    DO UPDATE SET
      attempt_count   = pathshala_verse_mastery.attempt_count + 1,
      last_attempt_at = NOW(),
      updated_at      = NOW();

  -- Update best scores per reviewer type
  IF NEW.reviewer_type = 'ai' THEN
    UPDATE pathshala_verse_mastery
       SET best_ai_score = GREATEST(COALESCE(best_ai_score, 0), NEW.overall_score)
     WHERE user_id = v_user_id AND chunk_id = v_chunk_id;
  ELSE
    UPDATE pathshala_verse_mastery
       SET best_guru_score = GREATEST(COALESCE(best_guru_score, 0), NEW.overall_score),
           certified       = CASE WHEN NEW.is_certified THEN true ELSE certified END,
           certified_by    = CASE WHEN NEW.is_certified THEN NEW.reviewer_id ELSE certified_by END,
           certified_at    = CASE WHEN NEW.is_certified THEN NOW() ELSE certified_at END
     WHERE user_id = v_user_id AND chunk_id = v_chunk_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_verse_mastery_after_review ON pathshala_recitation_reviews;
CREATE TRIGGER trg_verse_mastery_after_review
  AFTER INSERT ON pathshala_recitation_reviews
  FOR EACH ROW EXECUTE FUNCTION update_verse_mastery_after_review();

-- ============================================================
-- 10. BADGES — achievement definitions + user records
-- ============================================================

CREATE TABLE IF NOT EXISTS pathshala_badges (
  id          UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug        TEXT    NOT NULL UNIQUE,
  title       TEXT    NOT NULL,
  emoji       TEXT    NOT NULL DEFAULT '🏅',
  description TEXT    NOT NULL,
  category    TEXT    NOT NULL DEFAULT 'learning'
                CHECK (category IN ('learning','recitation','community','streak','mastery')),
  -- Criteria stored as JSONB for flexible evaluation
  -- e.g. { "type": "path_complete", "path_slug": "bhagavad-gita-18-chapters" }
  -- e.g. { "type": "recitation_score", "min_score": 4.5, "count": 5 }
  -- e.g. { "type": "verses_certified", "count": 10 }
  criteria    JSONB   NOT NULL DEFAULT '{}'::jsonb,
  is_active   BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS pathshala_user_badges (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID        NOT NULL,
  badge_id    UUID        NOT NULL REFERENCES pathshala_badges (id) ON DELETE CASCADE,
  earned_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  context     JSONB       DEFAULT '{}'::jsonb,  -- e.g. { "path_id": "...", "recording_id": "..." }
  UNIQUE (user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_pathshala_user_badges_user
  ON pathshala_user_badges (user_id, earned_at DESC);

-- ============================================================
-- 11. KUL STUDY CIRCLES
--    A kul does a learning path together
-- ============================================================

CREATE TABLE IF NOT EXISTS pathshala_study_circles (
  id                      UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  kul_id                  UUID        NOT NULL,  -- references kuls table in Sangam
  path_id                 UUID        NOT NULL REFERENCES pathshala_paths (id) ON DELETE CASCADE,
  created_by              UUID        NOT NULL,  -- guardian user_id
  title                   TEXT,                  -- custom circle name, defaults to path title
  description             TEXT,
  started_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  target_completion_date  DATE,
  chunks_per_week         INT         NOT NULL DEFAULT 7,
  is_active               BOOLEAN     NOT NULL DEFAULT true,
  UNIQUE (kul_id, path_id)           -- one active circle per kul per path
);

CREATE INDEX IF NOT EXISTS idx_pathshala_study_circles_kul
  ON pathshala_study_circles (kul_id, is_active);

CREATE TABLE IF NOT EXISTS pathshala_circle_members (
  id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  circle_id        UUID        NOT NULL REFERENCES pathshala_study_circles (id) ON DELETE CASCADE,
  user_id          UUID        NOT NULL,
  joined_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_position INT         NOT NULL DEFAULT 1,
  last_activity_at TIMESTAMPTZ,
  UNIQUE (circle_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_pathshala_circle_members_circle
  ON pathshala_circle_members (circle_id, current_position DESC);

CREATE INDEX IF NOT EXISTS idx_pathshala_circle_members_user
  ON pathshala_circle_members (user_id);

-- ============================================================
-- 12. VIEWS
-- ============================================================

-- Today's pending lessons for a user across all active enrollments
CREATE OR REPLACE VIEW pathshala_today_lessons
WITH (security_invoker = true)
AS
SELECT
  e.user_id,
  e.id                AS enrollment_id,
  e.path_id,
  p.title             AS path_title,
  p.cover_emoji,
  e.current_position,
  pc.chunk_id,
  pc.week_number,
  pc.day_number,
  sc.text_id,
  sc.chapter,
  sc.verse,
  sc.sanskrit         AS original_text,
  sc.translation      AS default_translation,
  sc.language,
  sc.script,
  sc.transliteration,
  COALESCE(pr.read_count, 0)          AS times_read,
  COALESCE(pr.recitation_score, 0)    AS best_recitation,
  vm.certified
FROM pathshala_enrollments e
JOIN pathshala_paths       p  ON p.id  = e.path_id
JOIN pathshala_path_chunks pc ON pc.path_id  = e.path_id
                              AND pc.position = e.current_position
JOIN scripture_chunks      sc ON sc.id = pc.chunk_id
LEFT JOIN pathshala_progress pr ON pr.user_id = e.user_id
                                AND pr.chunk_id = pc.chunk_id
                                AND pr.path_id  = e.path_id
LEFT JOIN pathshala_verse_mastery vm ON vm.user_id  = e.user_id
                                     AND vm.chunk_id = pc.chunk_id
WHERE e.paused = false
  AND e.completed_at IS NULL;

-- Circle leaderboard: members ranked by position within their study circle
CREATE OR REPLACE VIEW pathshala_circle_leaderboard
WITH (security_invoker = true)
AS
SELECT
  cm.circle_id,
  sc_circle.kul_id,
  sc_circle.path_id,
  p.title           AS path_title,
  p.total_chunks,
  cm.user_id,
  cm.current_position,
  cm.last_activity_at,
  ROUND(cm.current_position::NUMERIC / NULLIF(p.total_chunks, 0) * 100, 1) AS pct_complete,
  RANK() OVER (PARTITION BY cm.circle_id ORDER BY cm.current_position DESC) AS rank
FROM pathshala_circle_members  cm
JOIN pathshala_study_circles   sc_circle ON sc_circle.id = cm.circle_id
JOIN pathshala_paths           p         ON p.id = sc_circle.path_id;

-- Per-user recitation stats (for profile display)
CREATE OR REPLACE VIEW pathshala_recitation_stats
WITH (security_invoker = true)
AS
SELECT
  r.user_id,
  COUNT(*)                                          AS total_recordings,
  COUNT(*) FILTER (WHERE r.status = 'scored')       AS scored_count,
  ROUND(AVG(rr.overall_score)::NUMERIC, 2)          AS avg_overall_score,
  ROUND(AVG(rr.score_uccharan)::NUMERIC, 2)         AS avg_uccharan,
  ROUND(AVG(rr.score_fluency)::NUMERIC, 2)          AS avg_fluency,
  COUNT(DISTINCT r.chunk_id)                        AS unique_verses_attempted,
  COUNT(*) FILTER (WHERE rr.is_certified = true)    AS certified_count,
  MAX(rr.reviewed_at)                               AS last_reviewed_at
FROM pathshala_recordings         r
LEFT JOIN pathshala_recitation_reviews rr ON rr.recording_id = r.id
                                          AND rr.reviewer_type = 'ai'
GROUP BY r.user_id;

-- ============================================================
-- 13. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE pathshala_translations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE pathshala_paths             ENABLE ROW LEVEL SECURITY;
ALTER TABLE pathshala_path_chunks       ENABLE ROW LEVEL SECURITY;
ALTER TABLE pathshala_enrollments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE pathshala_progress          ENABLE ROW LEVEL SECURITY;
ALTER TABLE pathshala_recordings        ENABLE ROW LEVEL SECURITY;
ALTER TABLE pathshala_recitation_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE pathshala_verse_mastery     ENABLE ROW LEVEL SECURITY;
ALTER TABLE pathshala_badges            ENABLE ROW LEVEL SECURITY;
ALTER TABLE pathshala_user_badges       ENABLE ROW LEVEL SECURITY;
ALTER TABLE pathshala_study_circles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE pathshala_circle_members    ENABLE ROW LEVEL SECURITY;

-- Public read: corpus, paths, path_chunks, badges (everyone can browse)
DO $$ BEGIN
  -- pathshala_translations
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read translations'
                 AND tablename = 'pathshala_translations') THEN
    CREATE POLICY "Public read translations" ON pathshala_translations
      FOR SELECT USING (true);
  END IF;

  -- pathshala_paths
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read paths'
                 AND tablename = 'pathshala_paths') THEN
    CREATE POLICY "Public read paths" ON pathshala_paths
      FOR SELECT USING (is_active = true);
  END IF;

  -- pathshala_path_chunks
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read path chunks'
                 AND tablename = 'pathshala_path_chunks') THEN
    CREATE POLICY "Public read path chunks" ON pathshala_path_chunks
      FOR SELECT USING (true);
  END IF;

  -- pathshala_badges
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read badges'
                 AND tablename = 'pathshala_badges') THEN
    CREATE POLICY "Public read badges" ON pathshala_badges
      FOR SELECT USING (is_active = true);
  END IF;

  -- pathshala_enrollments: own rows only
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users manage own enrollments'
                 AND tablename = 'pathshala_enrollments') THEN
    CREATE POLICY "Users manage own enrollments" ON pathshala_enrollments
      FOR ALL USING (auth.uid() = user_id);
  END IF;

  -- pathshala_progress: own rows only
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users manage own progress'
                 AND tablename = 'pathshala_progress') THEN
    CREATE POLICY "Users manage own progress" ON pathshala_progress
      FOR ALL USING (auth.uid() = user_id);
  END IF;

  -- pathshala_recordings: own rows only
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users manage own recordings'
                 AND tablename = 'pathshala_recordings') THEN
    CREATE POLICY "Users manage own recordings" ON pathshala_recordings
      FOR ALL USING (auth.uid() = user_id);
  END IF;

  -- pathshala_recitation_reviews: read own, write if reviewer
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users read own reviews'
                 AND tablename = 'pathshala_recitation_reviews') THEN
    CREATE POLICY "Users read own reviews" ON pathshala_recitation_reviews
      FOR SELECT USING (
        reviewer_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM pathshala_recordings r
          WHERE r.id = recording_id AND r.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Reviewers insert reviews'
                 AND tablename = 'pathshala_recitation_reviews') THEN
    CREATE POLICY "Reviewers insert reviews" ON pathshala_recitation_reviews
      FOR INSERT WITH CHECK (
        reviewer_type = 'ai'  -- Edge Functions use service role, bypass RLS
        OR reviewer_id = auth.uid()
      );
  END IF;

  -- pathshala_verse_mastery: own rows only
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users manage own mastery'
                 AND tablename = 'pathshala_verse_mastery') THEN
    CREATE POLICY "Users manage own mastery" ON pathshala_verse_mastery
      FOR ALL USING (auth.uid() = user_id);
  END IF;

  -- pathshala_user_badges: own rows only
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users read own badges'
                 AND tablename = 'pathshala_user_badges') THEN
    CREATE POLICY "Users read own badges" ON pathshala_user_badges
      FOR SELECT USING (auth.uid() = user_id);
  END IF;

  -- pathshala_study_circles: kul members can read; guardians can write
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Kul members read circles'
                 AND tablename = 'pathshala_study_circles') THEN
    CREATE POLICY "Kul members read circles" ON pathshala_study_circles
      FOR SELECT USING (true);  -- scoped at kul level in application
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Circle creators manage circles'
                 AND tablename = 'pathshala_study_circles') THEN
    CREATE POLICY "Circle creators manage circles" ON pathshala_study_circles
      FOR ALL USING (auth.uid() = created_by);
  END IF;

  -- pathshala_circle_members: own rows only for members
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users manage own circle membership'
                 AND tablename = 'pathshala_circle_members') THEN
    CREATE POLICY "Users manage own circle membership" ON pathshala_circle_members
      FOR ALL USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Circle members read all member positions'
                 AND tablename = 'pathshala_circle_members') THEN
    CREATE POLICY "Circle members read all member positions" ON pathshala_circle_members
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM pathshala_circle_members cm2
          WHERE cm2.circle_id = circle_id AND cm2.user_id = auth.uid()
        )
      );
  END IF;

END $$;

-- ============================================================
-- 14. HELPER FUNCTIONS
-- ============================================================

-- Advance enrollment to the next chunk
CREATE OR REPLACE FUNCTION advance_enrollment(
  p_user_id UUID,
  p_path_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_enrollment    pathshala_enrollments%ROWTYPE;
  v_total_chunks  INT;
  v_next_position INT;
BEGIN
  -- Lock the enrollment row
  SELECT * INTO v_enrollment
    FROM pathshala_enrollments
   WHERE user_id = p_user_id AND path_id = p_path_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'enrollment_not_found');
  END IF;

  SELECT total_chunks INTO v_total_chunks
    FROM pathshala_paths WHERE id = p_path_id;

  v_next_position := v_enrollment.current_position + 1;

  IF v_next_position > v_total_chunks THEN
    -- Path complete
    UPDATE pathshala_enrollments
       SET current_position = v_total_chunks,
           completed_at     = NOW(),
           last_activity_at = NOW()
     WHERE user_id = p_user_id AND path_id = p_path_id;

    RETURN jsonb_build_object(
      'status',           'completed',
      'position',         v_total_chunks,
      'total_chunks',     v_total_chunks
    );
  ELSE
    UPDATE pathshala_enrollments
       SET current_position = v_next_position,
           last_activity_at = NOW()
     WHERE user_id = p_user_id AND path_id = p_path_id;

    RETURN jsonb_build_object(
      'status',           'advanced',
      'position',         v_next_position,
      'total_chunks',     v_total_chunks,
      'pct_complete',     ROUND(v_next_position::NUMERIC / v_total_chunks * 100, 1)
    );
  END IF;
END;
$$;

-- Award a badge if not already earned
CREATE OR REPLACE FUNCTION award_badge_if_earned(
  p_user_id   UUID,
  p_badge_slug TEXT,
  p_context   JSONB DEFAULT '{}'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_badge_id UUID;
BEGIN
  SELECT id INTO v_badge_id FROM pathshala_badges WHERE slug = p_badge_slug;
  IF NOT FOUND THEN RETURN false; END IF;

  INSERT INTO pathshala_user_badges (user_id, badge_id, context)
    VALUES (p_user_id, v_badge_id, p_context)
    ON CONFLICT (user_id, badge_id) DO NOTHING;

  RETURN FOUND;
END;
$$;

-- ============================================================
-- DONE
-- ============================================================
-- Tables created:
--   pathshala_translations, pathshala_paths, pathshala_path_chunks,
--   pathshala_enrollments, pathshala_progress,
--   pathshala_recordings, pathshala_recitation_reviews,
--   pathshala_verse_mastery, pathshala_badges, pathshala_user_badges,
--   pathshala_study_circles, pathshala_circle_members
--
-- Views created:
--   pathshala_today_lessons, pathshala_circle_leaderboard,
--   pathshala_recitation_stats
--
-- Functions created:
--   update_verse_mastery_after_review() [trigger]
--   advance_enrollment(user_id, path_id)
--   award_badge_if_earned(user_id, badge_slug, context)
--
-- Next: run 012_pathshala_seed.sql to populate paths and badges
-- ============================================================
