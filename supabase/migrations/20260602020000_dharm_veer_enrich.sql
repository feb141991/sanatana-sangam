-- Add legacy + illustration fields to dharm_veers
ALTER TABLE dharm_veers
  ADD COLUMN IF NOT EXISTS legacy TEXT,
  ADD COLUMN IF NOT EXISTS legacy_local TEXT,
  ADD COLUMN IF NOT EXISTS illustration_prompt TEXT;
