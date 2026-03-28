-- ══════════════════════════════════════════════════
--  SANATANA SANGAM — DB Verification Queries
--  Run in: Supabase Dashboard → SQL Editor
-- ══════════════════════════════════════════════════

-- 1. List all tables and row counts
SELECT
  relname        AS table_name,
  n_live_tup     AS row_count
FROM pg_stat_user_tables
ORDER BY relname;

-- 2. Check all columns on each table
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- 3. Verify Row Level Security is enabled
SELECT
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 4. Verify all RLS policies exist
SELECT
  tablename,
  policyname,
  cmd AS operation
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 5. Verify triggers exist
SELECT
  trigger_name,
  event_object_table AS table_name,
  event_manipulation AS event
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table;

-- 6. Verify seed Mandalis were inserted
SELECT id, name, city, country, member_count
FROM public.mandalis
ORDER BY name;

-- 7. Quick health check — all expected tables present
SELECT
  CASE
    WHEN COUNT(*) = 7 THEN '✅ All 7 tables created successfully'
    ELSE '❌ Missing tables — expected 7, found ' || COUNT(*)::text
  END AS status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'profiles', 'mandalis', 'posts',
    'forum_threads', 'forum_replies',
    'post_upvotes', 'thread_upvotes'
  );
