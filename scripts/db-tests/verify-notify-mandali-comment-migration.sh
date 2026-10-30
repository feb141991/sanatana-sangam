#!/usr/bin/env bash
# Verification test for 20261030130000_capture_notify_mandali_comment.sql
# Tests on scratch PostgreSQL: apply -> test -> rollback -> check for leftovers -> re-apply
set -euo pipefail

export PGHOST="${PGHOST:-/tmp}"
export PGPORT="${PGPORT:-5432}"
unset PGDATABASE PGSERVICE PGSERVICEFILE

TEST_DB="scratch_mandali_comment_test_$$"
echo "Creating isolated test database: $TEST_DB"
createdb "$TEST_DB"
trap 'dropdb --if-exists "$TEST_DB"' EXIT

echo "Setting up mock schema prerequisites..."
psql -X -v ON_ERROR_STOP=1 -d "$TEST_DB" <<'SQL'
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text,
  username text,
  wants_community_notifications boolean DEFAULT true
);

CREATE TABLE public.user_blocked_profiles (
  blocker_id uuid NOT NULL,
  blocked_user_id uuid NOT NULL,
  PRIMARY KEY (blocker_id, blocked_user_id)
);

CREATE TABLE public.user_muted_profiles (
  muter_id uuid NOT NULL,
  muted_user_id uuid NOT NULL,
  PRIMARY KEY (muter_id, muted_user_id)
);

CREATE TABLE public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES public.profiles(id)
);

CREATE TABLE public.post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id),
  author_id uuid NOT NULL REFERENCES public.profiles(id),
  body text
);

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  title text NOT NULL,
  body text NOT NULL,
  emoji text,
  type text,
  action_url text,
  notification_key text,
  CONSTRAINT notifications_user_key_uniq UNIQUE (user_id, notification_key)
);
SQL

echo "===> Phase 1: APPLY migration"
psql -X -v ON_ERROR_STOP=1 -d "$TEST_DB" -f supabase/migrations/20261030130000_capture_notify_mandali_comment.sql

echo "Testing trigger functionality..."
psql -X -v ON_ERROR_STOP=1 -d "$TEST_DB" <<'SQL'
DO $$
DECLARE
  v_author uuid := gen_random_uuid();
  v_commenter uuid := gen_random_uuid();
  v_muted_commenter uuid := gen_random_uuid();
  v_post uuid := gen_random_uuid();
  v_comment_1 uuid := gen_random_uuid();
  v_comment_self uuid := gen_random_uuid();
  v_comment_muted uuid := gen_random_uuid();
  v_notif_count integer;
  v_notif record;
BEGIN
  -- Seed profiles
  INSERT INTO public.profiles (id, full_name, username) VALUES
    (v_author, 'Post Author', 'author'),
    (v_commenter, 'Commenter User', 'commenter'),
    (v_muted_commenter, 'Muted User', 'muted');

  -- Author mutes muted_commenter
  INSERT INTO public.user_muted_profiles (muter_id, muted_user_id) VALUES (v_author, v_muted_commenter);

  -- Author creates post
  INSERT INTO public.posts (id, author_id) VALUES (v_post, v_author);

  -- Case 1: Standard comment from another user -> SHOULD NOTIFY
  INSERT INTO public.post_comments (id, post_id, author_id, body)
  VALUES (v_comment_1, v_post, v_commenter, 'Great post!');

  SELECT count(*) INTO v_notif_count FROM public.notifications WHERE user_id = v_author;
  IF v_notif_count <> 1 THEN
    RAISE EXCEPTION 'Expected 1 notification for normal comment, got %', v_notif_count;
  END IF;

  SELECT * INTO v_notif FROM public.notifications WHERE user_id = v_author;
  IF v_notif.type <> 'mandali_comment' THEN
    RAISE EXCEPTION 'Expected type mandali_comment, got %', v_notif.type;
  END IF;
  IF v_notif.notification_key <> 'mandali_comment:' || v_comment_1::text THEN
    RAISE EXCEPTION 'Expected notification_key mandali_comment:%, got %', v_comment_1, v_notif.notification_key;
  END IF;

  -- Case 2: Author comments on their own post -> SHOULD NOT NOTIFY
  INSERT INTO public.post_comments (id, post_id, author_id, body)
  VALUES (v_comment_self, v_post, v_author, 'My own reply');

  SELECT count(*) INTO v_notif_count FROM public.notifications WHERE user_id = v_author;
  IF v_notif_count <> 1 THEN
    RAISE EXCEPTION 'Self-comment generated an extra notification! Expected 1, got %', v_notif_count;
  END IF;

  -- Case 3: Muted user comments -> SHOULD NOT NOTIFY
  INSERT INTO public.post_comments (id, post_id, author_id, body)
  VALUES (v_comment_muted, v_post, v_muted_commenter, 'Muted reply');

  SELECT count(*) INTO v_notif_count FROM public.notifications WHERE user_id = v_author;
  IF v_notif_count <> 1 THEN
    RAISE EXCEPTION 'Muted user comment generated a notification! Expected 1, got %', v_notif_count;
  END IF;
END $$;
SQL
echo "✓ Trigger functionality verified (standard notification created, self-comment suppressed, muted comment suppressed)"

echo "===> Phase 2: ROLLBACK migration"
psql -X -v ON_ERROR_STOP=1 -d "$TEST_DB" -f supabase/rollbacks/20261030130000_capture_notify_mandali_comment_rollback.sql

echo "Checking for leftovers..."
psql -X -v ON_ERROR_STOP=1 -d "$TEST_DB" <<'SQL'
DO $$
DECLARE
  v_trg_count integer;
  v_fn_count integer;
BEGIN
  SELECT count(*) INTO v_trg_count FROM pg_trigger WHERE tgname = 'trg_notify_mandali_comment';
  IF v_trg_count <> 0 THEN
    RAISE EXCEPTION 'Trigger trg_notify_mandali_comment was not dropped!';
  END IF;

  SELECT count(*) INTO v_fn_count FROM pg_proc WHERE proname = 'notify_mandali_comment';
  IF v_fn_count <> 0 THEN
    RAISE EXCEPTION 'Function notify_mandali_comment was not dropped!';
  END IF;
END $$;
SQL
echo "✓ Rollback verified: 0 leftovers (trigger and function dropped)"

echo "===> Phase 3: RE-APPLY migration (idempotency test)"
psql -X -v ON_ERROR_STOP=1 -d "$TEST_DB" -f supabase/migrations/20261030130000_capture_notify_mandali_comment.sql

echo "Checking trigger and function after re-application..."
psql -X -v ON_ERROR_STOP=1 -d "$TEST_DB" <<'SQL'
DO $$
DECLARE
  v_trg_count integer;
  v_fn_count integer;
BEGIN
  SELECT count(*) INTO v_trg_count FROM pg_trigger WHERE tgname = 'trg_notify_mandali_comment';
  IF v_trg_count <> 1 THEN
    RAISE EXCEPTION 'Expected trigger trg_notify_mandali_comment to exist, count=%', v_trg_count;
  END IF;

  SELECT count(*) INTO v_fn_count FROM pg_proc WHERE proname = 'notify_mandali_comment';
  IF v_fn_count <> 1 THEN
    RAISE EXCEPTION 'Expected function notify_mandali_comment to exist, count=%', v_fn_count;
  END IF;
END $$;
SQL
echo "✓ Re-apply verified: trigger and function cleanly re-created"

echo "ALL TESTS PASSED for 20261030130000_capture_notify_mandali_comment.sql!"
