CREATE TABLE IF NOT EXISTS public.seva_log (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seva_type   text NOT NULL,
  note        text,
  logged_at   timestamptz NOT NULL DEFAULT now(),
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.seva_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "seva_log_select_own" ON public.seva_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "seva_log_insert_own" ON public.seva_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS seva_log_user_logged_at_idx
  ON public.seva_log (user_id, logged_at DESC);
