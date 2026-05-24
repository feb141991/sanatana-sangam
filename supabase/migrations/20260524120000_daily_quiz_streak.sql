CREATE TABLE IF NOT EXISTS daily_quiz (
   id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
   tradition     text NOT NULL,
   language      text NOT NULL DEFAULT 'en',
   date          date NOT NULL,
   question      text NOT NULL,
   options       jsonb NOT NULL,
   answer_index  smallint NOT NULL CHECK (answer_index BETWEEN 0 AND 3),
   explanation   text NOT NULL,
   fact          text NOT NULL,
   source        text NOT NULL,
   generated_at  timestamptz NOT NULL DEFAULT now(),
   UNIQUE (tradition, language, date)
);

ALTER TABLE quiz_responses ADD COLUMN IF NOT EXISTS daily_quiz_id uuid REFERENCES daily_quiz(id) ON DELETE SET NULL;

ALTER TABLE quiz_responses ADD COLUMN IF NOT EXISTS streak_at_answer smallint;

ALTER TABLE daily_quiz ENABLE ROW LEVEL SECURITY;

-- PostgreSQL does not support CREATE POLICY IF NOT EXISTS — use DO blocks (see migration 017).
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'daily_quiz' AND policyname = 'daily_quiz_public_read'
  ) THEN
    CREATE POLICY "daily_quiz_public_read" ON daily_quiz FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'daily_quiz' AND policyname = 'daily_quiz_service_insert'
  ) THEN
    CREATE POLICY "daily_quiz_service_insert" ON daily_quiz FOR INSERT WITH CHECK (true);
  END IF;
END $$;
