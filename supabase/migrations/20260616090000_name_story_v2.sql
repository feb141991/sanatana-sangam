ALTER TABLE public.name_stories
  ADD COLUMN IF NOT EXISTS display_name TEXT NULL,
  ADD COLUMN IF NOT EXISTS normalized_first_name TEXT NULL,
  ADD COLUMN IF NOT EXISTS name_native_script TEXT NULL,
  ADD COLUMN IF NOT EXISTS name_transliteration TEXT NULL,
  ADD COLUMN IF NOT EXISTS user_intent TEXT[] DEFAULT ARRAY[]::TEXT[] NOT NULL,
  ADD COLUMN IF NOT EXISTS translation_language TEXT NULL,
  ADD COLUMN IF NOT EXISTS sacred_meaning TEXT NULL,
  ADD COLUMN IF NOT EXISTS name_story TEXT NULL,
  ADD COLUMN IF NOT EXISTS inner_quality TEXT NULL,
  ADD COLUMN IF NOT EXISTS life_blessing TEXT NULL,
  ADD COLUMN IF NOT EXISTS practice_suggestion TEXT NULL,
  ADD COLUMN IF NOT EXISTS name_mantra TEXT NULL,
  ADD COLUMN IF NOT EXISTS name_mantra_translation TEXT NULL,
  ADD COLUMN IF NOT EXISTS scripture_original TEXT NULL,
  ADD COLUMN IF NOT EXISTS scripture_transliteration TEXT NULL,
  ADD COLUMN IF NOT EXISTS scripture_translation TEXT NULL,
  ADD COLUMN IF NOT EXISTS scripture_translation_language TEXT NULL,
  ADD COLUMN IF NOT EXISTS source_confidence TEXT NULL CHECK (source_confidence IN ('classical', 'interpretive', 'uncertain')),
  ADD COLUMN IF NOT EXISTS source_note TEXT NULL;

CREATE INDEX IF NOT EXISTS idx_name_stories_normalized_first_name
  ON public.name_stories(normalized_first_name);
