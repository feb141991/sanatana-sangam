-- Push subscriptions table (one row per browser/device per user)
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own push subscriptions" ON public.push_subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- Add reminder preference columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS japa_reminder_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS japa_reminder_time text DEFAULT '07:00';
  -- format: 'HH:MM' in user's local time, e.g. '07:00', '18:30'
