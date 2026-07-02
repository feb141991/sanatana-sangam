CREATE TABLE IF NOT EXISTS public.sankalpa_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sankalpa_id uuid NOT NULL,
  checked_date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, sankalpa_id, checked_date)
);

ALTER TABLE public.sankalpa_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own checkins" ON public.sankalpa_checkins
  FOR ALL USING (auth.uid() = user_id);
