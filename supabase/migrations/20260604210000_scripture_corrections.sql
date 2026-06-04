CREATE TABLE IF NOT EXISTS public.scripture_corrections (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  scripture_source      TEXT NOT NULL,
  verse_text_original   TEXT NOT NULL,
  suggested_correction  TEXT NOT NULL,
  reason_details        TEXT,
  status                TEXT DEFAULT 'pending' 
                        CHECK (status IN ('pending','approved','rejected')) NOT NULL,
  created_at            TIMESTAMPTZ DEFAULT now() NOT NULL
);
ALTER TABLE public.scripture_corrections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own corrections" ON public.scripture_corrections;
CREATE POLICY "Users can read own corrections" ON public.scripture_corrections
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert corrections" ON public.scripture_corrections;
CREATE POLICY "Users can insert corrections" ON public.scripture_corrections
  FOR INSERT WITH CHECK (auth.uid() = user_id);
