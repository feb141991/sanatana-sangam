-- Explicit controls for practice-history personalization and the optional
-- Sankalpa midpoint reminder. Both default off; no existing user is opted in
-- by inference from past activity or from creating a Sankalpa.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS consent_activity_personalization boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS wants_sankalpa_midpoint_reminders boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.consent_activity_personalization IS
  'Whether recent practice activity may be used to rank personalized recommendations. Separate from tradition/profile personalization consent.';

COMMENT ON COLUMN public.profiles.wants_sankalpa_midpoint_reminders IS
  'Explicit opt-in to one generic notification at the midpoint of an active Sankalpa. Does not include the user-written Sankalpa text.';
