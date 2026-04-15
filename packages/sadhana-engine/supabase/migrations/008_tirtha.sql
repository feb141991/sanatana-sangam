-- ============================================================
-- Migration 008: Tirtha Yatra — Pilgrimage & Temple Tracker
-- Tirthas table with seed data for all major pilgrimage sites.
-- SAFE TO RE-RUN — all IF NOT EXISTS / CREATE OR REPLACE.
-- ============================================================

-- ── 1. Tirthas master table ──

CREATE TABLE IF NOT EXISTS tirthas (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  name_sanskrit TEXT,
  deity         TEXT,
  tradition     TEXT CHECK (tradition IN ('vaishnav','shaiv','shakta','smarta','general')),
  tirtha_type   TEXT NOT NULL CHECK (tirtha_type IN (
    'char_dham','chota_char_dham','jyotirlinga','shakti_peeth',
    'divya_desam','pancha_dwaraka','kshetra','river','other'
  )),
  series_name   TEXT,     -- "Char Dham", "12 Jyotirlingas", "51 Shakti Peeths"
  series_number INT,      -- position within the series
  state         TEXT,
  country       TEXT DEFAULT 'India',
  lat           FLOAT,
  lng           FLOAT,
  elevation_m   INT,
  significance  TEXT,
  best_months   TEXT[],   -- ['Oct','Nov','Apr','May']
  darshan_url   TEXT,     -- live darshan link if available
  tags          TEXT[]
);

-- ── 2. User tirtha visits ──

CREATE TABLE IF NOT EXISTS tirtha_visits (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tirtha_id   UUID NOT NULL REFERENCES tirthas(id),
  visited_at  DATE NOT NULL,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT tirtha_visits_unique UNIQUE (user_id, tirtha_id, visited_at)
);

-- ── 3. Yatra plans ──

CREATE TABLE IF NOT EXISTS yatra_plans (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  description  TEXT,
  tirtha_ids   UUID[] NOT NULL,   -- ordered list of tirthas
  status       TEXT DEFAULT 'planned'
               CHECK (status IN ('planned','in_progress','completed','cancelled')),
  target_date  DATE,
  started_at   DATE,
  completed_at DATE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── 4. Indexes ──

CREATE INDEX IF NOT EXISTS idx_tirthas_type      ON tirthas (tirtha_type);
CREATE INDEX IF NOT EXISTS idx_tirthas_tradition ON tirthas (tradition);
CREATE INDEX IF NOT EXISTS idx_tirthas_state     ON tirthas (state);

CREATE INDEX IF NOT EXISTS idx_tirtha_visits_user    ON tirtha_visits (user_id);
CREATE INDEX IF NOT EXISTS idx_tirtha_visits_tirtha  ON tirtha_visits (tirtha_id);

CREATE INDEX IF NOT EXISTS idx_yatra_plans_user ON yatra_plans (user_id);

-- ── 5. RLS ──

ALTER TABLE tirthas       ENABLE ROW LEVEL SECURITY;
ALTER TABLE tirtha_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE yatra_plans   ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'tirthas' AND policyname = 'Tirthas are public'
  ) THEN
    CREATE POLICY "Tirthas are public" ON tirthas FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'tirtha_visits' AND policyname = 'Users manage own visits'
  ) THEN
    CREATE POLICY "Users manage own visits"
      ON tirtha_visits FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'yatra_plans' AND policyname = 'Users manage own yatra'
  ) THEN
    CREATE POLICY "Users manage own yatra"
      ON yatra_plans FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ── 6. Seed: Char Dham (4) ──

INSERT INTO tirthas (slug, name, name_sanskrit, deity, tradition, tirtha_type, series_name, series_number, state, lat, lng, elevation_m, significance, best_months, darshan_url, tags)
VALUES
  ('badrinath', 'Badrinath', 'बद्रीनाथ', 'Vishnu', 'vaishnav', 'char_dham', 'Char Dham', 1, 'Uttarakhand', 30.7433, 79.4938, 3133,
   'Abode of Lord Vishnu as Badrinarayan. One of the holiest Vaishnava shrines. The presiding deity is Badrivishal — a form of Vishnu seated in meditative posture.',
   ARRAY['May','Jun','Sep','Oct'], 'https://badrinath-kedarnath.gov.in', ARRAY['vishnu','vaishnav','himalayas','char_dham']),

  ('dwarka', 'Dwarka', 'द्वारका', 'Krishna', 'vaishnav', 'char_dham', 'Char Dham', 2, 'Gujarat', 22.2394, 68.9678, 2,
   'Ancient kingdom of Lord Krishna. Dwarkadhish temple is one of the most sacred Vaishnava pilgrimage sites.',
   ARRAY['Oct','Nov','Dec','Jan','Feb'], NULL, ARRAY['krishna','vaishnav','gujarat','char_dham']),

  ('puri', 'Puri (Jagannath)', 'पुरी', 'Jagannath', 'vaishnav', 'char_dham', 'Char Dham', 3, 'Odisha', 19.8041, 85.8145, 0,
   'Abode of Lord Jagannath (Vishnu). Famous for the annual Rath Yatra chariot festival. One of the four sacred dhams.',
   ARRAY['Oct','Nov','Dec','Jan','Feb','Mar'], NULL, ARRAY['jagannath','vishnu','odisha','rath_yatra','char_dham']),

  ('rameswaram', 'Rameswaram', 'रामेश्वरम्', 'Shiva (Ramanathaswamy)', 'shaiv', 'char_dham', 'Char Dham', 4, 'Tamil Nadu', 9.2881, 79.3174, 0,
   'Where Lord Rama worshipped Shiva before crossing to Lanka. The corridor of the Ramanathaswamy temple is the longest in the world.',
   ARRAY['Oct','Nov','Dec','Jan','Feb','Mar'], NULL, ARRAY['shiva','rama','tamilnadu','jyotirlinga','char_dham'])
ON CONFLICT (slug) DO NOTHING;

-- ── 7. Seed: Chota Char Dham — Himalayas (4) ──

INSERT INTO tirthas (slug, name, name_sanskrit, deity, tradition, tirtha_type, series_name, series_number, state, lat, lng, elevation_m, significance, best_months, tags)
VALUES
  ('kedarnath', 'Kedarnath', 'केदारनाथ', 'Shiva', 'shaiv', 'chota_char_dham', 'Chota Char Dham', 1, 'Uttarakhand', 30.7352, 79.0669, 3583,
   'One of the 12 Jyotirlingas. Highest of the Chota Char Dham shrines. Lord Shiva as Kedarnath.',
   ARRAY['May','Jun','Sep','Oct'], ARRAY['shiva','jyotirlinga','himalayas','chota_char_dham']),

  ('gangotri', 'Gangotri', 'गंगोत्री', 'Ganga', 'general', 'chota_char_dham', 'Chota Char Dham', 2, 'Uttarakhand', 30.9941, 78.9396, 3048,
   'Source of the sacred Ganges river. Goddess Ganga is worshipped here.',
   ARRAY['May','Jun','Sep','Oct'], ARRAY['ganga','river','himalayas','chota_char_dham']),

  ('yamunotri', 'Yamunotri', 'यमुनोत्री', 'Yamuna', 'general', 'chota_char_dham', 'Chota Char Dham', 3, 'Uttarakhand', 31.0138, 78.4563, 3291,
   'Source of the sacred Yamuna river. Goddess Yamuna worshipped here.',
   ARRAY['May','Jun','Sep','Oct'], ARRAY['yamuna','river','himalayas','chota_char_dham'])
ON CONFLICT (slug) DO NOTHING;

-- ── 8. Seed: 12 Jyotirlingas ──

INSERT INTO tirthas (slug, name, name_sanskrit, deity, tradition, tirtha_type, series_name, series_number, state, lat, lng, significance, best_months, tags)
VALUES
  ('somnath',        'Somnath',          'सोमनाथ',        'Shiva', 'shaiv', 'jyotirlinga', '12 Jyotirlingas', 1,  'Gujarat',       20.8880, 70.4011, 'First and most sacred of the 12 Jyotirlingas. Destroyed and rebuilt 17 times.', ARRAY['Oct','Nov','Dec','Jan','Feb'], ARRAY['shiva','jyotirlinga','gujarat']),
  ('mallikarjuna',   'Mallikarjuna',     'मल्लिकार्जुन',  'Shiva', 'shaiv', 'jyotirlinga', '12 Jyotirlingas', 2,  'Andhra Pradesh', 16.0747, 78.8685, 'Shrisailam temple on the banks of the Krishna river.', ARRAY['Oct','Nov','Dec','Jan','Feb','Mar'], ARRAY['shiva','jyotirlinga','andhra']),
  ('mahakaleshwar',  'Mahakaleshwar',    'महाकालेश्वर',   'Shiva', 'shaiv', 'jyotirlinga', '12 Jyotirlingas', 3,  'Madhya Pradesh', 23.1828, 75.7682, 'Ujjain — the only south-facing Jyotirlinga. Famous Bhasma Aarti at 4am.', ARRAY['Oct','Nov','Dec','Jan','Feb','Mar','Apr'], ARRAY['shiva','jyotirlinga','ujjain','mp']),
  ('omkareshwar',    'Omkareshwar',      'ओंकारेश्वर',    'Shiva', 'shaiv', 'jyotirlinga', '12 Jyotirlingas', 4,  'Madhya Pradesh', 22.2435, 76.1522, 'Island shaped like Om on the Narmada river.', ARRAY['Oct','Nov','Dec','Jan','Feb','Mar'], ARRAY['shiva','jyotirlinga','narmada','mp']),
  ('kedarnath-jl',   'Kedarnath',        'केदारनाथ',      'Shiva', 'shaiv', 'jyotirlinga', '12 Jyotirlingas', 5,  'Uttarakhand',   30.7352, 79.0669, 'Highest Jyotirlinga in the Himalayas.', ARRAY['May','Jun','Sep','Oct'], ARRAY['shiva','jyotirlinga','himalayas']),
  ('bhimashankar',   'Bhimashankar',     'भीमशंकर',       'Shiva', 'shaiv', 'jyotirlinga', '12 Jyotirlingas', 6,  'Maharashtra',   19.0724, 73.5360, 'Located in the Sahyadri hills. Origin of the Bhima river.', ARRAY['Oct','Nov','Dec','Jan','Feb','Mar'], ARRAY['shiva','jyotirlinga','maharashtra']),
  ('kashi-vishwanath','Kashi Vishwanath','काशी विश्वनाथ', 'Shiva', 'shaiv', 'jyotirlinga', '12 Jyotirlingas', 7,  'Uttar Pradesh', 25.3109, 83.0107, 'Varanasi — the most sacred of all Jyotirlingas. On the banks of the Ganges.', ARRAY['Oct','Nov','Dec','Jan','Feb','Mar'], ARRAY['shiva','jyotirlinga','kashi','varanasi','ganga']),
  ('tryambakeshwar', 'Tryambakeshwar',   'त्र्यंबकेश्वर', 'Shiva', 'shaiv', 'jyotirlinga', '12 Jyotirlingas', 8,  'Maharashtra',   19.9337, 73.5304, 'Near Nasik. Source of the Godavari river. Unique three-faced Shivalinga.', ARRAY['Oct','Nov','Dec','Jan','Feb','Mar'], ARRAY['shiva','jyotirlinga','nasik','godavari']),
  ('vaidyanath',     'Baidyanath',       'वैद्यनाथ',      'Shiva', 'shaiv', 'jyotirlinga', '12 Jyotirlingas', 9,  'Jharkhand',     24.4860, 86.7040, 'Deoghar. Shiva as the divine physician (Vaidya).', ARRAY['Oct','Nov','Dec','Jan','Feb','Mar'], ARRAY['shiva','jyotirlinga','jharkhand']),
  ('nageshwar',      'Nageshwar',        'नागेश्वर',      'Shiva', 'shaiv', 'jyotirlinga', '12 Jyotirlingas', 10, 'Gujarat',       22.3493, 69.0890, 'Near Dwarka. Shiva as lord of serpents.', ARRAY['Oct','Nov','Dec','Jan','Feb'], ARRAY['shiva','jyotirlinga','gujarat']),
  ('rameswaram-jl',  'Rameswaram',       'रामेश्वरम्',    'Shiva', 'shaiv', 'jyotirlinga', '12 Jyotirlingas', 11, 'Tamil Nadu',    9.2881, 79.3174, 'Established by Lord Rama.', ARRAY['Oct','Nov','Dec','Jan','Feb','Mar'], ARRAY['shiva','jyotirlinga','tamilnadu','rama']),
  ('grishneshwar',   'Grishneshwar',     'घृष्णेश्वर',    'Shiva', 'shaiv', 'jyotirlinga', '12 Jyotirlingas', 12, 'Maharashtra',   19.8774, 75.1790, 'Near Ellora caves. Last of the 12 Jyotirlingas.', ARRAY['Oct','Nov','Dec','Jan','Feb','Mar'], ARRAY['shiva','jyotirlinga','maharashtra','ellora'])
ON CONFLICT (slug) DO NOTHING;

-- ── 9. Seed: Key Shakti Peeths (select 10 most prominent of 51) ──

INSERT INTO tirthas (slug, name, deity, tradition, tirtha_type, series_name, series_number, state, lat, lng, significance, best_months, tags)
VALUES
  ('kamakhya',    'Kamakhya',           'Devi Kamakhya',    'shakta', 'shakti_peeth', '51 Shakti Peeths', 1,  'Assam',         26.1664, 91.7005, 'Most powerful Shakti Peeth. Tantric site on Nilachal hill, Guwahati.', ARRAY['Aug','Sep','Oct','Nov'], ARRAY['shakti','devi','assam','tantra']),
  ('vaishno-devi','Vaishno Devi',       'Devi Vaishno',     'shakta', 'shakti_peeth', '51 Shakti Peeths', 2,  'J&K',          32.9855, 74.9522, 'Cave shrine in the Trikuta mountains. Most visited pilgrimage in India.', ARRAY['Mar','Apr','May','Sep','Oct','Nov'], ARRAY['shakti','devi','jammu','cave']),
  ('kolkata-kali','Kalighat',           'Devi Kali',        'shakta', 'shakti_peeth', '51 Shakti Peeths', 3,  'West Bengal',  22.5202, 88.3436, 'Kalighat temple, Kolkata. One of the most sacred Shakti Peeths.', ARRAY['Oct','Nov','Dec','Jan','Feb','Mar'], ARRAY['kali','shakti','kolkata','bengal']),
  ('jwala-ji',    'Jwala Ji',           'Devi Jwala',       'shakta', 'shakti_peeth', '51 Shakti Peeths', 4,  'Himachal',     31.8747, 76.3308, 'Eternal flame burns without fuel. Tongue of Sati fell here.', ARRAY['Mar','Apr','May','Sep','Oct','Nov'], ARRAY['shakti','devi','himachal','flame']),
  ('ambaji',      'Ambaji',             'Devi Amba',        'shakta', 'shakti_peeth', '51 Shakti Peeths', 5,  'Gujarat',      24.3295, 72.8502, 'Heart of Sati fell here. Major Navaratri celebrations.', ARRAY['Sep','Oct','Nov','Dec','Jan'], ARRAY['shakti','amba','gujarat','navratri']),
  ('chamunda',    'Chamundeshwari',     'Devi Chamundi',    'shakta', 'shakti_peeth', '51 Shakti Peeths', 6,  'Karnataka',    12.2724, 76.6706, 'On Chamundi hill, Mysuru. Chamundeshwari is the tutelary deity of the Mysore royal family.', ARRAY['Sep','Oct','Nov','Dec','Jan','Feb'], ARRAY['shakti','chamunda','karnataka','mysore']),
  ('bhuvaneshwari','Bhuvaneshwari',     'Devi Bhuvaneshwari','shakta','shakti_peeth', '51 Shakti Peeths', 7,  'Odisha',       20.2961, 85.8245, 'Lingaraj complex area. Devi as ruler of the universe.', ARRAY['Oct','Nov','Dec','Jan','Feb','Mar'], ARRAY['shakti','odisha','bhubaneswar']),
  ('hinglaj',     'Hinglaj Mata',       'Devi Hinglaj',     'shakta', 'shakti_peeth', '51 Shakti Peeths', 8,  'Balochistan',  25.5128, 65.5180, 'Head of Sati fell here. Sacred cave in Makran coast, Pakistan.', ARRAY['Mar','Apr'], ARRAY['shakti','balochistan','cave']),
  ('naina-devi',  'Naina Devi',         'Devi Naina',       'shakta', 'shakti_peeth', '51 Shakti Peeths', 9,  'Himachal',     31.4667, 76.6600, 'Eyes of Sati fell here. On a hilltop in Bilaspur district.', ARRAY['Mar','Apr','May','Sep','Oct','Nov'], ARRAY['shakti','himachal','eyes']),
  ('srisailam-sp','Bhramaramba',        'Devi Bhramaramba', 'shakta', 'shakti_peeth', '51 Shakti Peeths', 10, 'Andhra Pradesh',16.0747, 78.8685, 'Co-located with Mallikarjuna Jyotirlinga at Srisailam.', ARRAY['Oct','Nov','Dec','Jan','Feb','Mar'], ARRAY['shakti','andhra','jyotirlinga'])
ON CONFLICT (slug) DO NOTHING;

-- ── 10. User visit progress view ──

CREATE OR REPLACE VIEW user_tirtha_progress AS
SELECT
  u.id                                               AS user_id,
  t.tirtha_type,
  t.series_name,
  COUNT(DISTINCT t.id)                               AS total_in_series,
  COUNT(DISTINCT tv.tirtha_id)                       AS visited,
  ROUND(COUNT(DISTINCT tv.tirtha_id)::NUMERIC /
        NULLIF(COUNT(DISTINCT t.id), 0) * 100, 1)   AS pct_complete
FROM auth.users u
CROSS JOIN (
  SELECT DISTINCT tirtha_type, series_name FROM tirthas WHERE series_name IS NOT NULL
) s
JOIN tirthas t
  ON t.tirtha_type = s.tirtha_type AND t.series_name = s.series_name
LEFT JOIN tirtha_visits tv
  ON tv.tirtha_id = t.id AND tv.user_id = u.id
GROUP BY u.id, t.tirtha_type, t.series_name;
