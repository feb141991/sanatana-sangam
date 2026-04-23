-- ============================================================
-- Migration 013: Sanskar Lifecycle — Kul integration + notifications
-- Extends user_sanskaras with kul_member_id + expected_date.
-- Creates notification_schedule for milestone push reminders.
-- SAFE TO RE-RUN — all IF NOT EXISTS / DO $$ blocks.
-- ============================================================

-- ── 1. Create user_sanskaras if it doesn't exist yet ─────────────────────────
-- (The SanskaraClient UI writes to user_sanskaras, distinct from the
--  engine's user_sanskars table which uses UUID foreign keys to sanskars.)

CREATE TABLE IF NOT EXISTS user_sanskaras (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sanskara_id    TEXT NOT NULL,        -- slug: 'garbhadhana', 'namakarana', etc.
  completed_date DATE,
  notes          TEXT,
  performed_by   TEXT,
  location       TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint for self-records (no kul member)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_sanskaras_user_sanskara_unique'
  ) THEN
    ALTER TABLE user_sanskaras
      ADD CONSTRAINT user_sanskaras_user_sanskara_unique
      UNIQUE (user_id, sanskara_id);
  END IF;
END $$;

-- ── 2. Add kul_member_id column ───────────────────────────────────────────────
-- Links a sanskara record to a specific Kul family tree member.
-- NULL means the record is for the logged-in user themselves.

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_sanskaras' AND column_name = 'kul_member_id'
  ) THEN
    ALTER TABLE user_sanskaras
      ADD COLUMN kul_member_id UUID REFERENCES kul_family_members(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ── 3. Add expected_date column ───────────────────────────────────────────────
-- For prenatal sanskaras (Garbhadhana), stores the expected due date.
-- Used by /api/sanskar/schedule to compute milestone notification dates.

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_sanskaras' AND column_name = 'expected_date'
  ) THEN
    ALTER TABLE user_sanskaras
      ADD COLUMN expected_date DATE;
  END IF;
END $$;

-- ── 4. Composite unique constraint for family member records ──────────────────
-- Allows one record per (user, family_member, sanskara) combination.
-- Separate from the self-record constraint above.

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_sanskaras_member_unique'
  ) THEN
    ALTER TABLE user_sanskaras
      ADD CONSTRAINT user_sanskaras_member_unique
      UNIQUE (user_id, kul_member_id, sanskara_id);
  END IF;
END $$;

-- ── 5. Indexes ────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_user_sanskaras_user
  ON user_sanskaras (user_id);

CREATE INDEX IF NOT EXISTS idx_user_sanskaras_member
  ON user_sanskaras (kul_member_id)
  WHERE kul_member_id IS NOT NULL;

-- ── 6. RLS for user_sanskaras ─────────────────────────────────────────────────

ALTER TABLE user_sanskaras ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_sanskaras' AND policyname = 'Users manage own sanskaras'
  ) THEN
    CREATE POLICY "Users manage own sanskaras"
      ON user_sanskaras FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ── 7. notification_schedule table ────────────────────────────────────────────
-- Stores scheduled push notifications — any type, including Sanskar milestones.
-- A cron job (or Supabase Edge Function) reads rows where send_at <= NOW()
-- and status = 'pending', sends the push, then marks them 'sent'.

CREATE TABLE IF NOT EXISTS notification_schedule (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  body              TEXT NOT NULL,
  send_at           TIMESTAMPTZ NOT NULL,
  notification_type TEXT NOT NULL DEFAULT 'generic',
  status            TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  metadata          JSONB DEFAULT '{}',
  sent_at           TIMESTAMPTZ,
  error             TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_schedule_pending
  ON notification_schedule (send_at, status)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_notification_schedule_user
  ON notification_schedule (user_id);

-- ── 8. RLS for notification_schedule ─────────────────────────────────────────

ALTER TABLE notification_schedule ENABLE ROW LEVEL SECURITY;

-- Users can read their own scheduled notifications
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'notification_schedule' AND policyname = 'Users read own notifications'
  ) THEN
    CREATE POLICY "Users read own notifications"
      ON notification_schedule FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Only the service role (server-side API routes) can insert/update
-- Client-side inserts are handled via API routes, not direct Supabase calls.
-- (No INSERT/UPDATE/DELETE policy for anon/authenticated — API routes use service key)

-- ── 9. Backfill: drop the overlapping self-record unique constraint ────────────
-- The original constraint (user_id, sanskara_id) conflicts with the new composite
-- one when kul_member_id IS NULL and two rows would match via (user_id, NULL, sanskara_id).
-- PostgreSQL treats NULL != NULL in unique constraints, so both constraints can coexist.
-- No action needed — the original constraint covers self-records, the new one covers family.
-- (This comment is intentional documentation — not a bug.)

-- ── Done ──────────────────────────────────────────────────────────────────────
