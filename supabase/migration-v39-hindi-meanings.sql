-- ─── Hindi Meanings Table ────────────────────────────────────────────────────
-- Stores AI-generated Hindi meanings for scripture entries.
-- Generated via /admin/hindi-generator using the Gemini API.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.hindi_meanings (
    entry_id   text PRIMARY KEY,
    meaning_hi text NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Public read access (no auth needed — these are scripture translations)
ALTER TABLE public.hindi_meanings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read hindi meanings" ON public.hindi_meanings
    FOR SELECT USING (true);

-- Only service role can insert/update (admin API uses service role key)
-- No public insert policy needed.
