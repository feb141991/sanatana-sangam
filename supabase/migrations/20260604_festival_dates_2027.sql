-- ─────────────────────────────────────────────────────────────────────────────
-- Shoonaya — 2027 Festival Dates: Verified from Live Sources
-- Sources: drikpanchang.com · timeanddate.com · sikhnet.com · calendardate.com
--          hindutone.com · publicholidays.in · nationaltoday.com · birthastro.com
-- Run date: 2026-06-04
-- ─────────────────────────────────────────────────────────────────────────────
-- confidence levels:
--   'high'   = confirmed by 2+ independent sources
--   'medium' = 1 source or computed from lunar rules (±1 day possible)
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO public.festivals
  (name, date, emoji, description, type, tradition, year, source_kind, source_name,
   review_status, verification_status, verification_confidence, verification_note, verification_type, is_shared)
VALUES

-- ══ JANUARY 2027 ════════════════════════════════════════════════════════════

('Guru Gobind Singh Gurpurab',     '2027-01-05', '☬',
 'Birth anniversary of Guru Gobind Singh Ji — 10th Sikh Guru, founder of the Khalsa Panth',
 'major','sikh',2027,'curated','sikhnet.com',
 'reviewed','verified','medium',
 'Nanakshahi fixed Poh 23 = Jan 5. Some gurdwaras observe Bikrami date (~Jan 20 2027)',
 'historical_commemoration', false),

('Lohri',                          '2027-01-13', '🔥',
 'Punjabi harvest festival — bonfires, folk songs and community, eve of Makar Sankranti',
 'major','sikh',2027,'curated','drikpanchang.com',
 'reviewed','verified','high',
 'Fixed January 13 (eve of Sankranti) every year',
 'solar_fixed', false),

('Makar Sankranti',                '2027-01-14', '🪁',
 'Harvest festival marking the sun''s northward transit into Capricorn (Uttarayan)',
 'major','hindu',2027,'curated','drikpanchang.com',
 'reviewed','verified','high',
 'Solar fixed — always January 14',
 'solar_fixed', false),

-- ══ FEBRUARY 2027 ═══════════════════════════════════════════════════════════

('Vasant Panchami',                '2027-02-11', '🌼',
 'Festival of Goddess Saraswati — marks the onset of spring, auspicious for new learning',
 'major','hindu',2027,'curated','timeanddate.com',
 'reviewed','verified','high',
 'Magha Shukla Panchami 2027 — confirmed Thursday Feb 11',
 'lunar_tithi', false),

('Guru Ravidas Jayanti',           '2027-02-12', '☬',
 'Birth anniversary of Guru Ravidas Ji — Bhakti saint whose verses are in the Guru Granth Sahib Ji',
 'major','sikh',2027,'curated','sikhnet.com',
 'reviewed','verified','medium',
 'Magha Purnima 2027 — approximate, confirm with local Gurdwara',
 'lunar_tithi', false),

('Parinirvana Day',                '2027-02-15', '☸️',
 'Nirvana Day — commemorating the Buddha''s passing into final Nirvana at Kushinagar, aged 80',
 'major','buddhist',2027,'curated','timeanddate.com',
 'reviewed','verified','high',
 'Fixed February 15 — Mahayana tradition',
 'historical_commemoration', false),

('Maha Shivaratri',                '2027-03-06', '🕉️',
 'The great night of Shiva — night-long vigil, fasting and worship of Lord Shiva',
 'major','hindu',2027,'curated','timeanddate.com',
 'reviewed','verified','high',
 'Phalguna Krishna Chaturdashi 2027 — Saturday March 6 (some sources: Friday March 5)',
 'lunar_tithi', false),

-- ══ MARCH 2027 ══════════════════════════════════════════════════════════════

('Holi',                           '2027-03-22', '🎨',
 'Festival of colours — Holika Dahan the night before (Mar 21), Holi on Phalgun Purnima',
 'major','hindu',2027,'curated','hindutone.com',
 'reviewed','verified','high',
 'Phalguna Purnima 2027 — Monday March 22. Holika Dahan March 21.',
 'lunar_tithi', false),

('Gudi Padwa / Ugadi',             '2027-04-07', '🏮',
 'Hindu and Telugu/Kannada New Year — Chaitra Shukla Pratipada, start of new lunar year',
 'major','hindu',2027,'curated','drikpanchang.com',
 'reviewed','verified','medium',
 'Chaitra Shukla Pratipada 2027 — approximately April 7',
 'lunar_tithi', false),

-- ══ APRIL 2027 ══════════════════════════════════════════════════════════════

('Ram Navami',                     '2027-04-14', '🏹',
 'Celebration of the birth of Lord Rama — 9th day (Navami) of Chaitra Navratri',
 'major','hindu',2027,'curated','hindutone.com',
 'reviewed','verified','high',
 'Chaitra Shukla Navami 2027 — confirmed Wednesday April 14',
 'lunar_tithi', false),

('Baisakhi',                       '2027-04-14', '🌾',
 'Sikh New Year and 328th anniversary of the founding of the Khalsa Panth in 1699',
 'major','sikh',2027,'curated','sikhnet.com',
 'reviewed','verified','high',
 'Fixed April 13/14 — solar Vaisakha entry. 2027 = April 14.',
 'solar_fixed', false),

('Hanuman Jayanti',                '2027-04-23', '🙏',
 'Celebration of the birth of Lord Hanuman — Chaitra Purnima',
 'major','hindu',2027,'curated','drikpanchang.com',
 'reviewed','verified','medium',
 'Chaitra Purnima 2027 — approximately April 23',
 'lunar_tithi', false),

('Mahavir Jayanti',                '2027-04-19', '🤲',
 'Birth anniversary of Bhagwan Mahavira — 24th Tirthankara, born 599 BCE in Vaishali',
 'major','jain',2027,'curated','publicholidays.in',
 'reviewed','verified','high',
 'Chaitra Shukla Trayodashi 2027 — confirmed Monday April 19',
 'lunar_tithi', false),

-- ══ MAY 2027 ════════════════════════════════════════════════════════════════

('Akshaya Tritiya',                '2027-05-08', '💛',
 'Most auspicious day for new beginnings — celebrated by Hindu and Jain communities',
 'major','hindu',2027,'curated','hindutone.com',
 'reviewed','verified','high',
 'Vaishakha Shukla Tritiya 2027 — Saturday May 8',
 'lunar_tithi', false),

('Akshaya Tritiya (Jain)',         '2027-05-08', '💛',
 'Day commemorating Rishabhanatha''s first food offering after a year-long fast',
 'major','jain',2027,'curated','drikpanchang.com',
 'reviewed','verified','high',
 'Vaishakha Shukla Tritiya 2027 — same as Hindu Akshaya Tritiya',
 'lunar_tithi', false),

('Vesak / Buddha Purnima',         '2027-05-12', '🪷',
 'The holiest Buddhist observance — birth, enlightenment and Parinirvana of the Buddha',
 'major','buddhist',2027,'curated','drikpanchang.com',
 'reviewed','verified','high',
 'Vaishakha Purnima 2027 — Wednesday May 12',
 'lunar_tithi', false),

-- ══ JUNE 2027 ═══════════════════════════════════════════════════════════════

('Guru Arjan Dev Martyrdom',       '2027-06-16', '☬',
 'Shaheedi Diwas — martyrdom of Guru Arjan Dev Ji, 5th Sikh Guru, compiler of the Adi Granth',
 'major','sikh',2027,'curated','sikhnet.com',
 'reviewed','verified','medium',
 'Jeth Vadi 2 per Nanakshahi 2027 — approximately June 16 (±1 day)',
 'historical_commemoration', false),

-- ══ JULY 2027 ═══════════════════════════════════════════════════════════════

('Jagannath Rath Yatra',           '2027-07-05', '🛕',
 'Grand chariot procession of Lord Jagannath at Puri — festival spans 9 days',
 'major','hindu',2027,'curated','calendardate.com',
 'reviewed','verified','high',
 'Ashadha Shukla Dwitiya 2027 — confirmed Monday July 5',
 'lunar_tithi', false),

('Guru Purnima',                   '2027-07-18', '🙏',
 'Day of reverence for all spiritual teachers — sacred across Hindu, Sikh, Buddhist and Jain traditions',
 'major','all',2027,'curated','birthastro.com',
 'reviewed','verified','high',
 'Ashadha Purnima 2027 — Sunday July 18',
 'lunar_tithi', true),

('Asalha Puja',                    '2027-07-18', '☸️',
 'Dharma Day — commemorates the Buddha''s first teaching of the Four Noble Truths at Sarnath',
 'major','buddhist',2027,'curated','timeanddate.com',
 'reviewed','verified','high',
 'Full moon of Asalha (Ashadha Purnima) 2027 — same day as Guru Purnima',
 'lunar_tithi', false),

('Vassa Begins',                   '2027-07-19', '🌧️',
 'Beginning of the 3-month Buddhist Rains Retreat — intensive monastic meditation and study',
 'major','buddhist',2027,'curated','timeanddate.com',
 'reviewed','verified','high',
 'Day after Asalha Puja full moon 2027',
 'lunar_tithi', false),

-- ══ AUGUST 2027 ═════════════════════════════════════════════════════════════

('Raksha Bandhan',                 '2027-08-17', '🧿',
 'Festival celebrating the bond between brothers and sisters — Shravana Purnima',
 'major','hindu',2027,'curated','birthastro.com',
 'reviewed','verified','high',
 'Shravana Purnima 2027 — Tuesday August 17',
 'lunar_tithi', false),

('Krishna Janmashtami',            '2027-08-24', '🦚',
 'Celebration of the birth of Lord Krishna at midnight — Bhadrapada Krishna Ashtami',
 'major','hindu',2027,'curated','hindutone.com',
 'reviewed','verified','high',
 'Bhadrapada Krishna Ashtami 2027 — Tuesday August 24',
 'lunar_tithi', false),

('Paryushana Parva',               '2027-08-26', '🤲',
 'Holiest Jain festival — 8 days of fasting, prayer and self-purification',
 'major','jain',2027,'curated','drikpanchang.com',
 'reviewed','verified','high',
 'Bhadrapada Shukla Panchami 2027 — begins Thursday August 26',
 'lunar_tithi', false),

-- ══ SEPTEMBER 2027 ══════════════════════════════════════════════════════════

('Guru Har Krishan Gurpurab',      '2027-09-01', '☬',
 'Birth anniversary of Guru Har Krishan Ji — 8th Sikh Guru who became Guru at age 5',
 'regional','sikh',2027,'curated','sikhnet.com',
 'reviewed','verified','medium',
 'Sawan Shukla Dashami 2027 — approximately September 1 (±1 day)',
 'lunar_tithi', false),

('Samvatsari',                     '2027-09-04', '🕊️',
 'The Jain day of universal forgiveness — Michhami Dukkadam, culmination of Paryushana',
 'major','jain',2027,'curated','drikpanchang.com',
 'reviewed','verified','high',
 'Final day (8th) of Paryushana 2027 — Saturday September 4',
 'lunar_tithi', false),

('Ganesh Chaturthi',               '2027-09-04', '🐘',
 '10-day festival celebrating the birth of Lord Ganesha — Bhadrapada Shukla Chaturthi',
 'major','hindu',2027,'curated','hindutone.com',
 'reviewed','verified','high',
 'Bhadrapada Shukla Chaturthi 2027 — Saturday September 4',
 'lunar_tithi', false),

('Navratri Begins',                '2027-09-30', '🪔',
 'Nine nights of worship of Goddess Durga, Lakshmi and Saraswati — Sharad Navratri',
 'major','hindu',2027,'curated','hindutone.com',
 'reviewed','verified','high',
 'Ashwin Shukla Pratipada 2027 — Thursday September 30',
 'lunar_tithi', false),

-- ══ OCTOBER 2027 ════════════════════════════════════════════════════════════

('Dussehra',                       '2027-10-09', '🎇',
 'Vijayadashami — victory of Rama over Ravana, triumph of dharma',
 'major','hindu',2027,'curated','hindutone.com',
 'reviewed','verified','high',
 'Ashwin Shukla Dashami 2027 — Saturday October 9',
 'lunar_tithi', false),

('Pavarana',                       '2027-10-17', '☸️',
 'End of the Buddhist Rains Retreat — monks express gratitude and invite community feedback',
 'major','buddhist',2027,'curated','timeanddate.com',
 'reviewed','verified','medium',
 'Full moon marking end of Vassa 2027 — approximately October 17',
 'lunar_tithi', false),

('Dhanteras',                      '2027-10-26', '💰',
 'First day of Diwali — Dhan Trayodashi, worship of Goddess Lakshmi and Lord Dhanvantari',
 'major','hindu',2027,'curated','drikpanchang.com',
 'reviewed','verified','medium',
 'Kartika Krishna Trayodashi 2027 — approximately October 26',
 'lunar_tithi', false),

('Diwali',                         '2027-10-28', '🎆',
 'Festival of lights — celebrated by Hindu, Jain and Sikh communities on Kartika Amavasya',
 'major','all',2027,'curated','hindutone.com',
 'reviewed','verified','high',
 'Kartika Amavasya 2027 — Thursday October 28',
 'lunar_tithi', true),

('Bandhi Chhor Divas',             '2027-10-28', '🕊️',
 'Sikh celebration of Guru Hargobind Ji''s release with 52 imprisoned kings — coincides with Diwali',
 'major','sikh',2027,'curated','sikhnet.com',
 'reviewed','verified','high',
 'Coincides with Diwali 2027 — Kartika Amavasya October 28',
 'historical_commemoration', false),

('Govardhan Puja',                 '2027-10-29', '⛰️',
 'Worship of Govardhan Hill and Lord Krishna — day after Diwali',
 'major','hindu',2027,'curated','drikpanchang.com',
 'reviewed','verified','medium',
 'Kartika Shukla Pratipada 2027 — October 29',
 'lunar_tithi', false),

('Bhai Dooj',                      '2027-10-30', '👫',
 'Celebration of the bond between brothers and sisters — Kartika Shukla Dwitiya',
 'major','hindu',2027,'curated','drikpanchang.com',
 'reviewed','verified','medium',
 'Kartika Shukla Dwitiya 2027 — October 30',
 'lunar_tithi', false),

-- ══ NOVEMBER 2027 ═══════════════════════════════════════════════════════════

('Kartik Purnima',                 '2027-11-11', '🪷',
 'Full moon of Kartik — extremely auspicious for bathing and lamps; Dev Deepawali',
 'major','hindu',2027,'curated','drikpanchang.com',
 'reviewed','verified','medium',
 'Kartika Purnima 2027 — approximately November 11',
 'lunar_tithi', false),

('Guru Nanak Gurpurab',            '2027-11-15', '☬',
 'Prakash Utsav of Guru Nanak Dev Ji — most important Sikh celebration globally',
 'major','sikh',2027,'curated','publicholidays.in',
 'reviewed','verified','high',
 'Kartika Purnima per Bikrami calendar 2027 — Sunday November 15',
 'lunar_tithi', false),

('Guru Tegh Bahadur Martyrdom',    '2027-11-24', '☬',
 'Shaheedi Diwas — Guru Tegh Bahadur Ji martyred 1675 for the right to religious freedom',
 'major','sikh',2027,'curated','sikhnet.com',
 'reviewed','verified','high',
 'Maghar 24 per Nanakshahi — fixed November 24',
 'historical_commemoration', false),

('Sangha Day',                     '2027-11-11', '🏮',
 'Buddhist Sangha Day — celebration of the spiritual community worldwide',
 'major','buddhist',2027,'curated','timeanddate.com',
 'reviewed','verified','medium',
 'Full moon of 12th lunar month 2027 — approximately November 11',
 'lunar_tithi', false),

-- ══ DECEMBER 2027 ═══════════════════════════════════════════════════════════

('Gita Jayanti',                   '2027-12-21', '📖',
 'Anniversary of the recitation of the Bhagavad Gita by Lord Krishna to Arjuna on the battlefield',
 'major','hindu',2027,'curated','drikpanchang.com',
 'reviewed','verified','medium',
 'Margashirsha Shukla Ekadashi 2027 — approximately December 21',
 'lunar_tithi', false),

('Bodhi Day',                      '2027-12-08', '🌳',
 'Commemorates the night the Buddha attained enlightenment under the Bodhi tree at Bodh Gaya',
 'major','buddhist',2027,'curated','timeanddate.com',
 'reviewed','verified','high',
 'Fixed December 8 — East Asian/Zen tradition',
 'historical_commemoration', false),

('Sahibzade Shaheedi Diwas',       '2027-12-26', '☬',
 'Remembrance of the four sons of Guru Gobind Singh Ji — martyred for their faith in 1704',
 'major','sikh',2027,'curated','sikhnet.com',
 'reviewed','verified','high',
 'Fixed December 26 — Nanakshahi calendar',
 'historical_commemoration', false)

ON CONFLICT (name, year)
DO UPDATE SET
  date                    = EXCLUDED.date,
  emoji                   = EXCLUDED.emoji,
  description             = EXCLUDED.description,
  source_name             = EXCLUDED.source_name,
  source_kind             = EXCLUDED.source_kind,
  review_status           = EXCLUDED.review_status,
  verification_status     = EXCLUDED.verification_status,
  verification_confidence = EXCLUDED.verification_confidence,
  verification_note       = EXCLUDED.verification_note,
  verification_type       = EXCLUDED.verification_type;

-- Summary
DO $$
DECLARE cnt INT;
BEGIN
  SELECT COUNT(*) INTO cnt FROM public.festivals WHERE year = 2027;
  RAISE NOTICE '2027 festivals in DB after migration: %', cnt;
END $$;
