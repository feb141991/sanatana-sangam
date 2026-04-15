-- ============================================================
-- Phase 2 Migration: AI Intelligence Layer
-- Run this in Supabase SQL Editor after 001_phase1_schema.sql
-- ============================================================

-- ── 1. Recommendations cache table ──
-- Stores daily personalised content so we don't regenerate every request.
-- The cron job populates this nightly; the client reads from here first.

CREATE TABLE IF NOT EXISTS recommendations (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users NOT NULL,
  date        DATE NOT NULL,
  type        TEXT NOT NULL,    -- 'daily_content' | 'weekly_plan'
  content     JSONB NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date, type)
);

ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own recommendations"
  ON recommendations FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX idx_recommendations_user_date
  ON recommendations(user_id, date DESC);

-- ── 2. Text-based scripture search function ──
-- Used by ai-ask-scripture Edge Function.
-- Searches scripture_chunks by keyword match in translation + tags.
-- This is a fallback while we don't have a live embedding endpoint.
-- Upgrade path: replace with pgvector similarity when Gemini embedding API is wired.

CREATE OR REPLACE FUNCTION match_scriptures_text(
  query_text    TEXT,
  match_count   INT DEFAULT 5,
  match_threshold FLOAT DEFAULT 0.1,
  filter_text_ids TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  id             UUID,
  text_id        TEXT,
  chapter        INT,
  verse          INT,
  sanskrit       TEXT,
  transliteration TEXT,
  translation    TEXT,
  commentary     TEXT,
  tags           TEXT[],
  similarity     FLOAT
)
LANGUAGE plpgsql
AS $$
DECLARE
  search_terms TEXT[];
  term TEXT;
  ts_query TSQUERY;
BEGIN
  -- Tokenise query into terms
  search_terms := string_to_array(lower(trim(query_text)), ' ');

  -- Build a ts_query with OR between terms for broad matching
  ts_query := NULL;
  FOREACH term IN ARRAY search_terms LOOP
    IF length(term) > 2 THEN  -- skip short words
      IF ts_query IS NULL THEN
        ts_query := to_tsquery('english', term || ':*');
      ELSE
        ts_query := ts_query || to_tsquery('english', term || ':*');
      END IF;
    END IF;
  END LOOP;

  IF ts_query IS NULL THEN
    ts_query := to_tsquery('english', search_terms[1] || ':*');
  END IF;

  RETURN QUERY
  SELECT
    sc.id,
    sc.text_id,
    sc.chapter,
    sc.verse,
    sc.sanskrit,
    sc.transliteration,
    sc.translation,
    sc.commentary,
    sc.tags,
    -- Similarity: combination of text rank + tag overlap
    (
      ts_rank(
        to_tsvector('english', COALESCE(sc.translation, '') || ' ' || array_to_string(sc.tags, ' ')),
        ts_query
      ) * 0.8
      +
      -- Boost if any tag matches a search term
      CASE WHEN sc.tags && search_terms THEN 0.2 ELSE 0.0 END
    )::FLOAT AS similarity
  FROM scripture_chunks sc
  WHERE
    (filter_text_ids IS NULL OR sc.text_id = ANY(filter_text_ids))
    AND (
      to_tsvector('english', COALESCE(sc.translation, '') || ' ' || array_to_string(sc.tags, ' '))
      @@ ts_query
      OR sc.tags && search_terms
    )
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

-- ── 3. Full-text search index on scripture_chunks ──
-- Uses a stored generated column so the index expression is IMMUTABLE.

ALTER TABLE scripture_chunks
  ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english', COALESCE(translation, ''))
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_scripture_fulltext
  ON scripture_chunks USING gin(search_vector);

-- ── 4. Nudge outcome tracking view ──
-- Shows which nudge styles work per user — used by ai-nudge Edge Function.

CREATE OR REPLACE VIEW nudge_effectiveness AS
SELECT
  user_id,
  event_data->>'nudge_style' AS style,
  COUNT(*) FILTER (WHERE event_type = 'streak_recovered') AS recoveries,
  COUNT(*) FILTER (WHERE event_type = 'notification_dismissed') AS dismissals,
  ROUND(
    COUNT(*) FILTER (WHERE event_type = 'streak_recovered')::NUMERIC /
    NULLIF(COUNT(*), 0) * 100, 1
  ) AS recovery_rate_pct
FROM sadhana_events
WHERE event_type IN ('streak_recovered', 'notification_dismissed')
  AND event_data->>'nudge_style' IS NOT NULL
GROUP BY user_id, event_data->>'nudge_style';

-- ── 5. Cron job: nightly personalisation at 4 AM ──
-- Calls ai-personalise for all users active in last 30 days.
-- Requires pg_cron extension (enabled in Supabase by default).

SELECT cron.schedule(
  'nightly-personalise',
  '0 4 * * *',  -- 4:00 AM daily (UTC — adjust for your timezone)
  $$
  SELECT
    net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/ai-personalise',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      ),
      body := jsonb_build_object('user_id', user_id)
    )
  FROM (
    SELECT DISTINCT user_id
    FROM sadhana_events
    WHERE created_at > now() - interval '30 days'
  ) active_users;
  $$
);

-- Note: set app.supabase_url and app.service_role_key in Supabase Dashboard
-- → Settings → Database → Configuration → Custom Configuration
