-- Add sadhana highlights visibility toggle to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS show_sadhana_highlights BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.show_sadhana_highlights IS
  'When true, this user''s sadhana highlights (beads, streak, shields) are visible on their public profile.';
