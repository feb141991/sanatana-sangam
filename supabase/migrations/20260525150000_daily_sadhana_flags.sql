ALTER TABLE public.daily_sadhana
  ADD COLUMN IF NOT EXISTS quiz_done boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS nitya_done boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS pathshala_done boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS dharmveer_done boolean DEFAULT false;

ALTER TABLE public.daily_sadhana ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'daily_sadhana'
      AND policyname = 'Users can update own daily sadhana rows'
  ) THEN
    CREATE POLICY "Users can update own daily sadhana rows"
      ON public.daily_sadhana
      FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
