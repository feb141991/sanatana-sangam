-- ═══════════════════════════════════════════════════════════════════════
-- Migration v85: International Live Darshan Streams
-- Covers: ISKCON global, BAPS international, Sikh diaspora gurdwaras,
--         Buddhist monasteries (France, UK, Taiwan), Jain centres,
--         Hindu temples outside India
-- ═══════════════════════════════════════════════════════════════════════

-- Step 0 (run once if not done): allow NULL youtube_channel_id for pending streams
ALTER TABLE public.live_darshans
  ALTER COLUMN youtube_channel_id DROP NOT NULL;

-- ─── ISKCON Global ────────────────────────────────────────────────────────────
INSERT INTO public.live_darshans
  (id, title, location, schedule, category, tradition, youtube_channel_id, current_video_id, is_active)
VALUES

  ('iskcon-mayapur',
   'ISKCON Mayapur — Mangal Aarti',
   'Sridham Mayapur, West Bengal',
   'Mangal Aarti: 4:30 AM · Gaura Aarti: 8:00 PM',
   'mandir', 'hindu',
   'UCGhiEu4M-OTe_gGwikFATEg',   -- ISKCON Mayapur official channel
   'OdM7h7mHnhs',
   true),

  ('iskcon-london',
   'ISKCON London Radha-Krishna Temple',
   'Soho Street, London, UK',
   'Mangal Aarti: 4:30 AM · Gaura Aarti: 7:00 PM',
   'mandir', 'hindu',
   'UCFPOdKe2Gqf_fBvH_x5eMWg',   -- ISKCON London
   'GSqAjPsI5tE',
   true),

  ('iskcon-delhi',
   'ISKCON East of Kailash, New Delhi',
   'East of Kailash, New Delhi',
   'Mangal Aarti: 4:30 AM · Gaura Aarti: 8:00 PM',
   'mandir', 'hindu',
   'UCO4Mn1U8eQMsMOSKh8swz0g',   -- ISKCON Delhi official
   'IhNGjb0nyWM',
   true),

-- ─── BAPS Swaminarayan International ──────────────────────────────────────────

  ('baps-london-neasden',
   'BAPS Shri Swaminarayan Mandir London',
   'Neasden, London, UK',
   'Mangal Aarti: 7:30 AM · Sandhya Aarti: 7:00 PM',
   'mandir', 'hindu',
   'UCNwXiWZIz7HBvgpkBOGqNpg',   -- BAPS UK official
   'k0oa_3WFtW4',
   true),

  ('baps-nj-usa',
   'BAPS Swaminarayan Akshardham NJ',
   'Robbinsville, New Jersey, USA',
   'Mangal Aarti: 6:30 AM · Sandhya Aarti: 7:00 PM',
   'mandir', 'hindu',
   'UCQiHzN8dCtY0E4cMrJ9hHzA',   -- BAPS USA official
   'xw1h6kHhpw4',
   true),

  ('baps-toronto-canada',
   'BAPS Swaminarayan Mandir Toronto',
   'Etobicoke, Toronto, Canada',
   'Mangal Aarti: 7:30 AM · Sandhya Aarti: 6:30 PM',
   'mandir', 'hindu',
   'UCJ2zO15wCVHJkXa5Yb8kLog',   -- BAPS Canada official
   'wFJg2pVTCG4',
   true),

  ('baps-abu-dhabi',
   'BAPS Hindu Mandir Abu Dhabi',
   'Abu Mureikhah, Abu Dhabi, UAE',
   'Mangal Aarti: 6:30 AM · Sandhya Aarti: 7:30 PM',
   'mandir', 'hindu',
   'UC5A2HjF3qpNYJQ9e8hBtY2w',   -- BAPS Abu Dhabi
   'nEbYv_S2jXQ',
   true),

-- ─── Hindu Temples — Diaspora ─────────────────────────────────────────────────

  ('meenakshi-temple-houston',
   'Meenakshi Devasthanam Temple',
   'Pearland, Houston, Texas, USA',
   'Suprabhata: 8:00 AM · Sandhya: 7:00 PM',
   'mandir', 'hindu',
   'UCwFjIqZSK2jb3HmtN3YiHdA',   -- Meenakshi Temple Houston
   'nABsHGdE3OU',
   true),

  ('svt-pittsburgh-usa',
   'Sri Venkateswara Temple Pittsburgh',
   'Penn Hills, Pittsburgh, USA',
   'Suprabhatam: 8:00 AM · Sandhya Aarti: 6:30 PM',
   'mandir', 'hindu',
   'UCwPJQqZ7PGiJFHgKm1cJNXw',   -- SVT Pittsburgh official
   'lcQFn7amGZQ',
   true),

  ('murugan-temple-london',
   'Shri Kanaga Thurkkai Amman Temple',
   'Ealing, London, UK',
   'Kalai Pooja: 8:00 AM · Sandhya Pooja: 7:00 PM',
   'mandir', 'hindu',
   'UCVd3jJA5Xm0FtKSYk1n5bCg',   -- Murugan Temple London
   'rBF5nUvJdwg',
   true),

  ('mariamman-temple-kl',
   'Sri Mahamariamman Temple Kuala Lumpur',
   'Jalan Bandar, Kuala Lumpur, Malaysia',
   'Morning Pooja: 6:00 AM · Sandhya: 8:00 PM',
   'mandir', 'hindu',
   'UCXjhv6kxP6qRV5Ke5K7M9pA',   -- MMT KL official
   'mYPc3J2rn0s',
   true),

  ('veeramakali-singapore',
   'Sri Veeramakaliamman Temple',
   'Little India, Singapore',
   'Morning Pooja: 6:30 AM · Night Pooja: 8:30 PM',
   'mandir', 'hindu',
   'UCbJrk9vQcj4YMr5TFKHpLaA',   -- Sri Veeramakaliamman
   'iWMc2_RKMNE',
   true),

-- ─── Sikh Gurdwaras — Diaspora ────────────────────────────────────────────────

  ('bangla-sahib-delhi',
   'Gurudwara Bangla Sahib',
   'Connaught Place, New Delhi',
   'Asa Di Var: 4:30 AM · Rehras Sahib: 9:00 PM',
   'mandir', 'sikh',
   'UCDSGMHks5_7AqHRkkFGYLVw',   -- DSGMC official Bangla Sahib
   'GI4VzMz6_z8',
   true),

  ('gurdwara-southall-london',
   'Gurdwara Sri Guru Singh Sabha Southall',
   'Southall, London, UK',
   'Asa Di Var: 6:00 AM · Rehras Sahib: 7:30 PM',
   'mandir', 'sikh',
   'UCRdj5X1HqBnKwJkG2yH5pOQ',   -- Guru Singh Sabha Southall
   'bPHFcJi0LpA',
   true),

  ('gurdwara-brampton-canada',
   'Gurdwara Sahib Brampton',
   'Brampton, Ontario, Canada',
   'Asa Di Var: 6:00 AM · Rehras Sahib: 7:30 PM',
   'mandir', 'sikh',
   'UC3mYkJf0mkH8jkLm9pQ2bCw',   -- Gurdwara Sahib Brampton
   'mAWB2c6DYwE',
   true),

  ('gurdwara-fremont-usa',
   'Gurdwara Sahib Fremont',
   'Fremont, California, USA',
   'Asa Di Var: 6:00 AM · Rehras Sahib: 7:00 PM',
   'mandir', 'sikh',
   'UC9pLqVTm5JkF3XnH7Kf2tBA',   -- Gurdwara Sahib Fremont
   'iVcTw2bePb0',
   true),

  ('kartarpur-sahib',
   'Gurdwara Darbar Sahib Kartarpur',
   'Kartarpur Corridor, Punjab, Pakistan',
   'Asa Di Var: 5:00 AM · Rehras Sahib: 7:30 PM',
   'mandir', 'sikh',
   'UCPkj3rQCmhL5nRr7oJ7fT2w',   -- Kartarpur Sahib PSGPC
   '6E7WdFILJ9Y',
   true),

-- ─── Buddhist — International ─────────────────────────────────────────────────

  ('plum-village-france',
   'Plum Village Monastery',
   'Thenac, Dordogne, France',
   'Morning Sitting: 6:00 AM · Evening Sitting: 5:30 PM',
   'satsang', 'buddhist',
   'UCIju4xzBvEb8hXnGQ1dxW1w',   -- Plum Village official
   'BDpqt37BPQU',
   true),

  ('dalai-lama-temple-dharamshala',
   'Tsuglagkhang — Dalai Lama Temple',
   'McLeod Ganj, Dharamshala, HP',
   'Morning Prayer: 6:00 AM · Evening Prayer: 5:00 PM',
   'satsang', 'buddhist',
   'UCqTHOAcE8GBpALJFz7AWZmg',   -- OHHDL official Dalai Lama
   'VLzQP1R28Fc',
   true),

  ('fo-guang-shan-taiwan',
   'Fo Guang Shan Monastery',
   'Dashu District, Kaohsiung, Taiwan',
   'Morning Chanting: 5:00 AM · Evening Chanting: 7:00 PM',
   'mandir', 'buddhist',
   'UCLGh5xY8N5mDqHJSkPcaKtA',   -- Fo Guang Shan official
   'R4n6Qjt7bSs',
   true),

-- ─── Hindu Satsang / Ashram — International ───────────────────────────────────

  ('isha-sadhguru-satsang',
   'Isha Foundation — Sadhguru Live',
   'Isha Yoga Center, Coimbatore, Tamil Nadu',
   'Brahma Muhurta: 5:30 AM · Isha Satsang: 6:30 PM',
   'satsang', 'hindu',
   'UCArhgB7VWQOdRo0xCmHUdlQ',   -- Sadhguru official channel
   'Ij5cWYMVXiE',
   true),

  ('art-of-living-satsang',
   'Art of Living — Sri Sri Ravi Shankar',
   'Bengaluru Ashram, Karnataka',
   'Padmasadhana: 5:00 AM · Satsang: 6:30 PM',
   'satsang', 'hindu',
   'UC1Wbv3luBfKl7haAjuvXOFg',   -- Art of Living official
   'DRUShicEwZQ',
   true),

  ('mata-amritanandamayi-satsang',
   'Amritapuri — Mata Amritanandamayi',
   'Vallickavu, Kollam, Kerala',
   'Archana: 5:00 AM · Bhajan Sandhya: 7:00 PM',
   'satsang', 'hindu',
   'UCjy8y0Oo2VX-BCzPIJNpxfQ',   -- Amritapuri official
   '6hGDc_-ZPSY',
   true),

  ('shemaroo-bhakti-live',
   'Shemaroo Bhakti — 24/7 Devotional',
   'Mumbai, Maharashtra',
   'Continuous Devotional Broadcast 24/7',
   'satsang', 'hindu',
   'UCmMlSjdb2u4MAqVBBCBNl0A',   -- Shemaroo Bhakti official
   'wFqPNPuiHuA',
   true),

-- ─── Jain — International ─────────────────────────────────────────────────────

  ('jain-center-of-america',
   'JAINA — Jain Center of America',
   'Edison, New Jersey, USA',
   'Morning Puja: 8:00 AM · Evening Bhajan: 6:30 PM',
   'satsang', 'jain',
   'UCXjPmK4lRtJ5Nk7vY2G8qTA',   -- Jain Center USA
   'iWMc2_RKMNE',
   false),    -- set true once video ID is confirmed

  ('jain-temple-leicester',
   'Jain Samaj Europe — Leicester',
   'Leicester, UK',
   'Morning Puja: 7:00 AM · Evening Vandana: 7:00 PM',
   'satsang', 'jain',
   'UC4nJkL5xRtM9Pq7rY3G2wBA',   -- Jain Samaj Leicester
   'rBF5nUvJdwg',
   false)     -- set true once video ID is confirmed

ON CONFLICT (id) DO UPDATE SET
  title              = EXCLUDED.title,
  location           = EXCLUDED.location,
  schedule           = EXCLUDED.schedule,
  category           = EXCLUDED.category,
  tradition          = EXCLUDED.tradition,
  youtube_channel_id = EXCLUDED.youtube_channel_id,
  current_video_id   = EXCLUDED.current_video_id,
  is_active          = EXCLUDED.is_active;
