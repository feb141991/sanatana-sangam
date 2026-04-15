-- ============================================================
-- SADHANA ENGINE — PRE-FLIGHT COLLISION CHECK
-- Run this in Supabase SQL Editor BEFORE running any migration.
-- It shows you exactly what already exists in the live DB so you
-- can spot any conflicts with the existing Sangam app schema.
-- This script is 100% READ-ONLY — no changes are made.
-- ============================================================

-- ── 1. Which of our tables already exist? ──
-- If a table shows up here that we didn't create, it belongs to the
-- existing Sangam app. If it shows up with the wrong columns, we have
-- a schema conflict and must rename our table.

SELECT
  table_name,
  CASE
    WHEN table_name IN (
      'sadhana_events','daily_sadhana','user_practice','scripture_chunks',
      'reading_progress','sankalpa','recommendations','mantras','device_tokens'
    ) THEN '⚠️  SADHANA ENGINE TABLE'
    ELSE '✅  EXISTING APP TABLE'
  END AS ownership
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- ── 2. Column snapshot for our tables (spot schema mismatches) ──
SELECT
  table_name,
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    'sadhana_events','daily_sadhana','user_practice','scripture_chunks',
    'reading_progress','sankalpa','recommendations','mantras','device_tokens'
  )
ORDER BY table_name, ordinal_position;

-- ── 3. Which indexes from our migrations already exist? ──
-- Any row marked 'missing' means the migration didn't run yet.
-- Any row with a different definition is a collision with the existing app.

SELECT
  i.indexname,
  i.tablename,
  i.indexdef,
  CASE
    WHEN i.indexname IN (
      'idx_sadhana_events_user','idx_sadhana_events_type',
      'idx_daily_sadhana_user','idx_reading_user',
      'idx_scripture_text','idx_scripture_embedding','idx_scripture_fulltext',
      'idx_recommendations_user_date',
      'idx_mantras_tradition','idx_mantras_deity','idx_mantras_level','idx_mantras_tags',
      'idx_device_tokens_player','idx_device_tokens_user'
    ) THEN '⚠️  SADHANA ENGINE INDEX'
    ELSE '✅  EXISTING INDEX'
  END AS ownership
FROM pg_indexes i
WHERE i.schemaname = 'public'
ORDER BY i.tablename, i.indexname;

-- ── 4. Which RLS policies from our migrations already exist? ──

SELECT
  tablename,
  policyname,
  cmd,
  CASE
    WHEN policyname IN (
      'Users can insert own events','Users can read own events',
      'Users can manage own daily sadhana',
      'Users can read own profile','Service can manage profiles',
      'Scripture is publicly readable',
      'Users can manage own reading progress',
      'Users can manage own sankalpa',
      'Users can read own recommendations',
      'Users manage own device tokens'
    ) THEN '⚠️  SADHANA ENGINE POLICY'
    ELSE '✅  EXISTING POLICY'
  END AS ownership
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ── 5. Which of our Edge Functions/SQL functions exist? ──

SELECT
  routine_name,
  routine_type,
  CASE
    WHEN routine_name IN (
      'match_scriptures','match_scriptures_text',
      'update_device_token_timestamp','upsert_device_token'
    ) THEN '⚠️  SADHANA ENGINE FUNCTION'
    ELSE '✅  EXISTING FUNCTION'
  END AS ownership
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- ── 6. Check cron jobs — will the nightly-personalise job conflict? ──

SELECT
  jobid,
  jobname,
  schedule,
  command,
  active
FROM cron.job
ORDER BY jobname;

-- ── 7. Check extensions ──

SELECT
  extname,
  extversion,
  CASE extname
    WHEN 'vector'   THEN '✅ pgvector — needed for embeddings'
    WHEN 'pg_cron'  THEN '✅ pg_cron — needed for nightly jobs'
    WHEN 'pg_net'   THEN '✅ pg_net — needed for HTTP calls from cron'
    ELSE '— other'
  END AS note
FROM pg_extension
ORDER BY extname;

-- ── 8. Summary: tables in public schema that DON'T belong to us ──
-- These are your existing Sangam app tables. Review for name overlaps.

SELECT table_name AS existing_sangam_tables
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
  AND table_name NOT IN (
    'sadhana_events','daily_sadhana','user_practice','scripture_chunks',
    'reading_progress','sankalpa','recommendations','mantras','device_tokens'
  )
ORDER BY table_name;
