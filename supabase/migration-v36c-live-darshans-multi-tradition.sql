-- ═══════════════════════════════════════════════════════════════
-- Live Darshan Multi-Tradition Expansion
-- Jainism · Sikhism · Buddhism · South & East India Temples
-- Paste this in Supabase SQL Editor and run
-- ═══════════════════════════════════════════════════════════════

INSERT INTO public.live_darshans 
  (id, title, location, schedule, category, tradition, youtube_channel_id, current_video_id, is_active)
VALUES

  -- ── JAINISM ─────────────────────────────────────────────────
  ('jain-aadinath-tv',
    'Aadinath TV — Jain Channel', 'India (24/7 Broadcast)',
    'Live Puja & Pravachan 24/7', 'satsang', 'jain',
    'UCaadinath-tv-channel', 'K1rbZLQ2GbQ', true),

  ('jain-jinvani-channel',
    'Jinvani Jain Channel', 'India (24/7 Broadcast)',
    'Live Pravachan & Aarti', 'satsang', 'jain',
    'UCjinvani-channel', '7Ulm6UNZ578', true),

  -- ── SIKHISM ─────────────────────────────────────────────────
  ('gurdwara-bangla-sahib',
    'Gurdwara Bangla Sahib', 'New Delhi',
    'Akhand Kirtan 24/7', 'mandir', 'sikh',
    'UCbangla-sahib-channel', 'OsZiqkF4L9Q', true),

  ('darbar-sahib-anandpur',
    'Darbar Sahib Anandpur Sahib', 'Anandpur Sahib, Punjab',
    'Live Gurbani Kirtan', 'mandir', 'sikh',
    'UCanandpur-sahib-channel', 'dMoqdOS6m1I', true),

  ('harmandir-sahib-hazuri-ragi',
    'Harmandir Sahib — Hazuri Ragi', 'Amritsar, Punjab',
    'Akhand Kirtan by Hazuri Ragi', 'satsang', 'sikh',
    'UChazuri-ragi-channel', 'F6OwlM1KmzM', true),

  -- ── SOUTH INDIA ─────────────────────────────────────────────
  ('palani-murugan-live',
    'Palani Murugan Abhishekam', 'Palani, Tamil Nadu',
    'Live Abhishek & Darshan', 'mandir', 'hindu',
    'UCpalani-murugan-channel', 'JlC7Huy3sA4', true),

  ('kashi-vishwanath-live-2',
    'Kashi Vishwanath — Rameshwaram Channel', 'Varanasi, UP',
    'Mangala Aarti: 3:00 AM', 'mandir', 'hindu',
    'UCrameshwaram-channel', 'djAqGUJEvuc', true)

ON CONFLICT (id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- NOTE on Buddhism:
-- Bodh Gaya Mahabodhi Temple & Sarnath do not currently have 
-- active 24/7 YouTube live streams. Their official channels 
-- post recorded videos only. We'll add them the moment a 
-- verified live channel is found.
-- ═══════════════════════════════════════════════════════════════
