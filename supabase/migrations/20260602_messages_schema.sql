-- Create message_threads table
CREATE TABLE IF NOT EXISTS public.message_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text,
  kind text CHECK (kind IN ('kul', 'mandali', 'direct')) NOT NULL,
  context_label text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create thread_participants table
CREATE TABLE IF NOT EXISTS public.thread_participants (
  thread_id uuid REFERENCES public.message_threads(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  unread_count int DEFAULT 0 NOT NULL,
  joined_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (thread_id, user_id)
);

-- Create thread_messages table
CREATE TABLE IF NOT EXISTS public.thread_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid REFERENCES public.message_threads(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  sender_name text,
  body text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  delivery_state text DEFAULT 'sent' NOT NULL
);

-- Enable RLS
ALTER TABLE public.message_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thread_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thread_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to prevent collision
DROP POLICY IF EXISTS "Users can read threads they participate in" ON public.message_threads;
DROP POLICY IF EXISTS "Anyone authenticated can insert a thread" ON public.message_threads;
DROP POLICY IF EXISTS "Participants can update a thread" ON public.message_threads;
DROP POLICY IF EXISTS "Users can view participants of threads they are in" ON public.thread_participants;
DROP POLICY IF EXISTS "Users can insert participant records" ON public.thread_participants;
DROP POLICY IF EXISTS "Users can update participant records they own" ON public.thread_participants;
DROP POLICY IF EXISTS "Users can delete participant records they own" ON public.thread_participants;
DROP POLICY IF EXISTS "Users can read messages in threads they participate in" ON public.thread_messages;
DROP POLICY IF EXISTS "Users can send messages to threads they participate in" ON public.thread_messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.thread_messages;

-- Create policies for message_threads
CREATE POLICY "Users can read threads they participate in"
  ON public.message_threads FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.thread_participants
      WHERE thread_participants.thread_id = id
        AND thread_participants.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone authenticated can insert a thread"
  ON public.message_threads FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Participants can update a thread"
  ON public.message_threads FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.thread_participants
      WHERE thread_participants.thread_id = id
        AND thread_participants.user_id = auth.uid()
    )
  );

-- Create policies for thread_participants
CREATE POLICY "Users can view participants of threads they are in"
  ON public.thread_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.thread_participants tp
      WHERE tp.thread_id = thread_id
        AND tp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert participant records"
  ON public.thread_participants FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update participant records they own"
  ON public.thread_participants FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete participant records they own"
  ON public.thread_participants FOR DELETE
  USING (user_id = auth.uid());

-- Create policies for thread_messages
CREATE POLICY "Users can read messages in threads they participate in"
  ON public.thread_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.thread_participants
      WHERE thread_participants.thread_id = thread_id
        AND thread_participants.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages to threads they participate in"
  ON public.thread_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.thread_participants
      WHERE thread_participants.thread_id = thread_id
        AND thread_participants.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own messages"
  ON public.thread_messages FOR UPDATE
  USING (sender_id = auth.uid());

-- Enable Realtime for thread_messages table (add to publication)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'thread_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.thread_messages;
  END IF;
END $$;
