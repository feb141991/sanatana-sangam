-- Reconstructed from production data (this migration was applied via the
-- Supabase MCP apply_migration tool without a corresponding local file being
-- written at the time -- a process gap caught during a later D32 review).
-- Content below matches the live observance_definitions rows exactly, pulled
-- directly from production.
--
-- 15 named Ekadashi rules in rules.json had no observance_definitions row at
-- all -- not a sourcing gap, a registration gap. Every review-queue/occurrence
-- row FKs against this table by slug, so this silently blocked these rules
-- from ever reaching the database in any form (Yogini, Vijaya, and 13 others),
-- regardless of whether they were otherwise ready to materialize.

INSERT INTO public.observance_definitions
  (slug, display_name, emoji, kind, tradition, route_kind, route_slug, active, is_shared, verification_type, description)
VALUES
  ('kamada-ekadashi', 'Kamada Ekadashi', '🌿', 'vrat', 'hindu', 'vrat', 'kamada-ekadashi', true, false, 'lunar_tithi', 'First Ekadashi of the Hindu New Year — fulfills all pure desires'),
  ('nirjala-ekadashi', 'Nirjala Ekadashi', '🌿', 'vrat', 'hindu', 'vrat', 'nirjala-ekadashi', true, false, 'lunar_tithi', 'Nirjala Ekadashi, the austere waterless Ekadashi fast dedicated to Lord Vishnu, observed according to capacity and sampradaya guidance.'),
  ('devshayani-ekadashi', 'Devshayani Ekadashi', '🌿', 'vrat', 'hindu', 'vrat', 'devshayani-ekadashi', true, false, 'lunar_tithi', 'Beginning of Lord Vishnu''s four-month cosmic slumber (Chaturmas)'),
  ('shravana-putrada-ekadashi', 'Putrada Ekadashi (Shravana)', '🌿', 'vrat', 'hindu', 'vrat', 'shravana-putrada-ekadashi', true, false, 'lunar_tithi', 'Shravana Ekadashi for progeny, family lineage, and prosperity'),
  ('parivartini-ekadashi', 'Parivartini Ekadashi', '🌿', 'vrat', 'hindu', 'vrat', 'parivartini-ekadashi', true, false, 'lunar_tithi', 'The day Lord Vishnu turns upon His side during Chaturmas slumber'),
  ('devutthana-ekadashi', 'Devutthana Ekadashi', '🌿', 'vrat', 'hindu', 'vrat', 'devutthana-ekadashi', true, false, 'lunar_tithi', 'Awakening of Lord Vishnu from cosmic sleep, marking the end of Chaturmas'),
  ('amalaki-ekadashi', 'Amalaki Ekadashi', '🌳', 'vrat', 'hindu', 'vrat', 'amalaki-ekadashi', true, false, 'lunar_tithi', 'Celebration of the sacred Amla tree as the abode of Lord Vishnu'),
  ('papmochani-ekadashi', 'Papmochani Ekadashi', '🌿', 'vrat', 'hindu', 'vrat', 'papmochani-ekadashi', true, false, 'lunar_tithi', 'The Ekadashi that liberates from accumulated sins'),
  ('apara-ekadashi', 'Apara Ekadashi', '🌿', 'vrat', 'hindu', 'vrat', 'apara-ekadashi', true, false, 'lunar_tithi', 'The Ekadashi granting limitless spiritual merit'),
  ('kamika-ekadashi', 'Kamika Ekadashi', '🌿', 'vrat', 'hindu', 'vrat', 'kamika-ekadashi', true, false, 'lunar_tithi', 'The Ekadashi that grants all desires and removes fear'),
  ('aja-ekadashi', 'Aja Ekadashi', '🌿', 'vrat', 'hindu', 'vrat', 'aja-ekadashi', true, false, 'lunar_tithi', 'The Ekadashi that destroys sins and restores lost glory'),
  ('rama-ekadashi', 'Rama Ekadashi', '🌿', 'vrat', 'hindu', 'vrat', 'rama-ekadashi', true, false, 'lunar_tithi', 'The Ekadashi named after Goddess Lakshmi granting prosperity'),
  ('utpanna-ekadashi', 'Utpanna Ekadashi', '🌿', 'vrat', 'hindu', 'vrat', 'utpanna-ekadashi', true, false, 'lunar_tithi', 'The Ekadashi commemorating the birth of Goddess Ekadashi'),
  ('saphala-ekadashi', 'Saphala Ekadashi', '🌿', 'vrat', 'hindu', 'vrat', 'saphala-ekadashi', true, false, 'lunar_tithi', 'The Ekadashi that makes all endeavors successful'),
  ('vijaya-ekadashi', 'Vijaya Ekadashi', '🌿', 'vrat', 'hindu', 'vrat', 'vijaya-ekadashi', true, false, 'lunar_tithi', 'The Ekadashi of absolute victory in all endeavors')
ON CONFLICT (slug) DO NOTHING;
