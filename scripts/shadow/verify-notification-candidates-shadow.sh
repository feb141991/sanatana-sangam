#!/usr/bin/env bash
set -euo pipefail

DB_NAME="shoonaya_candidates_shadow_$$"
PSQL="$(command -v psql)"
MIGRATION="supabase/migrations/20260923140000_notification_candidates_and_resolver.sql"
ROLLBACK="supabase/rollbacks/20260923140000_notification_candidates_and_resolver_rollback.sql"

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
SQL

echo "=== Applying Prompt 1 Migration ==="
"${PSQL}" -d "${DB_NAME}" -v ON_ERROR_STOP=1 -f "${MIGRATION}" >/dev/null

echo "=== Verifying Candidate Table & Indexes ==="
"${PSQL}" -d "${DB_NAME}" -v ON_ERROR_STOP=1 -q <<'SQL'
SET ROLE service_role;

-- 1. Insert valid candidate
INSERT INTO public.notification_candidates (
  id,
  user_id,
  event_type,
  event_id,
  event_instance,
  local_date,
  audience_variant,
  scheduled_for,
  expires_at,
  priority,
  title,
  body,
  action_url,
  language,
  timezone,
  status
) VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '11111111-1111-1111-1111-111111111111',
  'observance',
  'diwali-2026',
  'd1',
  '2026-11-07',
  'general',
  '2026-11-07 02:30:00+00',
  '2026-11-07 18:00:00+00',
  10,
  '🪔 Tomorrow is Diwali',
  'Prepare your lamps and home for Diwali.',
  '/festivals/diwali',
  'en',
  'Asia/Kolkata',
  'pending'
);

-- 2. Verify duplicate semantic identity is strictly rejected (23505)
DO $$
BEGIN
  BEGIN
    INSERT INTO public.notification_candidates (
      user_id, event_type, event_id, event_instance, local_date, audience_variant,
      scheduled_for, expires_at, title, body, action_url
    ) VALUES (
      '11111111-1111-1111-1111-111111111111', 'observance', 'diwali-2026', 'd1', '2026-11-07', 'general',
      '2026-11-07 02:30:00+00', '2026-11-07 18:00:00+00', 'Duplicate', 'Body', '/path'
    );
    RAISE EXCEPTION 'Expected unique violation 23505 on duplicate semantic identity, but insert succeeded';
  EXCEPTION WHEN unique_violation THEN
    -- Expected
  END;
END $$;

-- 3. Verify status check constraint (23514)
DO $$
BEGIN
  BEGIN
    INSERT INTO public.notification_candidates (
      user_id, event_type, event_id, event_instance, local_date, audience_variant,
      scheduled_for, expires_at, title, body, action_url, status
    ) VALUES (
      '11111111-1111-1111-1111-111111111111', 'observance', 'diwali-2026', 'd7', '2026-11-01', 'general',
      '2026-11-01 02:30:00+00', '2026-11-01 18:00:00+00', 'Title', 'Body', '/path', 'bogus_status'
    );
    RAISE EXCEPTION 'Expected check violation 23514 on invalid status, but insert succeeded';
  EXCEPTION WHEN check_violation THEN
    -- Expected
  END;
END $$;

-- 4. Verify time window constraint: expires_at must be >= scheduled_for (23514)
DO $$
BEGIN
  BEGIN
    INSERT INTO public.notification_candidates (
      user_id, event_type, event_id, event_instance, local_date, audience_variant,
      scheduled_for, expires_at, title, body, action_url
    ) VALUES (
      '11111111-1111-1111-1111-111111111111', 'observance', 'diwali-2026', 'd7', '2026-11-01', 'general',
      '2026-11-01 10:00:00+00', '2026-11-01 08:00:00+00', 'Title', 'Body', '/path'
    );
    RAISE EXCEPTION 'Expected check violation 23514 on expires_at < scheduled_for, but insert succeeded';
  EXCEPTION WHEN check_violation THEN
    -- Expected
  END;
END $$;

-- 5. Audit Table & Cascade Test
INSERT INTO public.notification_resolver_events (
  candidate_id, user_id, event_type, decision, reason, policy_version
) VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '11111111-1111-1111-1111-111111111111',
  'observance',
  'accepted',
  'priority_explicit_observance',
  'v1'
);

-- Verify decision constraint on audit table
DO $$
BEGIN
  BEGIN
    INSERT INTO public.notification_resolver_events (
      candidate_id, user_id, event_type, decision, reason
    ) VALUES (
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      '11111111-1111-1111-1111-111111111111',
      'observance',
      'invalid_decision',
      'test'
    );
    RAISE EXCEPTION 'Expected check violation on invalid decision, but insert succeeded';
  EXCEPTION WHEN check_violation THEN
    -- Expected
  END;
END $$;

-- Verify cascade on candidate deletion
DELETE FROM public.notification_candidates WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT count(*) INTO v_count FROM public.notification_resolver_events WHERE candidate_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  IF v_count <> 0 THEN
    RAISE EXCEPTION 'Expected 0 audit rows after candidate cascade delete, found %', v_count;
  END IF;
END $$;
SQL

echo "=== Verifying Service-Role-Only Privilege Isolation ==="
"${PSQL}" -d "${DB_NAME}" -v ON_ERROR_STOP=1 -q <<'SQL'
-- Anon cannot select candidates (42501)
DO $$
BEGIN
  SET ROLE anon;
  BEGIN
    PERFORM * FROM public.notification_candidates;
    RAISE EXCEPTION 'Expected permission denied 42501 for anon on notification_candidates';
  EXCEPTION WHEN insufficient_privilege THEN
    -- Expected
  END;
END $$;

-- Authenticated cannot select candidates (42501)
DO $$
BEGIN
  SET ROLE authenticated;
  BEGIN
    PERFORM * FROM public.notification_candidates;
    RAISE EXCEPTION 'Expected permission denied 42501 for authenticated on notification_candidates';
  EXCEPTION WHEN insufficient_privilege THEN
    -- Expected
  END;
END $$;

-- Anon cannot select resolver events (42501)
DO $$
BEGIN
  SET ROLE anon;
  BEGIN
    PERFORM * FROM public.notification_resolver_events;
    RAISE EXCEPTION 'Expected permission denied 42501 for anon on notification_resolver_events';
  EXCEPTION WHEN insufficient_privilege THEN
    -- Expected
  END;
END $$;

-- Authenticated cannot select resolver events (42501)
DO $$
BEGIN
  SET ROLE authenticated;
  BEGIN
    PERFORM * FROM public.notification_resolver_events;
    RAISE EXCEPTION 'Expected permission denied 42501 for authenticated on notification_resolver_events';
  EXCEPTION WHEN insufficient_privilege THEN
    -- Expected
  END;
END $$;
SQL

echo "=== Testing Clean Rollback ==="
"${PSQL}" -d "${DB_NAME}" -v ON_ERROR_STOP=1 -f "${ROLLBACK}" >/dev/null

"${PSQL}" -d "${DB_NAME}" -v ON_ERROR_STOP=1 -q <<'SQL'
DO $$
BEGIN
  IF to_regclass('public.notification_candidates') IS NOT NULL THEN
    RAISE EXCEPTION 'notification_candidates table still exists after rollback';
  END IF;
  IF to_regclass('public.notification_resolver_events') IS NOT NULL THEN
    RAISE EXCEPTION 'notification_resolver_events table still exists after rollback';
  END IF;
END $$;
SQL

echo "=== ALL SHADOW TESTS PASSED SUCCESSFULLY ==="
