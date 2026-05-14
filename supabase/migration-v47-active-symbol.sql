-- Migration v47: Add active_symbol_id to profiles for Kosh integration
-- Allows users to select an unlocked relic as their active spiritual symbol.

-- Removing the REFERENCES constraint as 'relics' is a frontend-managed config.
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS active_symbol_id TEXT;

COMMENT ON COLUMN public.profiles.active_symbol_id IS 'The ID of the sacred symbol (relic) currently active for the user profile.';
