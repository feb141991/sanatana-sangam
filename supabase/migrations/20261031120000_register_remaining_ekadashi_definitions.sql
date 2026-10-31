-- Register remaining 7 named Ekadashi definitions to ensure foreign-key integrity
-- and canonical route mapping across observance tables.
-- Definitions are registered with active=true, route_kind='vrat', route_slug matching slug.

INSERT INTO public.observance_definitions
  (slug, display_name, emoji, kind, tradition, route_kind, route_slug, active, is_shared, verification_type, description)
VALUES
  ('pausha-putrada-ekadashi', 'Putrada Ekadashi (Pausha)', '🌿', 'vrat', 'hindu', 'vrat', 'pausha-putrada-ekadashi', true, false, 'lunar_tithi', 'Pausha Ekadashi for progeny, family lineage, and prosperity'),
  ('shattila-ekadashi', 'Shattila Ekadashi', '🌿', 'vrat', 'hindu', 'vrat', 'shattila-ekadashi', true, false, 'lunar_tithi', 'The Ekadashi of six-fold sesame offerings purifying past sins'),
  ('jaya-ekadashi', 'Jaya Ekadashi', '🌿', 'vrat', 'hindu', 'vrat', 'jaya-ekadashi', true, false, 'lunar_tithi', 'The Ekadashi of spiritual victory and liberation from ghostly forms'),
  ('varuthini-ekadashi', 'Varuthini Ekadashi', '🌿', 'vrat', 'hindu', 'vrat', 'varuthini-ekadashi', true, false, 'lunar_tithi', 'The Ekadashi granting divine protection and immense spiritual merit'),
  ('mohini-ekadashi', 'Mohini Ekadashi', '🌿', 'vrat', 'hindu', 'vrat', 'mohini-ekadashi', true, false, 'lunar_tithi', 'The Ekadashi commemorating the Mohini avatar destroying worldly illusion'),
  ('indira-ekadashi', 'Indira Ekadashi', '🌿', 'vrat', 'hindu', 'vrat', 'indira-ekadashi', true, false, 'lunar_tithi', 'The Ekadashi of ancestral liberation observed during Pitru Paksha'),
  ('papankusha-ekadashi', 'Papankusha Ekadashi', '🌿', 'vrat', 'hindu', 'vrat', 'papankusha-ekadashi', true, false, 'lunar_tithi', 'The Ekadashi that acts as a goad to rein in accumulated sins')
ON CONFLICT (slug) DO NOTHING;

