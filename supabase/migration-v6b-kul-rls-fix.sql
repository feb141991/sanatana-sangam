-- ─── Migration v6b — Fix Kul RLS infinite recursion ────────────────────────
-- Problem: kul_members SELECT policy queried kul_members to check itself
--          → Postgres infinite recursion error on any Kul operation
-- Fix: use profiles.kul_id (non-recursive) as the source of truth for all policies
-- Run this in Supabase SQL Editor AFTER migration-v6-kul.sql

-- ── Drop all old kul policies ────────────────────────────────────────────────
DROP POLICY IF EXISTS "Kul members can view kul"                    ON kuls;
DROP POLICY IF EXISTS "Anyone can create a kul"                     ON kuls;
DROP POLICY IF EXISTS "Guardian can update kul"                     ON kuls;
DROP POLICY IF EXISTS "Kul members can view other members"          ON kul_members;
DROP POLICY IF EXISTS "Users can join a kul"                        ON kul_members;
DROP POLICY IF EXISTS "Guardian can remove members"                 ON kul_members;
DROP POLICY IF EXISTS "Kul members can view tasks"                  ON kul_tasks;
DROP POLICY IF EXISTS "Guardians can create tasks"                  ON kul_tasks;
DROP POLICY IF EXISTS "Assigned member or guardian can update task" ON kul_tasks;
DROP POLICY IF EXISTS "Guardian can delete tasks"                   ON kul_tasks;
DROP POLICY IF EXISTS "Kul members can view messages"               ON kul_messages;
DROP POLICY IF EXISTS "Kul members can send messages"               ON kul_messages;
DROP POLICY IF EXISTS "Sender can delete own messages"              ON kul_messages;

-- ── Helper functions (SECURITY DEFINER — bypass RLS on internal lookup) ──────

-- Returns the kul_id stored on the current user's profile row
CREATE OR REPLACE FUNCTION auth_kul_id()
RETURNS uuid LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT kul_id FROM profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- Returns the current user's role in their kul
CREATE OR REPLACE FUNCTION auth_kul_role()
RETURNS text LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT role
  FROM   kul_members
  WHERE  user_id = auth.uid()
    AND  kul_id  = (SELECT kul_id FROM profiles WHERE id = auth.uid() LIMIT 1)
  LIMIT 1;
$$;

-- ── kuls ─────────────────────────────────────────────────────────────────────
CREATE POLICY "kul_select"
  ON kuls FOR SELECT
  USING (id = auth_kul_id());

CREATE POLICY "kul_insert"
  ON kuls FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "kul_update"
  ON kuls FOR UPDATE
  USING (id = auth_kul_id() AND auth_kul_role() = 'guardian');

-- ── kul_members ──────────────────────────────────────────────────────────────
-- SELECT: only members whose kul_id matches the user's kul (via profiles, not self-join)
CREATE POLICY "kul_members_select"
  ON kul_members FOR SELECT
  USING (kul_id = auth_kul_id());

-- INSERT: anyone can join any kul (they'll provide the kul_id via invite code lookup)
CREATE POLICY "kul_members_insert"
  ON kul_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- DELETE: leave yourself, or guardian removes anyone
CREATE POLICY "kul_members_delete"
  ON kul_members FOR DELETE
  USING (auth.uid() = user_id OR auth_kul_role() = 'guardian');

-- UPDATE: guardian can promote/demote
CREATE POLICY "kul_members_update"
  ON kul_members FOR UPDATE
  USING (kul_id = auth_kul_id() AND auth_kul_role() = 'guardian');

-- ── kul_tasks ────────────────────────────────────────────────────────────────
CREATE POLICY "kul_tasks_select"
  ON kul_tasks FOR SELECT
  USING (kul_id = auth_kul_id());

CREATE POLICY "kul_tasks_insert"
  ON kul_tasks FOR INSERT
  WITH CHECK (kul_id = auth_kul_id() AND auth_kul_role() = 'guardian');

CREATE POLICY "kul_tasks_update"
  ON kul_tasks FOR UPDATE
  USING (auth.uid() = assigned_to OR auth_kul_role() = 'guardian');

CREATE POLICY "kul_tasks_delete"
  ON kul_tasks FOR DELETE
  USING (auth_kul_role() = 'guardian');

-- ── kul_messages ─────────────────────────────────────────────────────────────
CREATE POLICY "kul_messages_select"
  ON kul_messages FOR SELECT
  USING (kul_id = auth_kul_id());

CREATE POLICY "kul_messages_insert"
  ON kul_messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id AND kul_id = auth_kul_id());

CREATE POLICY "kul_messages_delete"
  ON kul_messages FOR DELETE
  USING (auth.uid() = sender_id);

-- ── Done ─────────────────────────────────────────────────────────────────────
-- Key change: all policies now use auth_kul_id() which reads from profiles,
-- not from kul_members itself — this eliminates the infinite recursion.
