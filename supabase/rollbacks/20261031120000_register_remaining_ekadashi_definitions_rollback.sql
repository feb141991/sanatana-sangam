-- Rollback: remove the 7 candidate Ekadashi definitions added in 20261031120000

DELETE FROM public.observance_definitions
WHERE slug IN (
  'pausha-putrada-ekadashi',
  'shattila-ekadashi',
  'jaya-ekadashi',
  'varuthini-ekadashi',
  'mohini-ekadashi',
  'indira-ekadashi',
  'papankusha-ekadashi'
);

