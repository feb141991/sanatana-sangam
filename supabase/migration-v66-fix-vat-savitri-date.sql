-- ─────────────────────────────────────────────────────────────────────────────
-- Migration v66 — Fix Vat Savitri Vrat date + add Purnima regional variant
-- ─────────────────────────────────────────────────────────────────────────────
--
-- Bug: Vat Savitri Vrat was stored as 2026-05-22 (Jyeshtha Shukla Tritiya).
-- Correct date: 2026-05-16 — Jyeshtha Krishna Amavasya (new moon of Jyeshtha),
-- the traditional observance date for North India.
--
-- Additionally: Maharashtra, Gujarat, and Karnataka observe on Jyeshtha Shukla
-- Purnima (full moon) = 2026-05-31. This regional variant was missing entirely.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Fix the wrong date on the existing North India entry
UPDATE festivals
SET
  date        = '2026-05-16',
  description = 'Vrat observed by married women for the well-being of their husbands (Jyeshtha Amavasya — North India)'
WHERE name = 'Vat Savitri Vrat'
  AND date = '2026-05-22';

-- 2. Insert the Maharashtra / Gujarat / Karnataka Purnima variant
--    Use INSERT ... ON CONFLICT to make the migration safe to re-run
INSERT INTO festivals (name, date, emoji, description, type, tradition, year)
VALUES (
  'Vat Savitri Purnima',
  '2026-05-31',
  '🌳',
  'Vrat observed by married women for the well-being of their husbands (Jyeshtha Purnima — Maharashtra, Gujarat, Karnataka)',
  'vrat',
  'hindu',
  2026
)
ON CONFLICT (name, date) DO NOTHING;
