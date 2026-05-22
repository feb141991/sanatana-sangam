-- Migration: Add user_mood_checkins table
-- 018_user_mood_checkins.sql

-- Create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_mood_checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    before_mood TEXT,
    source_surface TEXT,
    context_need TEXT,
    context_time TEXT,
    context_type TEXT,
    recommended_action_type TEXT,
    recommended_action_target TEXT,
    clicked_action TEXT,
    completed_action TEXT,
    after_mood TEXT,
    reflection_note TEXT,
    dismissed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMPTZ,
    recommendations_shown JSONB,
    skipped_actions JSONB
);

-- If the table existed previously, we use ALTER to safely modify it
DO $$ 
BEGIN 
  -- Allow before_mood to be nullable if it was NOT NULL
  ALTER TABLE public.user_mood_checkins ALTER COLUMN before_mood DROP NOT NULL;

  -- Add new columns safely
  BEGIN
    ALTER TABLE public.user_mood_checkins ADD COLUMN source_surface TEXT;
  EXCEPTION WHEN duplicate_column THEN END;

  BEGIN
    ALTER TABLE public.user_mood_checkins ADD COLUMN recommended_action_type TEXT;
  EXCEPTION WHEN duplicate_column THEN END;

  BEGIN
    ALTER TABLE public.user_mood_checkins ADD COLUMN recommended_action_target TEXT;
  EXCEPTION WHEN duplicate_column THEN END;

  BEGIN
    ALTER TABLE public.user_mood_checkins ADD COLUMN clicked_action TEXT;
  EXCEPTION WHEN duplicate_column THEN END;

  BEGIN
    ALTER TABLE public.user_mood_checkins ADD COLUMN completed_action TEXT;
  EXCEPTION WHEN duplicate_column THEN END;

  BEGIN
    ALTER TABLE public.user_mood_checkins ADD COLUMN reflection_note TEXT;
  EXCEPTION WHEN duplicate_column THEN END;

  BEGIN
    ALTER TABLE public.user_mood_checkins ADD COLUMN context_need TEXT;
  EXCEPTION WHEN duplicate_column THEN END;

  BEGIN
    ALTER TABLE public.user_mood_checkins ADD COLUMN context_time TEXT;
  EXCEPTION WHEN duplicate_column THEN END;

  BEGIN
    ALTER TABLE public.user_mood_checkins ADD COLUMN context_type TEXT;
  EXCEPTION WHEN duplicate_column THEN END;

  BEGIN
    ALTER TABLE public.user_mood_checkins ADD COLUMN dismissed BOOLEAN NOT NULL DEFAULT false;
  EXCEPTION WHEN duplicate_column THEN END;

  BEGIN
    ALTER TABLE public.user_mood_checkins ADD COLUMN recommendations_shown JSONB;
  EXCEPTION WHEN duplicate_column THEN END;

  BEGIN
    ALTER TABLE public.user_mood_checkins ADD COLUMN skipped_actions JSONB;
  EXCEPTION WHEN duplicate_column THEN END;

  -- Migrate old data (if any) to new columns before dropping
  BEGIN
    UPDATE public.user_mood_checkins 
    SET completed_action = chosen_action 
    WHERE chosen_action IS NOT NULL AND completed_action IS NULL;
  EXCEPTION WHEN undefined_column THEN END;

  BEGIN
    UPDATE public.user_mood_checkins 
    SET recommended_action_type = recommended_action 
    WHERE recommended_action IS NOT NULL AND recommended_action_type IS NULL;
  EXCEPTION WHEN undefined_column THEN END;

  -- Drop legacy columns
  BEGIN
    ALTER TABLE public.user_mood_checkins DROP COLUMN chosen_action;
  EXCEPTION WHEN undefined_column THEN END;
  
  BEGIN
    ALTER TABLE public.user_mood_checkins DROP COLUMN recommended_action;
  EXCEPTION WHEN undefined_column THEN END;

END $$;


-- Enable RLS
ALTER TABLE public.user_mood_checkins ENABLE ROW LEVEL SECURITY;

-- Users can see their own checkins
DROP POLICY IF EXISTS "Users can see their own checkins" ON public.user_mood_checkins;
CREATE POLICY "Users can see their own checkins" ON public.user_mood_checkins
    FOR SELECT USING (user_id = auth.uid());

-- Users can insert their own checkins
DROP POLICY IF EXISTS "Users can insert their own checkins" ON public.user_mood_checkins;
CREATE POLICY "Users can insert their own checkins" ON public.user_mood_checkins
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own checkins
DROP POLICY IF EXISTS "Users can update their own checkins" ON public.user_mood_checkins;
CREATE POLICY "Users can update their own checkins" ON public.user_mood_checkins
    FOR UPDATE USING (user_id = auth.uid());

-- Index for querying
CREATE INDEX IF NOT EXISTS idx_user_mood_checkins_user_id ON public.user_mood_checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_user_mood_checkins_created_at ON public.user_mood_checkins(created_at);
