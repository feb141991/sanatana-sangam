#!/usr/bin/env bash
# Verification for 20261030130000_capture_notify_mandali_comment.sql on a scratch PostgreSQL.
#
# The migration is a CAPTURE of what production already runs, so this checks two different things:
#   1. Identity: after applying, the function and trigger fingerprints equal production's (read on 2026-10-31,
#      PostgreSQL 17.6). A migration that merely "works" but differs from production fails here.
#   2. Behaviour: top-level comments, replies, self/mute/block/preference suppression, excerpt, dedupe.
# Then: rollback (a documented no-op, the live trigger must survive) and re-apply (idempotent).
#
# MIGRATION_FILE / ROLLBACK_FILE may be overridden to prove the test rejects a wrong migration.
set -euo pipefail

MIGRATION_FILE="${MIGRATION_FILE:-supabase/migrations/20261030130000_capture_notify_mandali_comment.sql}"
ROLLBACK_FILE="${ROLLBACK_FILE:-supabase/rollbacks/20261030130000_capture_notify_mandali_comment_rollback.sql}"
PROD_FN_MD5="5058bac9b160499303b8a20804d1111b"
PROD_TRG_MD5="68b7e582dfdb813174eb9324b413219f"

export PGHOST="${PGHOST:-/tmp}"
export PGPORT="${PGPORT:-5432}"
unset PGDATABASE PGSERVICE PGSERVICEFILE

TEST_DB="scratch_mandali_comment_test_$$"
echo "Creating isolated test database: $TEST_DB"
createdb "$TEST_DB"
trap 'dropdb --if-exists "$TEST_DB"' EXIT
PSQL=(psql -X -q -v ON_ERROR_STOP=1 -d "$TEST_DB")

echo "Setting up mock schema prerequisites (anon / authenticated roles must exist on this cluster)..."
"${PSQL[@]}" <<'SQL'
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
  parent_id uuid REFERENCES public.post_comments(id),
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
  notification_key text
);
CREATE UNIQUE INDEX notifications_user_key_uniq ON public.notifications (user_id, notification_key)
  WHERE notification_key IS NOT NULL;
SQL

assert_fingerprints() {
  # psql does not interpolate variables inside $$ bodies, so the expected values travel as custom settings.
  PGOPTIONS="-c app.fn_md5=$PROD_FN_MD5 -c app.trg_md5=$PROD_TRG_MD5" "${PSQL[@]}" <<'SQL'
DO $$
DECLARE
  v_fn text := md5(pg_get_functiondef('public.notify_mandali_comment'::regproc));
  v_prod_fn text := current_setting('app.fn_md5');
  v_prod_trg text := current_setting('app.trg_md5');
  v_trg text;
  v_trg_count integer;
  v_secdef boolean;
  v_cfg text[];
  v_acl text;
BEGIN
  IF v_fn <> v_prod_fn THEN
    RAISE EXCEPTION 'function differs from production: md5 % (production %)', v_fn, v_prod_fn;
  END IF;
  SELECT count(*), max(md5(pg_get_triggerdef(oid))) INTO v_trg_count, v_trg
  FROM pg_trigger WHERE tgname = 'trg_notify_mandali_comment' AND NOT tgisinternal;
  IF v_trg_count <> 1 THEN
    RAISE EXCEPTION 'expected exactly 1 trg_notify_mandali_comment trigger, found %', v_trg_count;
  END IF;
  IF v_trg IS DISTINCT FROM v_prod_trg THEN
    RAISE EXCEPTION 'trigger differs from production: md5 % (production %)', v_trg, v_prod_trg;
  END IF;
  SELECT prosecdef, proconfig INTO v_secdef, v_cfg FROM pg_proc WHERE oid = 'public.notify_mandali_comment'::regproc;
  IF NOT v_secdef OR v_cfg IS DISTINCT FROM ARRAY['search_path=public'] THEN
    RAISE EXCEPTION 'expected SECURITY DEFINER with search_path=public, got % %', v_secdef, v_cfg;
  END IF;
  IF has_function_privilege('anon', 'public.notify_mandali_comment()', 'EXECUTE')
     OR has_function_privilege('authenticated', 'public.notify_mandali_comment()', 'EXECUTE') THEN
    RAISE EXCEPTION 'anon/authenticated must not be able to EXECUTE the trigger function directly';
  END IF;
END $$;
SQL
}

echo "===> Phase 1: APPLY migration, then check it is identical to production"
"${PSQL[@]}" -f "$MIGRATION_FILE"
assert_fingerprints
echo "✓ Function and trigger match the production fingerprints; not executable by anon/authenticated"

echo "===> Phase 2: behaviour"
"${PSQL[@]}" <<'SQL'
DO $$
DECLARE
  a uuid := gen_random_uuid();   -- post author
  b uuid := gen_random_uuid();   -- commenter
  c uuid := gen_random_uuid();   -- muted by a
  d uuid := gen_random_uuid();   -- blocked by a
  e uuid := gen_random_uuid();   -- has blocked a
  g uuid := gen_random_uuid();   -- unrelated third commenter
  p uuid := gen_random_uuid();
  c1 uuid := gen_random_uuid();
  c2 uuid := gen_random_uuid();
  c3 uuid := gen_random_uuid();
  pre uuid := gen_random_uuid();
  n record;
  cnt integer;
BEGIN
  INSERT INTO public.profiles (id, full_name, username) VALUES
    (a, 'Post Author', 'author'), (b, 'Commenter User', 'commenter'), (c, 'Muted User', 'muted'),
    (d, 'Blocked User', 'blocked'), (e, 'Blocker User', 'blocker'), (g, NULL, 'third');
  INSERT INTO public.user_muted_profiles VALUES (a, c);
  INSERT INTO public.user_blocked_profiles VALUES (a, d), (e, a);
  INSERT INTO public.posts (id, author_id) VALUES (p, a);

  -- 1. Top-level comment from another user -> the POST author is notified, with the excerpt and the final key format.
  INSERT INTO public.post_comments (id, post_id, author_id, body) VALUES (c1, p, b, 'Great post!');
  SELECT * INTO n FROM public.notifications WHERE user_id = a;
  IF NOT FOUND THEN RAISE EXCEPTION 'case 1: post author was not notified'; END IF;
  IF n.title <> 'Commenter User commented on your post' THEN RAISE EXCEPTION 'case 1: title was %', n.title; END IF;
  IF n.body <> 'Great post!' THEN RAISE EXCEPTION 'case 1: body was %', n.body; END IF;
  IF n.type <> 'mandali_comment' OR n.notification_key <> 'mandali_comment:' || c1::text
     OR n.action_url <> '/mandali' OR n.emoji <> '💬' THEN
    RAISE EXCEPTION 'case 1: unexpected type/key/url/emoji: % % % %', n.type, n.notification_key, n.action_url, n.emoji;
  END IF;

  -- 2. A REPLY notifies the PARENT COMMENT's author, not the post author.
  INSERT INTO public.post_comments (id, post_id, author_id, parent_id, body) VALUES (c2, p, a, c1, 'Thank you');
  SELECT count(*) INTO cnt FROM public.notifications WHERE user_id = b;
  IF cnt <> 1 THEN RAISE EXCEPTION 'case 2: parent comment author should get 1 notification, got %', cnt; END IF;
  SELECT * INTO n FROM public.notifications WHERE user_id = b;
  IF n.title <> 'Post Author replied to your comment' OR n.notification_key <> 'mandali_comment:' || c2::text THEN
    RAISE EXCEPTION 'case 2: unexpected title/key: % / %', n.title, n.notification_key;
  END IF;
  SELECT count(*) INTO cnt FROM public.notifications WHERE user_id = a;
  IF cnt <> 1 THEN RAISE EXCEPTION 'case 2: post author must not be notified of a reply to someone else, got %', cnt; END IF;

  -- 3. A third user replying to b's comment notifies b (a nameless profile falls back to the username).
  INSERT INTO public.post_comments (id, post_id, author_id, parent_id, body) VALUES (c3, p, g, c1, 'Agreed');
  SELECT count(*) INTO cnt FROM public.notifications WHERE user_id = b;
  IF cnt <> 2 THEN RAISE EXCEPTION 'case 3: expected 2 notifications for b, got %', cnt; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.notifications WHERE user_id = b AND title = 'third replied to your comment') THEN
    RAISE EXCEPTION 'case 3: expected the username fallback in the title';
  END IF;

  -- 4. Self comment and self reply -> nothing.
  INSERT INTO public.post_comments (post_id, author_id, body) VALUES (p, a, 'my own comment');
  INSERT INTO public.post_comments (post_id, author_id, parent_id, body) VALUES (p, b, c1, 'replying to myself');
  SELECT count(*) INTO cnt FROM public.notifications;
  IF cnt <> 3 THEN RAISE EXCEPTION 'case 4: self comment/reply must not notify; total notifications %', cnt; END IF;

  -- 5. Muted by the recipient, blocked by the recipient, recipient blocked the author -> nothing.
  INSERT INTO public.post_comments (post_id, author_id, body) VALUES (p, c, 'muted');
  INSERT INTO public.post_comments (post_id, author_id, body) VALUES (p, d, 'blocked by author');
  INSERT INTO public.post_comments (post_id, author_id, body) VALUES (p, e, 'blocker of author');
  SELECT count(*) INTO cnt FROM public.notifications;
  IF cnt <> 3 THEN RAISE EXCEPTION 'case 5: muted/blocked comments must not notify; total notifications %', cnt; END IF;

  -- 6. Preference off -> nothing; preference NULL is treated as on.
  UPDATE public.profiles SET wants_community_notifications = false WHERE id = a;
  INSERT INTO public.post_comments (post_id, author_id, body) VALUES (p, b, 'after opt-out');
  SELECT count(*) INTO cnt FROM public.notifications WHERE user_id = a;
  IF cnt <> 1 THEN RAISE EXCEPTION 'case 6: opted-out recipient got a notification (%)', cnt; END IF;
  UPDATE public.profiles SET wants_community_notifications = NULL WHERE id = a;
  INSERT INTO public.post_comments (post_id, author_id, body) VALUES (p, b, 'preference unset');
  SELECT count(*) INTO cnt FROM public.notifications WHERE user_id = a;
  IF cnt <> 2 THEN RAISE EXCEPTION 'case 6: NULL preference must count as on (%)', cnt; END IF;

  -- 7. Excerpt: 141+ characters are cut to 140 plus an ellipsis; exactly 140 is untouched.
  INSERT INTO public.post_comments (post_id, author_id, body) VALUES (p, b, repeat('x', 200));
  IF NOT EXISTS (SELECT 1 FROM public.notifications WHERE user_id = a AND body = repeat('x', 140) || '…') THEN
    RAISE EXCEPTION 'case 7: long body was not cut to 140 characters plus an ellipsis';
  END IF;
  INSERT INTO public.post_comments (post_id, author_id, body) VALUES (p, b, repeat('y', 140));
  IF NOT EXISTS (SELECT 1 FROM public.notifications WHERE user_id = a AND body = repeat('y', 140)) THEN
    RAISE EXCEPTION 'case 7: a 140-character body must be kept whole';
  END IF;

  -- 8. Dedupe: a notification that already holds the key makes the trigger insert nothing and not fail.
  INSERT INTO public.notifications (user_id, title, body, type, notification_key)
  VALUES (a, 'pre-existing', 'pre-existing', 'mandali_comment', 'mandali_comment:' || pre::text);
  SELECT count(*) INTO cnt FROM public.notifications WHERE user_id = a;
  INSERT INTO public.post_comments (id, post_id, author_id, body) VALUES (pre, p, b, 'duplicate key');
  IF (SELECT count(*) FROM public.notifications WHERE user_id = a) <> cnt THEN
    RAISE EXCEPTION 'case 8: duplicate notification key created a second row';
  END IF;
END $$;
SQL
echo "✓ Behaviour verified (post comment, reply to parent author, self, mute, both block directions, preference off/NULL, excerpt, dedupe)"

echo "===> Phase 3: ROLLBACK (a documented no-op) must leave the live trigger and function untouched"
"${PSQL[@]}" -f "$ROLLBACK_FILE"
assert_fingerprints
echo "✓ Rollback left the function and trigger exactly as they were"

echo "===> Phase 4: RE-APPLY (idempotency)"
"${PSQL[@]}" -f "$MIGRATION_FILE"
assert_fingerprints
echo "✓ Re-apply is a no-op: still exactly one trigger, identical definitions"

echo "ALL TESTS PASSED for 20261030130000_capture_notify_mandali_comment.sql"
