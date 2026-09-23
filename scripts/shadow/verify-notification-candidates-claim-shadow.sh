#!/usr/bin/env bash
set -euo pipefail

DB_NAME="shoonaya_claim_shadow_$$"
PSQL="$(command -v psql)"
MIGRATION_1="supabase/migrations/20260923140000_notification_candidates_and_resolver.sql"
MIGRATION_3="supabase/migrations/20260923150000_notification_candidates_claim_and_persistence.sql"
MIGRATION_ATOMIC="supabase/migrations/20260923170000_atomic_notification_candidate_resolution.sql"
ROLLBACK_3="supabase/rollbacks/20260923150000_notification_candidates_claim_and_persistence_rollback.sql"
ROLLBACK_ATOMIC="supabase/rollbacks/20260923170000_atomic_notification_candidate_resolution_rollback.sql"

cleanup() {
  "${PSQL}" -d postgres -c "DROP DATABASE IF EXISTS ${DB_NAME};" >/dev/null 2>&1 || true
}
trap cleanup EXIT

echo "=== Creating shadow database ${DB_NAME} ==="
"${PSQL}" -d postgres -c "CREATE DATABASE ${DB_NAME};" >/dev/null

"${PSQL}" -d "${DB_NAME}" -v ON_ERROR_STOP=1 -q <<'SQL'
CREATE SCHEMA auth;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN CREATE ROLE service_role NOLOGIN; END IF;
END
$$;
ALTER ROLE service_role BYPASSRLS;

CREATE TABLE auth.users (
  id UUID PRIMARY KEY,
  email TEXT
);

INSERT INTO auth.users (id, email) VALUES
  ('11111111-1111-1111-1111-111111111111', 'devotee1@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'devotee2@example.com');

-- Existing notification_schedule table
CREATE TABLE public.notification_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  send_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  notification_key TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  retry_count INTEGER DEFAULT 0,
  claimed_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_notification_schedule_user_notification_key
  ON public.notification_schedule (user_id, notification_key);

GRANT ALL ON TABLE public.notification_schedule TO service_role;
SQL

echo "=== Applying Prompt 1 Base Migration ==="
"${PSQL}" -d "${DB_NAME}" -v ON_ERROR_STOP=1 -f "${MIGRATION_1}" >/dev/null

echo "=== Applying Prompt 3 Claim RPC Migration ==="
"${PSQL}" -d "${DB_NAME}" -v ON_ERROR_STOP=1 -f "${MIGRATION_3}" >/dev/null

echo "=== Applying Atomic Resolver Persistence Migration ==="
"${PSQL}" -d "${DB_NAME}" -v ON_ERROR_STOP=1 -f "${MIGRATION_ATOMIC}" >/dev/null

echo "=== Verifying Candidate Claim Logic & Status Check ==="
"${PSQL}" -d "${DB_NAME}" -v ON_ERROR_STOP=1 -q <<'SQL'
SET ROLE service_role;

-- 1. Insert test candidates:
-- cand1: Due now, pending
INSERT INTO public.notification_candidates (
  id, user_id, event_type, event_id, event_instance, local_date, audience_variant,
  scheduled_for, expires_at, priority, title, body, action_url, status
) VALUES (
  '11111111-0000-0000-0000-000000000001',
  '11111111-1111-1111-1111-111111111111',
  'devotional_engagement', 'prompt-1', '', '2026-11-08', 'general',
  NOW() - INTERVAL '5 minutes', NOW() + INTERVAL '1 hour', 50,
  'Due Prompt', 'Body', '/path', 'pending'
);

-- cand2: Overdue expired window
INSERT INTO public.notification_candidates (
  id, user_id, event_type, event_id, event_instance, local_date, audience_variant,
  scheduled_for, expires_at, priority, title, body, action_url, status
) VALUES (
  '11111111-0000-0000-0000-000000000002',
  '11111111-1111-1111-1111-111111111111',
  'devotional_engagement', 'prompt-2', '', '2026-11-08', 'general',
  NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '5 minutes', 50,
  'Expired Prompt', 'Body', '/path', 'pending'
);

-- cand3: Future candidate (scheduled in 2 hours)
INSERT INTO public.notification_candidates (
  id, user_id, event_type, event_id, event_instance, local_date, audience_variant,
  scheduled_for, expires_at, priority, title, body, action_url, status
) VALUES (
  '11111111-0000-0000-0000-000000000003',
  '11111111-1111-1111-1111-111111111111',
  'devotional_engagement', 'prompt-3', '', '2026-11-08', 'general',
  NOW() + INTERVAL '2 hours', NOW() + INTERVAL '3 hours', 50,
  'Future Prompt', 'Body', '/path', 'pending'
);

-- 2. Execute claim RPC function
DO $$
DECLARE
  v_claimed_count INT;
  v_cand1_status TEXT;
  v_cand2_status TEXT;
  v_cand3_status TEXT;
BEGIN
  SELECT count(*) INTO v_claimed_count FROM public.claim_pending_notification_candidates(10, 10, NULL);
  IF v_claimed_count <> 1 THEN
    RAISE EXCEPTION 'Expected 1 candidate claimed, got %', v_claimed_count;
  END IF;

  SELECT status INTO v_cand1_status FROM public.notification_candidates WHERE id = '11111111-0000-0000-0000-000000000001';
  IF v_cand1_status <> 'resolving' THEN
    RAISE EXCEPTION 'Expected cand1 status to be resolving, got %', v_cand1_status;
  END IF;

  SELECT status INTO v_cand2_status FROM public.notification_candidates WHERE id = '11111111-0000-0000-0000-000000000002';
  IF v_cand2_status <> 'expired' THEN
    RAISE EXCEPTION 'Expected cand2 status to be expired, got %', v_cand2_status;
  END IF;

  SELECT status INTO v_cand3_status FROM public.notification_candidates WHERE id = '11111111-0000-0000-0000-000000000003';
  IF v_cand3_status <> 'pending' THEN
    RAISE EXCEPTION 'Expected cand3 status to be pending, got %', v_cand3_status;
  END IF;
END $$;
SQL

echo "=== Verifying Lease Recovery for Stuck Resolving Worker ==="
"${PSQL}" -d "${DB_NAME}" -v ON_ERROR_STOP=1 -q <<'SQL'
SET ROLE service_role;

-- Set cand1 claimed_at to 15 minutes ago (lease is 10 minutes)
UPDATE public.notification_candidates
SET claimed_at = NOW() - INTERVAL '15 minutes'
WHERE id = '11111111-0000-0000-0000-000000000001';

DO $$
DECLARE
  v_claimed_count INT;
BEGIN
  SELECT count(*) INTO v_claimed_count FROM public.claim_pending_notification_candidates(10, 10, NULL);
  IF v_claimed_count <> 1 THEN
    RAISE EXCEPTION 'Expected stuck candidate to be reclaimed by lease recovery, got %', v_claimed_count;
  END IF;
END $$;
SQL

echo "=== Verifying Atomic Persistence, Conflict Safety, and Rollback ==="
"${PSQL}" -d "${DB_NAME}" -v ON_ERROR_STOP=1 -q <<'SQL'
SET ROLE service_role;

-- A matching already-sent row must remain sent after resolver retry.
INSERT INTO public.notification_schedule (
  user_id, notification_type, title, body, send_at, status, notification_key
) VALUES (
  '11111111-1111-1111-1111-111111111111', 'devotional_engagement',
  'Old title', 'Old body', NOW(), 'pending',
  'devotional_engagement:prompt-1:2026-11-08:general'
);
UPDATE public.notification_schedule SET status = 'sent'
WHERE notification_key = 'devotional_engagement:prompt-1:2026-11-08:general';

DO $$
DECLARE
  v_result record;
  v_status text;
BEGIN
  SELECT * INTO v_result FROM public.persist_notification_candidate_resolution(
    '[{"user_id":"11111111-1111-1111-1111-111111111111","notification_type":"devotional_engagement","title":"New title","body":"New body","send_at":"2026-11-08T02:30:00Z","notification_key":"devotional_engagement:prompt-1:2026-11-08:general","metadata":{}}]'::jsonb,
    '[{"candidate_id":"11111111-0000-0000-0000-000000000001","status":"accepted","reason":"accepted","resolved_at":"2026-11-08T02:00:00Z"}]'::jsonb,
    '[{"candidate_id":"11111111-0000-0000-0000-000000000001","user_id":"11111111-1111-1111-1111-111111111111","event_type":"devotional_engagement","decision":"accepted","reason":"accepted","policy_version":"v1","metadata":{},"resolved_at":"2026-11-08T02:00:00Z"}]'::jsonb
  );

  SELECT status INTO v_status FROM public.notification_schedule
  WHERE notification_key = 'devotional_engagement:prompt-1:2026-11-08:general';
  IF v_status <> 'sent' THEN
    RAISE EXCEPTION 'Conflict rewrote schedule status; expected sent, got %', v_status;
  END IF;
  IF v_result.promoted_count <> 0 OR v_result.candidate_count <> 1 OR v_result.audit_count <> 1 THEN
    RAISE EXCEPTION 'Unexpected atomic persistence counts: %', v_result;
  END IF;
END $$;

-- If candidate state cannot be updated, schedule insertion must roll back too.
INSERT INTO public.notification_candidates (
  id, user_id, event_type, event_id, local_date, scheduled_for, expires_at,
  title, body, action_url, status
) VALUES (
  '11111111-0000-0000-0000-000000000004',
  '11111111-1111-1111-1111-111111111111', 'devotional_engagement', 'rollback-case',
  '2026-11-08', NOW(), NOW() + INTERVAL '1 hour', 'Rollback', 'Body', '/path', 'resolving'
);

DO $$
DECLARE
  v_inserted integer;
  v_status text;
BEGIN
  BEGIN
    PERFORM * FROM public.persist_notification_candidate_resolution(
      '[{"user_id":"11111111-1111-1111-1111-111111111111","notification_type":"devotional_engagement","title":"Must rollback","body":"Body","send_at":"2026-11-08T02:30:00Z","notification_key":"rollback-case","metadata":{}}]'::jsonb,
      '[{"candidate_id":"11111111-0000-0000-0000-000000000099","status":"accepted","reason":"accepted","resolved_at":"2026-11-08T02:00:00Z"}]'::jsonb,
      '[]'::jsonb
    );
    RAISE EXCEPTION 'Expected failed candidate update to abort transaction';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM = 'Expected failed candidate update to abort transaction' THEN RAISE; END IF;
  END;

  SELECT count(*) INTO v_inserted FROM public.notification_schedule WHERE notification_key = 'rollback-case';
  SELECT status INTO v_status FROM public.notification_candidates WHERE id = '11111111-0000-0000-0000-000000000004';
  IF v_inserted <> 0 OR v_status <> 'resolving' THEN
    RAISE EXCEPTION 'Persistence failure was not rolled back atomically';
  END IF;
END $$;
SQL

echo "=== Verifying Schedule Promotion Idempotency ==="
"${PSQL}" -d "${DB_NAME}" -v ON_ERROR_STOP=1 -q <<'SQL'
SET ROLE service_role;

-- Insert accepted candidate into notification_schedule
INSERT INTO public.notification_schedule (
  user_id, notification_type, title, body, send_at, notification_key
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'devotional_engagement',
  'Due Prompt',
  'Body',
  NOW(),
  'devotional_engagement:prompt-1:2026-11-08:general'
)
ON CONFLICT (user_id, notification_key) DO NOTHING;

-- Second identical insert must succeed idempotently without error
INSERT INTO public.notification_schedule (
  user_id, notification_type, title, body, send_at, notification_key
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'devotional_engagement',
  'Due Prompt',
  'Body',
  NOW(),
  'devotional_engagement:prompt-1:2026-11-08:general'
)
ON CONFLICT (user_id, notification_key) DO NOTHING;

DO $$
DECLARE
  v_sched_count INT;
BEGIN
  SELECT count(*) INTO v_sched_count FROM public.notification_schedule
  WHERE user_id = '11111111-1111-1111-1111-111111111111'
    AND notification_key = 'devotional_engagement:prompt-1:2026-11-08:general';

  IF v_sched_count <> 1 THEN
    RAISE EXCEPTION 'Expected exactly 1 schedule row after idempotent rerun, got %', v_sched_count;
  END IF;
END $$;
SQL

echo "=== Verifying Service-Role Execution Privilege ==="
"${PSQL}" -d "${DB_NAME}" -v ON_ERROR_STOP=1 -q <<'SQL'
-- Anon cannot execute claim function (42501)
DO $$
BEGIN
  SET ROLE anon;
  BEGIN
    PERFORM * FROM public.claim_pending_notification_candidates(10, 10, NULL);
    RAISE EXCEPTION 'Expected permission denied 42501 for anon on claim function';
  EXCEPTION WHEN insufficient_privilege THEN
    -- Expected
  END;
END $$;

-- Authenticated cannot execute claim function (42501)
DO $$
BEGIN
  SET ROLE authenticated;
  BEGIN
    PERFORM * FROM public.claim_pending_notification_candidates(10, 10, NULL);
    RAISE EXCEPTION 'Expected permission denied 42501 for authenticated on claim function';
  EXCEPTION WHEN insufficient_privilege THEN
    -- Expected
  END;
END $$;
SQL

echo "=== Testing Clean Rollback ==="
"${PSQL}" -d "${DB_NAME}" -v ON_ERROR_STOP=1 -f "${ROLLBACK_ATOMIC}" >/dev/null
"${PSQL}" -d "${DB_NAME}" -v ON_ERROR_STOP=1 -f "${ROLLBACK_3}" >/dev/null

"${PSQL}" -d "${DB_NAME}" -v ON_ERROR_STOP=1 -q <<'SQL'
DO $$
BEGIN
  -- Verify function dropped
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'claim_pending_notification_candidates'
  ) THEN
    RAISE EXCEPTION 'claim_pending_notification_candidates function still exists after rollback';
  END IF;

  -- Verify claimed_at column dropped
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notification_candidates' AND column_name = 'claimed_at'
  ) THEN
    RAISE EXCEPTION 'claimed_at column still exists after rollback';
  END IF;
END $$;
SQL

echo "=== ALL PROMPT 3 SHADOW TESTS PASSED SUCCESSFULLY ==="
