-- ============================================================
-- Sadhana Engine — Phase 1 Database Schema
-- Run in Supabase SQL Editor
-- These tables are ADDITIVE — they don't touch existing Sangam tables
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================================
-- 1. Event log — raw behavioural data
-- ============================================================

CREATE TABLE IF NOT EXISTS sadhana_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_sadhana_events_user ON sadhana_events(user_id, created_at DESC);
CREATE INDEX idx_sadhana_events_type ON sadhana_events(event_type, created_at DESC);

-- RLS: users can only insert/read their own events
ALTER TABLE sadhana_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own events"
  ON sadhana_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own events"
  ON sadhana_events FOR SELECT
  USING (auth.uid() = user_id);


-- ============================================================
-- 2. Daily sadhana — streak tracking
-- ============================================================

CREATE TABLE IF NOT EXISTS daily_sadhana (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  japa_done BOOLEAN DEFAULT false,
  shloka_done BOOLEAN DEFAULT false,
  panchang_viewed BOOLEAN DEFAULT false,
  any_practice BOOLEAN DEFAULT false,
  streak_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date)
);

CREATE INDEX idx_daily_sadhana_user ON daily_sadhana(user_id, date DESC);

ALTER TABLE daily_sadhana ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own daily sadhana"
  ON daily_sadhana FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ============================================================
-- 3. User practice profile — computed nightly
-- ============================================================

CREATE TABLE IF NOT EXISTS user_practice (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Practice rhythm
  preferred_time TEXT DEFAULT 'irregular',
  avg_session_duration_s INT DEFAULT 0,
  consistency_score FLOAT DEFAULT 0,
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,

  -- Spiritual profile
  primary_path TEXT DEFAULT 'bhakti',
  preferred_deity TEXT DEFAULT 'general',
  tradition TEXT DEFAULT 'general',

  -- Content preferences
  content_depth TEXT DEFAULT 'beginner',
  language_pref TEXT[] DEFAULT ARRAY['english'],
  favorite_texts TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- Engagement patterns
  most_active_day TEXT DEFAULT 'unknown',
  skip_pattern JSONB DEFAULT '{}',
  re_engagement_style TEXT DEFAULT 'unknown',

  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE user_practice ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON user_practice FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can update (cron job runs as service role)
CREATE POLICY "Service can manage profiles"
  ON user_practice FOR ALL
  USING (true)
  WITH CHECK (true);


-- ============================================================
-- 4. Scripture chunks — with vector embeddings
-- ============================================================

CREATE TABLE IF NOT EXISTS scripture_chunks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  text_id TEXT NOT NULL,
  chapter INT NOT NULL,
  verse INT NOT NULL,
  sanskrit TEXT NOT NULL,
  transliteration TEXT,
  translation TEXT NOT NULL,
  word_by_word JSONB,
  commentary TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  embedding vector(384), -- all-MiniLM-L6-v2 outputs 384 dims
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(text_id, chapter, verse)
);

CREATE INDEX idx_scripture_text ON scripture_chunks(text_id, chapter, verse);

-- Vector similarity search index
CREATE INDEX idx_scripture_embedding
  ON scripture_chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 50);

-- Public read access for scripture
ALTER TABLE scripture_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Scripture is publicly readable"
  ON scripture_chunks FOR SELECT
  USING (true);


-- ============================================================
-- 5. Reading progress — per user per verse
-- ============================================================

CREATE TABLE IF NOT EXISTS reading_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  text_id TEXT NOT NULL,
  chapter INT NOT NULL,
  verse INT NOT NULL,
  completed BOOLEAN DEFAULT false,
  bookmarked BOOLEAN DEFAULT false,
  time_spent_s INT DEFAULT 0,
  read_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, text_id, chapter, verse)
);

CREATE INDEX idx_reading_user ON reading_progress(user_id, text_id, chapter, verse);

ALTER TABLE reading_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own reading progress"
  ON reading_progress FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ============================================================
-- 6. Sankalpa — user commitments
-- ============================================================

CREATE TABLE IF NOT EXISTS sankalpa (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL, -- 'japa', 'shloka', 'vrata', 'custom'
  description TEXT NOT NULL,
  target_days INT NOT NULL,
  target_count INT, -- for japa purashcharana
  mantra_id TEXT,
  text_id TEXT,
  started_at TIMESTAMPTZ DEFAULT now(),
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  status TEXT DEFAULT 'active', -- 'active', 'completed', 'broken', 'paused'
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE sankalpa ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own sankalpa"
  ON sankalpa FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ============================================================
-- 7. Semantic search function for Ask Scripture
-- ============================================================

CREATE OR REPLACE FUNCTION match_scriptures(
  query_embedding vector(384),
  match_count INT DEFAULT 5,
  match_threshold FLOAT DEFAULT 0.5
)
RETURNS TABLE (
  id UUID,
  text_id TEXT,
  chapter INT,
  verse INT,
  sanskrit TEXT,
  translation TEXT,
  commentary TEXT,
  tags TEXT[],
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    sc.id,
    sc.text_id,
    sc.chapter,
    sc.verse,
    sc.sanskrit,
    sc.translation,
    sc.commentary,
    sc.tags,
    1 - (sc.embedding <=> query_embedding) AS similarity
  FROM scripture_chunks sc
  WHERE 1 - (sc.embedding <=> query_embedding) > match_threshold
  ORDER BY sc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
