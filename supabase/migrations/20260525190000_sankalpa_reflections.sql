CREATE TABLE IF NOT EXISTS public.sankalpa_reflections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sankalpa_id uuid NOT NULL,
  reflection_type text NOT NULL DEFAULT 'midpoint',
  mood text NOT NULL CHECK (mood IN ('strong', 'struggling', 'grateful')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.sankalpa_reflections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own reflections" ON public.sankalpa_reflections
  FOR ALL USING (auth.uid() = user_id);
