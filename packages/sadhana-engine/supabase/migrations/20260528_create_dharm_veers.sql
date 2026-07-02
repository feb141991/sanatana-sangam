CREATE TABLE IF NOT EXISTS public.dharm_veers (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug            text UNIQUE NOT NULL,
  name            text NOT NULL,
  name_local      text,
  tradition       text NOT NULL CHECK (tradition IN ('hindu','sikh','buddhist','jain','sufi','tribal')),
  era             text,
  tagline         text NOT NULL,
  journey         text NOT NULL,
  journey_local   text,
  trial           text NOT NULL,
  trial_local     text,
  teaching        text NOT NULL,
  teaching_local  text,
  moral           text NOT NULL,
  moral_local     text,
  quote           text,
  quote_local     text,
  quote_source    text,
  tags            text[] DEFAULT '{}',
  day_index       integer UNIQUE,
  generated_by    text DEFAULT 'ai',
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX dharm_veers_tradition_idx ON public.dharm_veers (tradition);
CREATE INDEX dharm_veers_day_index_idx ON public.dharm_veers (day_index);

ALTER TABLE public.dharm_veers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dharm_veers_public_read" ON public.dharm_veers
  FOR SELECT USING (true);
