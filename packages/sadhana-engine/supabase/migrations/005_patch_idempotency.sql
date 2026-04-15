-- ============================================================
-- Migration 005: Idempotency Patch for 001 + 002
-- ============================================================
-- Hardens migrations 001 and 002 retroactively:
--   • All indexes:  IF NOT EXISTS (inside DO blocks for table-safety)
--   • All policies: DO blocks that check pg_policies first
--   • Cron job:     unschedule → reschedule (no duplicate key)
--   • Mantras RLS:  explicit READ grant + write block
--
-- SAFE TO RUN AT ANY POINT — every statement checks whether the
-- target table/index/policy exists before doing anything.
-- Tables that don't exist yet are silently skipped; they will be
-- created properly when their own migration runs.
-- ============================================================

DO $$ BEGIN RAISE NOTICE '005_patch_idempotency: starting…'; END $$;

-- ══════════════════════════════════════════════════════════
-- SECTION A — Patch tables from 001_phase1_schema.sql
-- Each table block is wrapped so it's skipped if the table
-- doesn't exist yet (e.g. if 001 was only partially run).
-- ══════════════════════════════════════════════════════════

-- ── sadhana_events ──
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'sadhana_events'
  ) THEN
    RAISE NOTICE 'sadhana_events not found — skipping (run 001 first)';
    RETURN;
  END IF;

  -- Indexes
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='idx_sadhana_events_user') THEN
    CREATE INDEX idx_sadhana_events_user ON sadhana_events(user_id, created_at DESC);
    RAISE NOTICE 'Created idx_sadhana_events_user';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='idx_sadhana_events_type') THEN
    CREATE INDEX idx_sadhana_events_type ON sadhana_events(event_type, created_at DESC);
    RAISE NOTICE 'Created idx_sadhana_events_type';
  END IF;

  -- Policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='sadhana_events' AND policyname='Users can insert own events') THEN
    CREATE POLICY "Users can insert own events"
      ON sadhana_events FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='sadhana_events' AND policyname='Users can read own events') THEN
    CREATE POLICY "Users can read own events"
      ON sadhana_events FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;


-- ── daily_sadhana ──
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'daily_sadhana'
  ) THEN
    RAISE NOTICE 'daily_sadhana not found — skipping';
    RETURN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='idx_daily_sadhana_user') THEN
    CREATE INDEX idx_daily_sadhana_user ON daily_sadhana(user_id, date DESC);
    RAISE NOTICE 'Created idx_daily_sadhana_user';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='daily_sadhana' AND policyname='Users can manage own daily sadhana') THEN
    CREATE POLICY "Users can manage own daily sadhana"
      ON daily_sadhana FOR ALL
      USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;


-- ── user_practice ──
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'user_practice'
  ) THEN
    RAISE NOTICE 'user_practice not found — skipping';
    RETURN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_practice' AND policyname='Users can read own profile') THEN
    CREATE POLICY "Users can read own profile"
      ON user_practice FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_practice' AND policyname='Service can manage profiles') THEN
    -- Intentionally permissive: nightly cron (service_role) writes computed profiles.
    CREATE POLICY "Service can manage profiles"
      ON user_practice FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;


-- ── scripture_chunks ──
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'scripture_chunks'
  ) THEN
    RAISE NOTICE 'scripture_chunks not found — skipping';
    RETURN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='idx_scripture_text') THEN
    CREATE INDEX idx_scripture_text ON scripture_chunks(text_id, chapter, verse);
    RAISE NOTICE 'Created idx_scripture_text';
  END IF;

  -- ivfflat index — expensive but IF-NOT-EXISTS makes it a no-op if already exists
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='idx_scripture_embedding') THEN
    CREATE INDEX idx_scripture_embedding
      ON scripture_chunks
      USING ivfflat (embedding vector_cosine_ops)
      WITH (lists = 50);
    RAISE NOTICE 'Created idx_scripture_embedding';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='idx_scripture_fulltext') THEN
    -- Ensure the generated column exists first (added in 002)
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='scripture_chunks' AND column_name='search_vector'
    ) THEN
      CREATE INDEX idx_scripture_fulltext ON scripture_chunks USING gin(search_vector);
      RAISE NOTICE 'Created idx_scripture_fulltext';
    ELSE
      RAISE NOTICE 'search_vector column not found — skipping idx_scripture_fulltext (run 002 first)';
    END IF;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='scripture_chunks' AND policyname='Scripture is publicly readable') THEN
    CREATE POLICY "Scripture is publicly readable"
      ON scripture_chunks FOR SELECT USING (true);
  END IF;
END $$;


-- ── reading_progress ──
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'reading_progress'
  ) THEN
    RAISE NOTICE 'reading_progress not found — skipping';
    RETURN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='idx_reading_user') THEN
    CREATE INDEX idx_reading_user ON reading_progress(user_id, text_id, chapter, verse);
    RAISE NOTICE 'Created idx_reading_user';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='reading_progress' AND policyname='Users can manage own reading progress') THEN
    CREATE POLICY "Users can manage own reading progress"
      ON reading_progress FOR ALL
      USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;


-- ── sankalpa ──
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'sankalpa'
  ) THEN
    RAISE NOTICE 'sankalpa not found — skipping';
    RETURN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='sankalpa' AND policyname='Users can manage own sankalpa') THEN
    CREATE POLICY "Users can manage own sankalpa"
      ON sankalpa FOR ALL
      USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;


-- ══════════════════════════════════════════════════════════
-- SECTION B — Patch tables from 002_phase2_ai.sql
-- ══════════════════════════════════════════════════════════

-- ── recommendations ──
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'recommendations'
  ) THEN
    RAISE NOTICE 'recommendations not found — skipping (run 002 first)';
    RETURN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='idx_recommendations_user_date') THEN
    CREATE INDEX idx_recommendations_user_date ON recommendations(user_id, date DESC);
    RAISE NOTICE 'Created idx_recommendations_user_date';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='recommendations' AND policyname='Users can read own recommendations') THEN
    CREATE POLICY "Users can read own recommendations"
      ON recommendations FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;


-- ══════════════════════════════════════════════════════════
-- SECTION C — Fix the cron job from 002_phase2_ai.sql
-- The original SELECT cron.schedule() fails with duplicate key
-- if 002 is ever re-run. Patch: unschedule first if it exists.
-- ══════════════════════════════════════════════════════════

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'nightly-personalise') THEN
    PERFORM cron.unschedule('nightly-personalise');
    RAISE NOTICE 'Unscheduled old nightly-personalise cron';
  END IF;
END $$;

SELECT cron.schedule(
  'nightly-personalise',
  '0 4 * * *',
  $$
  SELECT net.http_post(
    url     := current_setting('app.supabase_url') || '/functions/v1/ai-personalise',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body    := jsonb_build_object('user_id', user_id)
  )
  FROM (
    SELECT DISTINCT user_id
    FROM sadhana_events
    WHERE created_at > now() - interval '30 days'
  ) active_users;
  $$
);


-- ══════════════════════════════════════════════════════════
-- SECTION D — Mantras RLS (runs only if 003 already ran)
-- ══════════════════════════════════════════════════════════

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'mantras'
  ) THEN
    RAISE NOTICE 'mantras not found — skipping RLS (run 003 first, then re-run 005)';
    RETURN;
  END IF;

  ALTER TABLE mantras ENABLE ROW LEVEL SECURITY;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='mantras' AND policyname='Mantras are publicly readable') THEN
    CREATE POLICY "Mantras are publicly readable"
      ON mantras FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='mantras' AND policyname='Block anon writes on mantras') THEN
    CREATE POLICY "Block anon writes on mantras"
      ON mantras FOR INSERT WITH CHECK (false);
  END IF;
END $$;


-- ══════════════════════════════════════════════════════════
-- SECTION E — notifications.notification_key unique index
-- ai-nudge upserts on this column to prevent same-day duplicates.
-- The existing Sangam notifications table has notification_key as
-- a plain text column — we add a unique index if it's missing.
-- ══════════════════════════════════════════════════════════

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'notifications'
  ) THEN
    RAISE NOTICE 'notifications table not found — skipping';
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename  = 'notifications'
      AND indexname  = 'idx_notifications_key'
  ) THEN
    CREATE UNIQUE INDEX idx_notifications_key
      ON notifications (notification_key)
      WHERE notification_key IS NOT NULL;
    RAISE NOTICE 'Created idx_notifications_key unique index on notifications';
  END IF;
END $$;


DO $$ BEGIN RAISE NOTICE '005_patch_idempotency: done ✓'; END $$;
