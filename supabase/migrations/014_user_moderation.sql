-- Migration: Add user moderation fields and warnings table
-- 014_user_moderation.sql

-- 1. Add is_banned and ban_reason to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS ban_reason TEXT;

-- 2. Ensure content_reports exists (in case v5-fixes wasn't run)
CREATE TABLE IF NOT EXISTS public.content_reports (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reported_by   uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content_type  text NOT NULL,
  content_id    text NOT NULL,
  reason        text NOT NULL,
  status        text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'actioned', 'dismissed')),
  admin_note    text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- 3. Add content_author_id to content_reports
ALTER TABLE public.content_reports
ADD COLUMN IF NOT EXISTS content_author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 4. Create user_warnings table
CREATE TABLE IF NOT EXISTS public.user_warnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    admin_name TEXT,
    reason TEXT NOT NULL,
    admin_note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for user_warnings
ALTER TABLE public.user_warnings ENABLE ROW LEVEL SECURITY;

-- Admins can do everything with warnings
CREATE POLICY "Admins can manage all warnings" ON public.user_warnings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
        )
    );

-- Users can see their own warnings
CREATE POLICY "Users can see their own warnings" ON public.user_warnings
    FOR SELECT USING (user_id = auth.uid());

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_warnings_user_id ON public.user_warnings(user_id);
