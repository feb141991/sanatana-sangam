-- Migration v47: Add active_symbol_id to profiles for Kosh integration
-- Allows users to select an unlocked relic as their active spiritual symbol.

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS active_symbol_id TEXT REFERENCES public.relics(id) ON DELETE SET NULL;

-- If public.relics doesn't exist (it might be a frontend-only config), 
-- we just use a TEXT column without the FK for now to avoid breaking inserts.
-- Checking if it exists first:
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'relics') THEN
        ALTER TABLE public.profiles DROP COLUMN IF EXISTS active_symbol_id;
        ALTER TABLE public.profiles ADD COLUMN active_symbol_id TEXT;
    END IF;
END $$;

COMMENT ON COLUMN public.profiles.active_symbol_id IS 'The ID of the sacred symbol (relic) currently active for the user profile.';
