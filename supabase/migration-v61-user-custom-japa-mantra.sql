-- ─── Migration v61 — User Custom Japa Mantra Sync ───────────────────────────

CREATE TABLE IF NOT EXISTS public.user_custom_japa_mantras (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  label text NOT NULL DEFAULT 'Custom mantra',
  mantra_text text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.touch_user_custom_japa_mantras_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_user_custom_japa_mantras_updated_at
  ON public.user_custom_japa_mantras;

CREATE TRIGGER trg_user_custom_japa_mantras_updated_at
BEFORE UPDATE ON public.user_custom_japa_mantras
FOR EACH ROW
EXECUTE FUNCTION public.touch_user_custom_japa_mantras_updated_at();

ALTER TABLE public.user_custom_japa_mantras ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own custom japa mantra"
  ON public.user_custom_japa_mantras;
DROP POLICY IF EXISTS "Users can insert own custom japa mantra"
  ON public.user_custom_japa_mantras;
DROP POLICY IF EXISTS "Users can update own custom japa mantra"
  ON public.user_custom_japa_mantras;
DROP POLICY IF EXISTS "Users can delete own custom japa mantra"
  ON public.user_custom_japa_mantras;

CREATE POLICY "Users can read own custom japa mantra"
  ON public.user_custom_japa_mantras FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own custom japa mantra"
  ON public.user_custom_japa_mantras FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own custom japa mantra"
  ON public.user_custom_japa_mantras FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own custom japa mantra"
  ON public.user_custom_japa_mantras FOR DELETE
  USING (auth.uid() = user_id);
