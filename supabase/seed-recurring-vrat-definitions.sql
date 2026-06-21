-- Seed: recurring tithi-based vrat definitions (Gate B of recurring-vrats feature).
--
-- NOT auto-applied. Review + run manually against the target Supabase project
-- BEFORE running the materialize commit pass. Idempotent.
--
-- Slugs MUST match the rule slugs in src/lib/calendar/rules.ts
-- (rule_family = 'lunar_tithi_recurring'), because materialize.ts maps
-- occurrences to definitions by slug.
--
-- guarantee_level is intentionally left at the conservative default
-- ('manual_review_required') until the generated Ekadashi/Pradosh/Sankashti
-- dates are review-signed-off (smarta/vaishnava Ekadashi day-selection nuance
-- is not yet pinned). Assumes a UNIQUE constraint on slug — verify before run.

INSERT INTO public.observance_definitions
  (slug, display_name, kind, tradition, verification_type, calendar_rule_type, route_kind, route_slug, emoji, description, active)
VALUES
  ('ekadashi', 'Ekadashi', 'vrat', 'hindu', 'lunar_tithi', 'lunar_tithi_recurring', 'vrat', 'ekadashi', '🌙',
   'Fortnightly Ekadashi vrat — the 11th tithi of both the waxing and waning moon, a day of fasting for Vishnu.', true),
  ('pradosh-vrat', 'Pradosh Vrat', 'vrat', 'hindu', 'lunar_tithi', 'lunar_tithi_recurring', 'vrat', 'pradosh', '🪔',
   'Fortnightly Pradosh vrat to Lord Shiva — the 13th tithi of both pakshas, observed in the twilight hour.', true),
  ('sankashti-chaturthi', 'Sankashti Chaturthi', 'vrat', 'hindu', 'lunar_tithi', 'lunar_tithi_recurring', 'vrat', 'sankashti-chaturthi', '🐘',
   'Monthly Sankashti Chaturthi vrat to Lord Ganesha — the 4th tithi of the waning moon.', true)
ON CONFLICT (slug) DO NOTHING;
