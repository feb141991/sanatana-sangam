-- Mandali comment reaction types (pranam, love, insightful) bringing comments
-- up to parity with the 3-type devotional reaction set posts already use.
--
-- comment_upvotes has PRIMARY KEY (comment_id, user_id). Switching reactions
-- updates the existing row (upsert), keeping the single-row-per-user invariant.

ALTER TABLE public.comment_upvotes
  ADD COLUMN IF NOT EXISTS reaction_type text NOT NULL DEFAULT 'love'
    CHECK (reaction_type IN ('pranam', 'love', 'insightful'));

-- Add UPDATE policy so users can switch their reaction (pranam <-> love <-> insightful) via upsert
CREATE POLICY "comment_upvotes_update" ON public.comment_upvotes
  FOR UPDATE USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));
