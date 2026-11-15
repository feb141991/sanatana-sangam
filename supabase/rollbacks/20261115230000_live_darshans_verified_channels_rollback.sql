-- Rollback: Seed verified official YouTube channel IDs for major live darshans across all traditions
-- Timestamp: 20261115230000

DELETE FROM public.live_darshans
WHERE id IN (
  'mahakaleshwar-ujjain',
  'tirupati-balaji',
  'ayodhya-ram-mandir',
  'bangla-sahib-delhi',
  'sis-ganj-sahib-delhi',
  'jinvani-tv-live',
  'paras-jain-tv',
  'plum-village-france',
  'vaishno-devi-katra'
);
