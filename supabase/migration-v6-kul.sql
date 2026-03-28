-- ─── Migration v6 — Kul (Family Sangam) ────────────────────────────────────
-- Covers: kuls, kul_members, kul_tasks, kul_messages
-- Run in Supabase SQL Editor

-- ── 1. kuls — the family group ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kuls (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  invite_code  text NOT NULL UNIQUE,
  created_by   uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  avatar_emoji text NOT NULL DEFAULT '🏡',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_kul_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS trg_kul_updated_at ON kuls;
CREATE TRIGGER trg_kul_updated_at
  BEFORE UPDATE ON kuls FOR EACH ROW EXECUTE FUNCTION update_kul_updated_at();

-- ── 2. kul_members — who is in which kul ────────────────────────────────────
CREATE TABLE IF NOT EXISTS kul_members (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kul_id     uuid NOT NULL REFERENCES kuls(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role       text NOT NULL DEFAULT 'sadhak' CHECK (role IN ('guardian', 'sadhak')),
  joined_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(kul_id, user_id)
);

-- ── 3. kul_tasks — assigned sadhana tasks ────────────────────────────────────
CREATE TABLE IF NOT EXISTS kul_tasks (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kul_id        uuid NOT NULL REFERENCES kuls(id) ON DELETE CASCADE,
  assigned_by   uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_to   uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title         text NOT NULL,
  description   text,
  task_type     text NOT NULL DEFAULT 'read'
                CHECK (task_type IN ('read', 'recite', 'practice', 'memorise')),
  content_ref   text,     -- library entry ID or scripture reference
  due_date      date,
  completed     boolean NOT NULL DEFAULT false,
  completed_at  timestamptz,
  score         int,      -- recitation score 0-100
  guardian_note text,     -- feedback from guardian
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ── 4. kul_messages — family chat ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kul_messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kul_id      uuid NOT NULL REFERENCES kuls(id) ON DELETE CASCADE,
  sender_id   uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content     text NOT NULL,
  reaction    text,   -- emoji reaction (optional)
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ── 5. Add kul_id to profiles ────────────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS kul_id uuid REFERENCES kuls(id) ON DELETE SET NULL;

-- ── 6. RLS ───────────────────────────────────────────────────────────────────
ALTER TABLE kuls          ENABLE ROW LEVEL SECURITY;
ALTER TABLE kul_members   ENABLE ROW LEVEL SECURITY;
ALTER TABLE kul_tasks     ENABLE ROW LEVEL SECURITY;
ALTER TABLE kul_messages  ENABLE ROW LEVEL SECURITY;

-- kuls: members can view their kul
CREATE POLICY "Kul members can view kul"
  ON kuls FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM kul_members WHERE kul_id = kuls.id AND user_id = auth.uid()
  ));

CREATE POLICY "Anyone can create a kul"
  ON kuls FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Guardian can update kul"
  ON kuls FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM kul_members
    WHERE kul_id = kuls.id AND user_id = auth.uid() AND role = 'guardian'
  ));

-- kul_members
CREATE POLICY "Kul members can view other members"
  ON kul_members FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM kul_members km2
    WHERE km2.kul_id = kul_members.kul_id AND km2.user_id = auth.uid()
  ));

CREATE POLICY "Users can join a kul"
  ON kul_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Guardian can remove members"
  ON kul_members FOR DELETE
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM kul_members km2
    WHERE km2.kul_id = kul_members.kul_id AND km2.user_id = auth.uid() AND km2.role = 'guardian'
  ));

-- kul_tasks
CREATE POLICY "Kul members can view tasks"
  ON kul_tasks FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM kul_members WHERE kul_id = kul_tasks.kul_id AND user_id = auth.uid()
  ));

CREATE POLICY "Guardians can create tasks"
  ON kul_tasks FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM kul_members
    WHERE kul_id = kul_tasks.kul_id AND user_id = auth.uid() AND role = 'guardian'
  ));

CREATE POLICY "Assigned member or guardian can update task"
  ON kul_tasks FOR UPDATE
  USING (
    auth.uid() = assigned_to OR
    EXISTS (
      SELECT 1 FROM kul_members
      WHERE kul_id = kul_tasks.kul_id AND user_id = auth.uid() AND role = 'guardian'
    )
  );

CREATE POLICY "Guardian can delete tasks"
  ON kul_tasks FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM kul_members
    WHERE kul_id = kul_tasks.kul_id AND user_id = auth.uid() AND role = 'guardian'
  ));

-- kul_messages
CREATE POLICY "Kul members can view messages"
  ON kul_messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM kul_members WHERE kul_id = kul_messages.kul_id AND user_id = auth.uid()
  ));

CREATE POLICY "Kul members can send messages"
  ON kul_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (SELECT 1 FROM kul_members WHERE kul_id = kul_messages.kul_id AND user_id = auth.uid())
  );

CREATE POLICY "Sender can delete own messages"
  ON kul_messages FOR DELETE
  USING (auth.uid() = sender_id);

-- ── 7. Indexes ───────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_kul_members_kul_id  ON kul_members(kul_id);
CREATE INDEX IF NOT EXISTS idx_kul_members_user_id ON kul_members(user_id);
CREATE INDEX IF NOT EXISTS idx_kul_tasks_kul_id    ON kul_tasks(kul_id);
CREATE INDEX IF NOT EXISTS idx_kul_tasks_assigned  ON kul_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_kul_messages_kul    ON kul_messages(kul_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_kuls_invite  ON kuls(invite_code);

-- ── Done ─────────────────────────────────────────────────────────────────────
-- Summary:
--   kuls             — family group with invite code
--   kul_members      — guardian / sadhak roles
--   kul_tasks        — assigned read/recite/practice tasks with optional scoring
--   kul_messages     — private family chat
--   profiles.kul_id  — FK to the user's kul
