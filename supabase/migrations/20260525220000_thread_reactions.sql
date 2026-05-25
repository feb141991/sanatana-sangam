CREATE TABLE IF NOT EXISTS public.thread_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type text NOT NULL CHECK (reaction_type IN ('pranam', 'bhakti', 'prakas')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(thread_id, user_id, reaction_type)
);

ALTER TABLE public.thread_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own reactions" ON public.thread_reactions
  FOR ALL USING (auth.uid() = user_id);

-- Reaction counts view (optional but efficient):
CREATE OR REPLACE VIEW public.thread_reaction_counts AS
  SELECT thread_id,
    reaction_type,
    COUNT(*) AS count
  FROM public.thread_reactions
  GROUP BY thread_id, reaction_type;
