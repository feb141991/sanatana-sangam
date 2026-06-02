-- On-demand daily Dharm Veer cache — same pattern as daily_quiz
CREATE TABLE IF NOT EXISTS public.dharm_veer_daily (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tradition   text NOT NULL,
  date        date NOT NULL,
  slug        text NOT NULL,
  name        text NOT NULL,
  name_local  text,
  era         text,
  tagline     text NOT NULL,
  journey     text NOT NULL,
  journey_local text,
  trial       text NOT NULL,
  trial_local text,
  teaching    text NOT NULL,
  teaching_local text,
  moral       text NOT NULL,
  moral_local text,
  legacy      text,
  legacy_local text,
  quote       text,
  quote_local text,
  quote_source text,
  tags        text[],
  generated_by text DEFAULT 'ai',
  created_at  timestamptz DEFAULT now() NOT NULL,
  UNIQUE (tradition, date)
);

ALTER TABLE public.dharm_veer_daily ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON public.dharm_veer_daily FOR SELECT USING (true);
CREATE POLICY "Service insert" ON public.dharm_veer_daily FOR INSERT WITH CHECK (true);

CREATE INDEX IF NOT EXISTS dharm_veer_daily_tradition_date
  ON public.dharm_veer_daily (tradition, date DESC);
