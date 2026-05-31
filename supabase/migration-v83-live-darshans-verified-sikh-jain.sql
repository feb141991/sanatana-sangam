-- Verified Sikh kirtan and Jain live streams.
-- These entries use channel IDs resolved from currently working live videos and
-- are intended for the DB-backed Live Darshan inventory.

INSERT INTO public.live_darshans (
  id,
  title,
  location,
  schedule,
  category,
  tradition,
  youtube_channel_id,
  current_video_id,
  is_active
) VALUES
  (
    'golden-temple-sgpc',
    'Golden Temple (SGPC Official)',
    'Amritsar, Punjab',
    'Live Gurbani Kirtan 24/7',
    'mandir',
    'sikh',
    'UCYn6UEtQ771a_OWSiNBoG8w',
    '8GTgg2TmRLQ',
    true
  ),
  (
    'takhat-hazur-sahib',
    'Takhat Sachkhand Hazur Sahib',
    'Nanded, Maharashtra',
    'Live Gurbani 24/7',
    'mandir',
    'sikh',
    'UCuerQ47I9Y2qxr4eIopxbYw',
    'YsI5XOB4z7g',
    true
  ),
  (
    'takhat-patna-sahib',
    'Takhat Sri Patna Sahib',
    'Patna, Bihar',
    'Live Gurbani',
    'mandir',
    'sikh',
    'UC3nqw1kd4AK1q9e68YUoLDQ',
    '2VoKxEz6sSc',
    true
  ),
  (
    'guru-granth-sahib-live',
    'Sri Guru Granth Sahib Kirtan',
    'Punjab / Global',
    'Live Gurbani 24/7',
    'satsang',
    'sikh',
    'UCZTngRGg1Dc2RKq6DbQLfvw',
    'YlnQ2apbtuQ',
    true
  ),
  (
    'hazoori-ragi-kirtan',
    'Hazoori Ragi Gurbani Kirtan',
    'Punjab',
    'Akhand Kirtan 24/7',
    'satsang',
    'sikh',
    'UCcMsjQs6pMLQWbW3ufhz1SQ',
    'SfkiRiVr3wc',
    true
  ),
  (
    'jinvani-tv-live',
    'Jinvani TV Live',
    'India (24/7 Broadcast)',
    'Live Pravachan & Aarti',
    'satsang',
    'jain',
    'UCDNNWj0oAFXngcwHAwnwP4w',
    '7Ulm6UNZ578',
    true
  ),
  (
    'aadinath-tv-live',
    'Aadinath TV Official',
    'India (24/7 Broadcast)',
    'Live Puja & Pravachan 24/7',
    'satsang',
    'jain',
    'UCY8r_lukdRi5cK5wjK_O3qw',
    'K1rbZLQ2GbQ',
    true
  ),
  (
    'paras-jain-tv',
    'Paras TV (Jain Channel)',
    'India (24/7 Broadcast)',
    'Live Pravachan & Aarti',
    'satsang',
    'jain',
    'UC6E1pvhGa55AaZ-svF70ViA',
    'cDzIiI0kvNg',
    true
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  location = EXCLUDED.location,
  schedule = EXCLUDED.schedule,
  category = EXCLUDED.category,
  tradition = EXCLUDED.tradition,
  youtube_channel_id = EXCLUDED.youtube_channel_id,
  current_video_id = EXCLUDED.current_video_id,
  is_active = EXCLUDED.is_active;
