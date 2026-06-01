-- ─────────────────────────────────────────────────────────────────────────────
-- Sanatana Sangam — Migration v4 (Phase 3)
-- Run this in Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Add tradition + custom_greeting to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS tradition        text,
  ADD COLUMN IF NOT EXISTS custom_greeting  text;

-- 2. Festivals table (replaces hardcoded festivals.ts)
CREATE TABLE IF NOT EXISTS festivals (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at  timestamptz DEFAULT now() NOT NULL,
  name        text        NOT NULL,
  date        date        NOT NULL,
  emoji       text        DEFAULT '🪔',
  description text        NOT NULL,
  type        text        DEFAULT 'major' CHECK (type IN ('major', 'vrat', 'regional')),
  year        int         NOT NULL DEFAULT EXTRACT(YEAR FROM now())
);

ALTER TABLE festivals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read festivals" ON festivals FOR SELECT USING (true);
CREATE INDEX IF NOT EXISTS idx_festivals_date ON festivals (date);

-- 3. Seed festivals for 2026
INSERT INTO festivals (name, date, emoji, description, type, year) VALUES
  ('Makar Sankranti',      '2026-01-14', '🪁', 'Harvest festival marking the sun''s transition into Capricorn', 'major',    2026),
  ('Vasant Panchami',      '2026-01-23', '🌼', 'Festival of Goddess Saraswati, marks arrival of spring',        'major',    2026),
  ('Maha Shivaratri',      '2026-02-17', '🕉️', 'The great night of Shiva — night-long vigil and worship',       'major',    2026),
  ('Holi',                 '2026-03-03', '🎨', 'Festival of colours celebrating victory of good over evil',     'major',    2026),
  ('Gudi Padwa',           '2026-03-19', '🏮', 'Hindu New Year according to the Shalivahana calendar',          'major',    2026),
  ('Ugadi',                '2026-03-19', '🌿', 'New Year for Telugu and Kannada communities',                   'major',    2026),
  ('Ram Navami',           '2026-03-27', '🏹', 'Celebration of the birth of Lord Rama',                         'major',    2026),
  ('Hanuman Jayanti',      '2026-04-11', '🐒', 'Celebration of the birth of Lord Hanuman',                      'major',    2026),
  ('Akshaya Tritiya',      '2026-04-21', '💛', 'Auspicious day for new beginnings and gold purchases',          'major',    2026),
  ('Narasimha Jayanti',    '2026-05-05', '🦁', 'Celebration of Vishnu''s Narasimha avatar',                     'regional', 2026),
  ('Buddha Purnima',       '2026-05-11', '🪷', 'Full moon marking the birth and enlightenment of the Buddha',  'major',    2026),
  ('Vat Savitri Vrat',     '2026-05-22', '🌳', 'Vrat observed by married women for the well-being of husbands','vrat',     2026),
  ('Jagannath Rath Yatra', '2026-06-23', '🛕', 'Grand chariot procession of Lord Jagannath at Puri',            'major',    2026),
  ('Guru Purnima',         '2026-07-10', '🙏', 'Day to honour spiritual teachers and gurus',                    'major',    2026),
  ('Nag Panchami',         '2026-07-28', '🐍', 'Worship of serpent deities for protection',                     'regional', 2026),
  ('Raksha Bandhan',       '2026-08-11', '🧿', 'Festival celebrating the bond between brothers and sisters',    'major',    2026),
  ('Krishna Janmashtami',  '2026-08-19', '🦚', 'Celebration of the birth of Lord Krishna at midnight',          'major',    2026),
  ('Ganesh Chaturthi',     '2026-08-23', '🐘', '10-day festival celebrating the birth of Lord Ganesha',         'major',    2026),
  ('Onam',                 '2026-09-05', '🌺', 'Harvest festival of Kerala celebrating King Mahabali''s return', 'regional', 2026),
  ('Mahalaya Amavasya',    '2026-09-19', '☽',  'Day to offer prayers to ancestors — Pitru Paksha ends',         'vrat',     2026),
  ('Navratri begins',      '2026-09-20', '🪔', 'Nine nights of worship of Goddess Durga, Lakshmi & Saraswati', 'major',    2026),
  ('Dussehra',             '2026-09-29', '🎇', 'Victory of Rama over Ravana — triumph of good over evil',       'major',    2026),
  ('Karva Chauth',         '2026-10-15', '🌙', 'Vrat observed by married Hindu women for their husbands',       'vrat',     2026),
  ('Dhanteras',            '2026-10-27', '💰', 'First day of Diwali — worship of Goddess Lakshmi',              'major',    2026),
  ('Diwali',               '2026-10-29', '🎆', 'Festival of lights — victory of light over darkness',           'major',    2026),
  ('Govardhan Puja',       '2026-10-30', '⛰️', 'Worship of Govardhan Hill and Lord Krishna',                    'major',    2026),
  ('Bhai Dooj',            '2026-10-31', '👫', 'Celebration of the bond between brothers and sisters',          'major',    2026),
  ('Chhath Puja',          '2026-11-02', '☀️', 'Worship of the Sun God and Chhathi Maiya',                      'regional', 2026),
  ('Kartik Purnima',       '2026-11-13', '🪷', 'Full moon of Kartik month — extremely auspicious for bathing',  'vrat',     2026),
  ('Gurpurab — Guru Nanak','2026-11-15', '☬',  'Birthday of Guru Nanak Dev Ji — Sikhs worldwide celebrate',    'major',    2026),
  ('Vivah Panchami',       '2026-11-27', '💍', 'Anniversary of the marriage of Rama and Sita',                  'regional', 2026),
  ('Gita Jayanti',         '2026-12-03', '📖', 'Anniversary of the recitation of the Bhagavad Gita',           'major',    2026),
  ('Vaikunta Ekadashi',    '2026-12-22', '🏵️', 'Most auspicious Ekadashi — the gates of Vaikunta are open',    'major',    2026)
ON CONFLICT DO NOTHING;

-- 4. Tirtha reviews
CREATE TABLE IF NOT EXISTS tirtha_reviews (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at  timestamptz DEFAULT now() NOT NULL,
  user_id     uuid        REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  place_id    text        NOT NULL,  -- OSM node/way ID
  place_name  text        NOT NULL,
  rating      int         NOT NULL CHECK (rating BETWEEN 1 AND 5),
  note        text,
  lat         double precision,
  lon         double precision
);

ALTER TABLE tirtha_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read tirtha reviews"  ON tirtha_reviews FOR SELECT USING (true);
CREATE POLICY "Users insert own reviews"         ON tirtha_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own reviews"         ON tirtha_reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_tirtha_reviews_place ON tirtha_reviews (place_id);

-- 5. Seva task completions
CREATE TABLE IF NOT EXISTS seva_task_completions (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at  timestamptz DEFAULT now() NOT NULL,
  user_id     uuid        REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  task_key    text        NOT NULL,   -- e.g. 'complete_profile', 'first_mandali'
  points      int         NOT NULL DEFAULT 0
);

ALTER TABLE seva_task_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own seva tasks"   ON seva_task_completions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert seva tasks"     ON seva_task_completions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_seva_task_unique ON seva_task_completions (user_id, task_key);
