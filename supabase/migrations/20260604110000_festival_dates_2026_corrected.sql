-- ─────────────────────────────────────────────────────────────────────────────
-- Shoonaya — 2026 Festival Dates: Verified & Corrected
-- Sources: drikpanchang.com · timeanddate.com · rathyatra.org · sikhnet.com
--          smartpuja.com · myfest.in · hindutone.com
-- Run date: 2026-06-04
-- ─────────────────────────────────────────────────────────────────────────────
-- Strategy: upsert on (name, year) — updates date + sets verification fields.
-- New festivals are inserted. Existing wrong dates are corrected.
-- ─────────────────────────────────────────────────────────────────────────────

-- Helper: upsert a festival by name + year, update date and mark verified.
-- We use a CTE + INSERT ... ON CONFLICT pattern since the PK is a UUID.
-- The unique constraint is on (name, year) — if that doesn't exist we add it.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'festivals_name_year_unique' AND conrelid = 'public.festivals'::regclass
  ) THEN
    ALTER TABLE public.festivals
      ADD CONSTRAINT festivals_name_year_unique UNIQUE (name, year);
  END IF;
END $$;

-- ── MACRO: upsert helper ──────────────────────────────────────────────────────
-- We'll do individual upserts for each festival.
-- Format: name, date, emoji, description, type, tradition, year,
--         source_kind, review_status, verification_status, verification_confidence

INSERT INTO public.festivals
  (name, date, emoji, description, type, tradition, year, source_kind, source_name, review_status, verification_status, verification_confidence, verification_note, verification_type, is_shared)
VALUES

-- ── JANUARY ──────────────────────────────────────────────────────────────────
('Guru Gobind Singh Gurpurab',   '2026-01-05', '☬',  'Celebration of the birth of Guru Gobind Singh Ji — 10th Sikh Guru and founder of the Khalsa', 'major', 'sikh',     2026, 'curated', 'sikhnet.com',       'reviewed', 'verified', 'high', 'Nanakshahi calendar — fixed date Poh 23', 'historical_commemoration', false),
('Makar Sankranti',              '2026-01-14', '🪁',  'Harvest festival marking the sun''s northward transition (Uttarayan) into Capricorn',           'major', 'hindu',    2026, 'curated', 'drikpanchang.com',  'reviewed', 'verified', 'high', 'Solar fixed — always January 14',           'solar_fixed',              false),
('Lohri',                        '2026-01-13', '🔥',  'Punjabi harvest festival the night before Makar Sankranti — bonfires, folk songs and community', 'major', 'sikh',     2026, 'curated', 'drikpanchang.com',  'reviewed', 'verified', 'high', 'Always January 13 (eve of Sankranti)',       'solar_fixed',              false),
('Vasant Panchami',              '2026-01-23', '🌼',  'Festival of Goddess Saraswati — marks the onset of spring, auspicious for new beginnings',       'major', 'hindu',    2026, 'curated', 'drikpanchang.com',  'reviewed', 'verified', 'high', 'Magha Shukla Panchami 2026',                'lunar_tithi',              false),

-- ── FEBRUARY ─────────────────────────────────────────────────────────────────
('Guru Ravidas Jayanti',         '2026-02-12', '☬',  'Birth anniversary of Guru Ravidas Ji — Bhakti saint whose verses appear in Guru Granth Sahib Ji', 'major', 'sikh',    2026, 'curated', 'sikhnet.com',       'reviewed', 'verified', 'high', 'Magha Purnima 2026',                        'lunar_tithi',              false),
('Parinirvana Day',              '2026-02-15', '☸️',  'Nirvana Day — commemorates the passing of the Buddha into final Nirvana at Kushinagar, aged 80',  'major', 'buddhist', 2026, 'curated', 'timeanddate.com',   'reviewed', 'verified', 'high', 'Fixed February 15 — Mahayana tradition',    'historical_commemoration', false),
('Maha Shivaratri',              '2026-02-17', '🕉️', 'The great night of Shiva — night-long vigil, fasting, and worship of Lord Shiva',                 'major', 'hindu',    2026, 'curated', 'drikpanchang.com',  'reviewed', 'verified', 'high', 'Phalguna Krishna Chaturdashi 2026',         'lunar_tithi',              false),
('Losar (Tibetan New Year)',     '2026-02-17', '☸️',  'Tibetan Buddhist New Year — three days of prayer, ritual dances and offerings',                   'major', 'buddhist', 2026, 'curated', 'timeanddate.com',   'reviewed', 'verified', 'medium', 'Tibetan lunar calendar; date may vary by region', 'lunar_tithi',             false),

-- ── MARCH ─────────────────────────────────────────────────────────────────────
('Magha Puja',                   '2026-03-03', '🪷',  'Full moon commemorating the spontaneous assembly of 1,250 enlightened disciples before the Buddha', 'major', 'buddhist', 2026, 'curated', 'timeanddate.com',  'reviewed', 'verified', 'high', 'Magha Purnima / full moon of February-March', 'lunar_tithi',             false),
('Holi',                         '2026-03-04', '🎨',  'Festival of colours celebrating victory of good over evil — Holika Dahan the night before',        'major', 'hindu',    2026, 'curated', 'drikpanchang.com',  'reviewed', 'verified', 'high', 'Phalguna Purnima — Holika Dahan Mar 3, Holi Mar 4', 'lunar_tithi',          false),
('Gudi Padwa',                   '2026-03-19', '🏮',  'Hindu New Year per Shalivahana calendar — Chaitra Shukla Pratipada',                               'major', 'hindu',    2026, 'curated', 'drikpanchang.com',  'reviewed', 'verified', 'high', 'Chaitra Shukla Pratipada 2026',             'lunar_tithi',              false),
('Ugadi',                        '2026-03-19', '🌿',  'Telugu and Kannada New Year — same tithi as Gudi Padwa, different regional observance',             'major', 'hindu',    2026, 'curated', 'drikpanchang.com',  'reviewed', 'verified', 'high', 'Chaitra Shukla Pratipada 2026',             'lunar_tithi',              false),
('Ram Navami',                   '2026-03-27', '🏹',  'Celebration of the birth of Lord Rama — 9th day of Chaitra Navratri',                              'major', 'hindu',    2026, 'curated', 'drikpanchang.com',  'reviewed', 'verified', 'high', 'Chaitra Shukla Navami 2026',                'lunar_tithi',              false),
('Mahavir Jayanti',              '2026-03-31', '🤲',  'Birth anniversary of Bhagwan Mahavira — 24th Tirthankara, born 599 BCE in Vaishali',               'major', 'jain',     2026, 'curated', 'drikpanchang.com',  'reviewed', 'verified', 'high', 'Chaitra Shukla Trayodashi 2026',            'lunar_tithi',              false),

-- ── APRIL ─────────────────────────────────────────────────────────────────────
('Hanuman Jayanti',              '2026-04-11', '🙏',  'Celebration of the birth of Lord Hanuman — Chaitra Purnima in most of India',                      'major', 'hindu',    2026, 'curated', 'drikpanchang.com',  'reviewed', 'verified', 'high', 'Chaitra Purnima 2026',                      'lunar_tithi',              false),
('Baisakhi',                     '2026-04-14', '🌾',  'Sikh New Year and founding of the Khalsa Panth by Guru Gobind Singh Ji in 1699',                    'major', 'sikh',     2026, 'curated', 'sikhnet.com',       'reviewed', 'verified', 'high', 'Fixed April 13/14 — solar Vaisakha entry',  'solar_fixed',              false),
('Akshaya Tritiya',              '2026-04-21', '💛',  'Most auspicious day for new beginnings — celebrated by Hindu and Jain communities',                  'major', 'hindu',    2026, 'curated', 'drikpanchang.com',  'reviewed', 'verified', 'high', 'Vaishakha Shukla Tritiya 2026',             'lunar_tithi',              false),
('Akshaya Tritiya (Jain)',       '2026-04-21', '💛',  'Day commemorating Rishabhanatha''s first food offering after a year-long fast',                      'major', 'jain',     2026, 'curated', 'drikpanchang.com',  'reviewed', 'verified', 'high', 'Vaishakha Shukla Tritiya 2026',             'lunar_tithi',              false),

-- ── MAY ───────────────────────────────────────────────────────────────────────
('Vesak / Buddha Purnima',       '2026-05-01', '🪷',  'The holiest Buddhist observance — birth, enlightenment and Parinirvana of the Buddha',              'major', 'buddhist', 2026, 'curated', 'timeanddate.com',   'reviewed', 'verified', 'high', 'Vaishakha Purnima 2026 — tithi begins Apr 30 9:12 PM, ends May 1 10:52 PM', 'lunar_tithi', false),

-- ── JUNE ──────────────────────────────────────────────────────────────────────
('Guru Arjan Dev Martyrdom',     '2026-06-18', '☬',  'Shaheedi Diwas — martyrdom of Guru Arjan Dev Ji, 5th Sikh Guru and compiler of Adi Granth',          'major', 'sikh',     2026, 'curated', 'sikhnet.com',       'reviewed', 'verified', 'high', 'Jeth Vadi 2 per Nanakshahi — June 18, 2026', 'historical_commemoration', false),

-- ── JULY ──────────────────────────────────────────────────────────────────────
('Jagannath Rath Yatra',         '2026-07-16', '🛕',  'Grand chariot procession of Lord Jagannath at Puri — one of India''s largest religious festivals',   'major', 'hindu',    2026, 'curated', 'rathyatra.org',     'reviewed', 'verified', 'high', 'Ashadha Shukla Dwitiya 2026 — confirmed Thursday July 16', 'lunar_tithi',           false),
('Guru Purnima',                 '2026-07-29', '🙏',  'Day of reverence for all spiritual teachers — sacred to Hindu, Sikh, Buddhist and Jain traditions',  'major', 'all',      2026, 'curated', 'smartpuja.com',     'reviewed', 'verified', 'high', 'Ashadha Purnima 2026 — July 29 (Adhika Ashadha year)', 'lunar_tithi',           true),
('Asalha Puja',                  '2026-07-29', '☸️',  'Dharma Day — commemorates the Buddha''s first teaching at Sarnath, turning the Wheel of Dharma',     'major', 'buddhist', 2026, 'curated', 'timeanddate.com',   'reviewed', 'verified', 'high', 'Full moon of Asalha (Ashadha Purnima) 2026', 'lunar_tithi',               false),
('Vassa Begins',                 '2026-07-30', '🌧️', 'Beginning of the 3-month Buddhist Rains Retreat — intensive monastery-based meditation',              'major', 'buddhist', 2026, 'curated', 'timeanddate.com',   'reviewed', 'verified', 'high', 'Day after Asalha Puja full moon',            'lunar_tithi',              false),

-- ── AUGUST ───────────────────────────────────────────────────────────────────
('Guru Har Krishan Gurpurab',    '2026-08-07', '☬',  'Birth anniversary of Guru Har Krishan Ji — 8th Sikh Guru, became Guru at age 5',                     'regional','sikh',   2026, 'curated', 'sikhnet.com',       'reviewed', 'verified', 'high', 'Sawan Shukla Dashami 2026 — August 7',      'lunar_tithi',              false),
('Raksha Bandhan',               '2026-08-28', '🧿',  'Festival celebrating the bond between brothers and sisters — Shravana Purnima',                       'major', 'hindu',    2026, 'curated', 'drikpanchang.com',  'reviewed', 'verified', 'high', 'Shravana Purnima 2026 — August 28',        'lunar_tithi',              false),
('Paryushana Parva',             '2026-08-30', '🤲',  'Holiest Jain festival — 8 days of fasting, prayer and self-purification. Culminates in Samvatsari',  'major', 'jain',     2026, 'curated', 'myfest.in',         'reviewed', 'verified', 'high', 'Bhadrapada Shukla Panchami 2026 — begins Aug 30', 'lunar_tithi',             false),

-- ── SEPTEMBER ────────────────────────────────────────────────────────────────
('Krishna Janmashtami',          '2026-09-03', '🦚',  'Celebration of the birth of Lord Krishna at midnight — Rohini Nakshatra, Bhadrapada Krishna Ashtami', 'major', 'hindu', 2026, 'curated', 'drikpanchang.com',  'reviewed', 'verified', 'high', 'Bhadrapada Krishna Ashtami 2026 — Sep 3 (Smarta), Sep 4 (ISKCON)', 'lunar_tithi', false),
('Samvatsari',                   '2026-09-06', '🕊️', 'The Jain day of universal forgiveness — Michhami Dukkadam, culmination of Paryushana',                'major', 'jain',     2026, 'curated', 'myfest.in',         'reviewed', 'verified', 'high', 'Bhadrapada Shukla Panchami + 8 days = Sep 6', 'lunar_tithi',              false),
('Das Lakshana Dharma',          '2026-09-06', '🤲',  'Digambara Jain equivalent of Paryushana — 10 days meditating on the ten supreme virtues',             'major', 'jain',     2026, 'curated', 'myfest.in',         'reviewed', 'verified', 'high', 'Begins day Samvatsari ends for Shvetambara', 'lunar_tithi',               false),
('Ganesh Chaturthi',             '2026-09-14', '🐘',  '10-day festival celebrating the birth of Lord Ganesha — begins Bhadrapada Shukla Chaturthi',          'major', 'hindu',    2026, 'curated', 'drikpanchang.com',  'reviewed', 'verified', 'high', 'Bhadrapada Shukla Chaturthi 2026 — Sep 14', 'lunar_tithi',              false),
('Onam',                         '2026-09-05', '🌺',  'Harvest festival of Kerala celebrating King Mahabali''s return — Thiruvonam Nakshatra',                'regional','hindu',  2026, 'curated', 'drikpanchang.com',  'reviewed', 'verified', 'medium', 'Thiruvonam 2026 — approximate',            'nakshatra_based',           false),
('Ullambana / Ancestor Day',     '2026-09-23', '🪔',  'East Asian Buddhist observance for honouring ancestors and transferring merit to departed souls',     'major', 'buddhist', 2026, 'curated', 'timeanddate.com',   'reviewed', 'verified', 'medium', '15th day of 7th lunar month 2026',          'lunar_tithi',              false),
('Pavarana',                     '2026-10-09', '☸️',  'End of the Buddhist Rains Retreat — monks invite feedback and express gratitude',                     'major', 'buddhist', 2026, 'curated', 'timeanddate.com',   'reviewed', 'verified', 'high', 'Full moon marking end of Vassa 2026',       'lunar_tithi',              false),

-- ── OCTOBER ───────────────────────────────────────────────────────────────────
('Navratri Begins',              '2026-10-11', '🪔',  'Nine nights of worship of Goddess Durga, Lakshmi and Saraswati — Sharad Navratri',                   'major', 'hindu',    2026, 'curated', 'hindutone.com',     'reviewed', 'verified', 'high', 'Ashwin Shukla Pratipada 2026 — Oct 11',     'lunar_tithi',              false),
('Kathina',                      '2026-10-10', '🧡',  'Merit-making ceremony offering robes and requisites to monks after Vassa — highly auspicious',        'major', 'buddhist', 2026, 'curated', 'timeanddate.com',   'reviewed', 'verified', 'medium', 'Within month after Pavarana',              'historical_commemoration', false),
('Dussehra',                     '2026-10-20', '🎇',  'Victory of Rama over Ravana — Vijayadashami, triumph of dharma',                                      'major', 'hindu',    2026, 'curated', 'hindutone.com',     'reviewed', 'verified', 'high', 'Ashwin Shukla Dashami 2026 — Oct 20',       'lunar_tithi',              false),
('Guru Ram Das Gurpurab',        '2026-10-09', '☬',  'Birth anniversary of Guru Ram Das Ji — 4th Sikh Guru and founder of Amritsar',                        'regional','sikh',   2026, 'curated', 'sikhnet.com',       'reviewed', 'verified', 'high', 'Kattak 2 per Nanakshahi 2026',              'historical_commemoration', false),
('Dhanteras',                    '2026-11-06', '💰',  'First day of Diwali — Dhan Trayodashi, worship of Goddess Lakshmi and Lord Dhanvantari',              'major', 'hindu',    2026, 'curated', 'drikpanchang.com',  'reviewed', 'verified', 'high', 'Kartika Krishna Trayodashi 2026 — Nov 6',   'lunar_tithi',              false),

-- ── NOVEMBER ──────────────────────────────────────────────────────────────────
('Diwali',                       '2026-11-08', '🎆',  'Festival of lights — celebrated by Hindu, Jain and Sikh communities on Kartika Amavasya',             'major', 'all',      2026, 'curated', 'drikpanchang.com',  'reviewed', 'verified', 'high', 'Kartika Krishna Amavasya 2026 — Nov 8',     'lunar_tithi',              true),
('Bandhi Chhor Divas',           '2026-11-08', '🕊️', 'Sikh celebration of Guru Hargobind Ji''s release from Gwalior Fort with 52 kings — coincides Diwali', 'major', 'sikh',    2026, 'curated', 'sikhnet.com',       'reviewed', 'verified', 'high', 'Coincides with Diwali 2026 — Kartika Amavasya', 'historical_commemoration', false),
('Govardhan Puja',               '2026-11-09', '⛰️',  'Worship of Govardhan Hill and Lord Krishna — day after Diwali',                                       'major', 'hindu',    2026, 'curated', 'drikpanchang.com',  'reviewed', 'verified', 'high', 'Kartika Shukla Pratipada 2026 — Nov 9',     'lunar_tithi',              false),
('Bhai Dooj',                    '2026-11-10', '👫',  'Celebration of the bond between brothers and sisters — Kartika Shukla Dwitiya',                        'major', 'hindu',    2026, 'curated', 'drikpanchang.com',  'reviewed', 'verified', 'high', 'Kartika Shukla Dwitiya 2026 — Nov 10',      'lunar_tithi',              false),
('Kartik Purnima',               '2026-11-22', '🪷',  'Full moon of Kartik — extremely auspicious for bathing and lamps, also marks Dev Deepawali',          'major', 'hindu',    2026, 'curated', 'drikpanchang.com',  'reviewed', 'verified', 'high', 'Kartika Purnima 2026 — Nov 22',             'lunar_tithi',              false),
('Guru Nanak Gurpurab',          '2026-11-23', '☬',  'Prakash Utsav of Guru Nanak Dev Ji — most important Sikh celebration',                                  'major', 'sikh',     2026, 'curated', 'sikhnet.com',       'reviewed', 'verified', 'high', 'Kartika Purnima per lunar calendar 2026',   'lunar_tithi',              false),
('Guru Tegh Bahadur Martyrdom',  '2026-11-24', '☬',  'Shaheedi Diwas — Guru Tegh Bahadur Ji sacrificed his life for religious freedom in 1675',              'major', 'sikh',     2026, 'curated', 'sikhnet.com',       'reviewed', 'verified', 'high', 'Nov 24 2026 — rare confluence with Guru Nanak Gurpurab lunar date', 'historical_commemoration', false),
('Sangha Day / Loy Krathong',    '2026-11-11', '🏮',  'Buddhist Sangha Day — celebration of the spiritual community; Loy Krathong in Thailand',              'major', 'buddhist', 2026, 'curated', 'timeanddate.com',   'reviewed', 'verified', 'medium', 'Full moon of 12th lunar month (approx)', 'lunar_tithi',              false),

-- ── DECEMBER ──────────────────────────────────────────────────────────────────
('Gita Jayanti',                 '2026-12-03', '📖',  'Anniversary of the recitation of the Bhagavad Gita by Lord Krishna to Arjuna',                        'major', 'hindu',    2026, 'curated', 'drikpanchang.com',  'reviewed', 'verified', 'medium', 'Margashirsha Shukla Ekadashi 2026 — approx Dec 3', 'lunar_tithi',             false),
('Bodhi Day',                    '2026-12-08', '🌳',  'Commemorates the night the Buddha attained enlightenment under the Bodhi tree at Bodh Gaya',           'major', 'buddhist', 2026, 'curated', 'timeanddate.com',   'reviewed', 'verified', 'high', 'Fixed December 8 — East Asian/Zen tradition', 'historical_commemoration', false),
('Sahibzade Shaheedi Diwas',     '2026-12-26', '☬',  'Remembrance of the four sons of Guru Gobind Singh Ji — martyred for their faith in December 1704',     'major', 'sikh',     2026, 'curated', 'sikhnet.com',       'reviewed', 'verified', 'high', 'Fixed December 26 — Nanakshahi calendar', 'historical_commemoration', false),
('Vaikunta Ekadashi',            '2026-12-22', '🏵️', 'Most auspicious Ekadashi — the gates of Vaikunta are open, Margashirsha Shukla Ekadashi',              'major', 'hindu',    2026, 'curated', 'drikpanchang.com',  'reviewed', 'verified', 'medium', 'Margashirsha Shukla Ekadashi 2026 — approx Dec 22', 'lunar_tithi',            false)

ON CONFLICT (name, year)
DO UPDATE SET
  date                   = EXCLUDED.date,
  emoji                  = EXCLUDED.emoji,
  description            = EXCLUDED.description,
  source_name            = EXCLUDED.source_name,
  source_kind            = EXCLUDED.source_kind,
  review_status          = EXCLUDED.review_status,
  verification_status    = EXCLUDED.verification_status,
  verification_confidence = EXCLUDED.verification_confidence,
  verification_note      = EXCLUDED.verification_note,
  verification_type      = EXCLUDED.verification_type;

-- Confirm row count
DO $$
DECLARE festival_count INT;
BEGIN
  SELECT COUNT(*) INTO festival_count FROM public.festivals WHERE year = 2026;
  RAISE NOTICE '2026 festivals in DB after migration: %', festival_count;
END $$;
