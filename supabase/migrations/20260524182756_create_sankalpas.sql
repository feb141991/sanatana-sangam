CREATE TABLE IF NOT EXISTS public.sankalpas (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  text         TEXT NOT NULL,                          -- the intention in user's words
  tradition    TEXT NOT NULL DEFAULT 'hindu',
  related_practice TEXT,                               -- 'japa' | 'nitya' | 'pathshala' | 'quiz' | 'all'
  target_days  INTEGER NOT NULL DEFAULT 30,
  start_date   DATE NOT NULL,
  end_date     DATE NOT NULL,
  status       TEXT NOT NULL DEFAULT 'active'          -- 'active' | 'completed' | 'abandoned'
               CHECK (status IN ('active','completed','abandoned')),
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.sankalpas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own sankalpas" ON public.sankalpas
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX ON public.sankalpas(user_id, status);
