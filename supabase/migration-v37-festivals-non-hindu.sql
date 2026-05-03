-- ─────────────────────────────────────────────────────────────────────────────
-- migration-v37-festivals-non-hindu.sql
-- Fills out the 2026 festival calendar for Sikh, Buddhist and Jain traditions.
-- Previously only 7 Sikh / 6 Buddhist / 5 Jain entries existed; this brings
-- each tradition to proper coverage.
--
-- Run in Supabase SQL editor. Safe to run multiple times (ON CONFLICT DO NOTHING).
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO festivals (name, date, emoji, description, type, tradition, source_kind, review_status)
VALUES

-- ── Sikh (additions) ─────────────────────────────────────────────────────────
('Guru Ravidas Jayanti',
 '2026-02-12', '☬',
 'Birth anniversary of Guru Ravidas Ji — saint-poet whose verses appear in the Guru Granth Sahib',
 'major', 'sikh', 'curated', 'reviewed'),

('Holla Mohalla',
 '2026-03-04', '🏹',
 'Sikh martial festival initiated by Guru Gobind Singh Ji — mock battles, poetry, music and langar at Anandpur Sahib',
 'major', 'sikh', 'curated', 'reviewed'),

('Guru Amar Das Gurpurab',
 '2026-05-23', '☬',
 'Birth anniversary of Guru Amar Das Ji — 3rd Sikh Guru who abolished purdah and caste discrimination',
 'regional', 'sikh', 'curated', 'reviewed'),

('Guru Har Krishan Gurpurab',
 '2026-07-07', '☬',
 'Birth anniversary of Guru Har Krishan Ji — 8th Sikh Guru who became Guru at age 5',
 'regional', 'sikh', 'curated', 'reviewed'),

('Guru Ram Das Gurpurab',
 '2026-10-09', '☬',
 'Birth anniversary of Guru Ram Das Ji — 4th Sikh Guru and founder of Amritsar',
 'regional', 'sikh', 'curated', 'reviewed'),

('Sahibzade Shaheedi Diwas',
 '2026-12-26', '☬',
 'Remembrance of the four Sahibzade — sons of Guru Gobind Singh Ji martyred for their faith in December 1704',
 'major', 'sikh', 'curated', 'reviewed'),

-- ── Buddhist (additions) ──────────────────────────────────────────────────────
('Parinirvana Day',
 '2026-02-15', '☸️',
 'Nirvana Day — commemorates the passing of the Buddha into final Nirvana at Kushinagar. A day for meditation and reflection on impermanence.',
 'major', 'buddhist', 'curated', 'reviewed'),

('Ullambana (Ancestor Day)',
 '2026-08-31', '🪔',
 'East Asian Buddhist observance for honouring ancestors and transferring merit to departed souls — 15th day of the 7th lunar month',
 'major', 'buddhist', 'curated', 'reviewed'),

('Pavarana (End of Vassa)',
 '2026-10-09', '☸️',
 'End of the three-month Rains Retreat — monks invite feedback from the community and express gratitude for the retreat period',
 'major', 'buddhist', 'curated', 'reviewed'),

('Sangha Day (Loy Krathong)',
 '2026-11-11', '🏮',
 'Buddhist Sangha Day — celebration of the spiritual community. Coincides with Loy Krathong in Thailand, where lotus-shaped lanterns are floated on water.',
 'major', 'buddhist', 'curated', 'reviewed'),

('Bodhi Day',
 '2026-12-08', '🌳',
 'Commemorates the night the Buddha attained enlightenment under the Bodhi tree at Bodh Gaya — observed with meditation, chanting and study',
 'major', 'buddhist', 'curated', 'reviewed'),

-- ── Jain (additions) ─────────────────────────────────────────────────────────
('Akshaya Tritiya (Jain)',
 '2026-04-21', '💛',
 'Akshaya Tritiya — Jains celebrate Bhagwan Rishabhanatha''s first ahimsa-based food offering (sugarcane juice) after a year of fasting',
 'major', 'jain', 'curated', 'reviewed'),

('Das Lakshana Dharma begins',
 '2026-09-05', '🤲',
 'Digambara Jain equivalent of Paryushana — 10 days of meditation on the ten supreme virtues: forgiveness, humility, honesty, purity, truth, restraint, austerity, renunciation, non-attachment and celibacy',
 'major', 'jain', 'curated', 'reviewed'),

('Jain New Year (Pratipada)',
 '2026-10-30', '🤲',
 'Jain New Year — the day after Diwali marks the beginning of the Jain calendar year, following the Nirvana of Bhagwan Mahavira',
 'major', 'jain', 'curated', 'reviewed')

ON CONFLICT (name, date) DO NOTHING;

-- ── Verify coverage ───────────────────────────────────────────────────────────
-- SELECT tradition, count(*) FROM festivals
-- WHERE date >= '2026-01-01' AND date <= '2026-12-31'
-- GROUP BY tradition ORDER BY tradition;
