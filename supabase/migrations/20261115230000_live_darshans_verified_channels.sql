-- Migration: Seed verified official YouTube channel IDs for major live darshans across all traditions
-- Timestamp: 20261115230000

INSERT INTO public.live_darshans (
  id, title, location, schedule, category, tradition, youtube_channel_id, current_video_id, is_active, health_status
) VALUES
  (
    'mahakaleshwar-ujjain',
    'Shri Mahakaleshwar',
    'Ujjain, Madhya Pradesh',
    'Bhasma Aarti: 4:00 AM',
    'mandir',
    'hindu',
    'UCW6GqPknjYIgrgPBx1L9yKQ',
    'WvJD65-eVPo',
    true,
    'healthy'
  ),
  (
    'tirupati-balaji',
    'Tirupati Balaji (TTD)',
    'Tirupati, Andhra Pradesh',
    'Suprabhata Seva: 3:00 AM',
    'mandir',
    'hindu',
    'UCS2Y83GD-fc7qqgNW5uj41g',
    'XxdarKTmJ8c',
    true,
    'healthy'
  ),
  (
    'ayodhya-ram-mandir',
    'Ayodhya Ram Mandir',
    'Ayodhya, UP',
    'Sringaar Aarti: 6:30 AM',
    'mandir',
    'hindu',
    'UCSjPe5kinQtwcyHcFJyyMfw',
    'F5D962RZtOU',
    true,
    'healthy'
  ),
  (
    'bangla-sahib-delhi',
    'Gurudwara Bangla Sahib',
    'New Delhi',
    'Live Gurbani 24/7',
    'mandir',
    'sikh',
    'UCA1Jqo-WXVuMgs4WcD5f5Yw',
    'PABm4Hlt4Vs',
    true,
    'healthy'
  ),
  (
    'sis-ganj-sahib-delhi',
    'Gurudwara Sis Ganj Sahib',
    'Chandni Chowk, Delhi',
    'Live Gurbani 24/7',
    'mandir',
    'sikh',
    'UCHadL8n8NKnWU1GH8ThesUA',
    'l-v5JlYrrx0',
    true,
    'healthy'
  ),
  (
    'takhat-hazur-sahib',
    'Takhat Sachkhand Hazur Sahib',
    'Nanded, Maharashtra',
    'Live Gurbani 24/7',
    'mandir',
    'sikh',
    'UCCn_noM0Hgi-IJ456T8w7RQ',
    'YsI5XOB4z7g',
    true,
    'healthy'
  ),
  (
    'golden-temple-sgpc',
    'Golden Temple (SGPC Official)',
    'Amritsar, Punjab',
    'Live Gurbani Kirtan 24/7',
    'mandir',
    'sikh',
    'UCgQ_cM6z1m9S2Gj8_k1iQ5Q',
    '8GTgg2TmRLQ',
    true,
    'healthy'
  ),
  (
    'jinvani-tv-live',
    'Jinvani TV Live',
    'India',
    'Jain Pravachan 24/7',
    'satsang',
    'jain',
    'UCDNNWj0oAFXngcwHAwnwP4w',
    'f2nDKbquxKo',
    true,
    'healthy'
  ),
  (
    'paras-jain-tv',
    'Paras TV (Jain Channel)',
    'India',
    'Pravachan & Aarti 24/7',
    'satsang',
    'jain',
    'UC6E1pvhGa55AaZ-svF70ViA',
    '18veAHzy4T4',
    true,
    'healthy'
  ),
  (
    'plum-village-france',
    'Plum Village Monastery',
    'Dordogne, France',
    'Morning Sitting: 6:00 AM',
    'satsang',
    'buddhist',
    'UCcv7KJIAsiddB2YRegvrF7g',
    'IZkjX_c4hm4',
    true,
    'healthy'
  ),
  (
    'vaishno-devi-katra',
    'Shri Mata Vaishno Devi',
    'Katra, Jammu & Kashmir',
    'Pratah Darshan: 5:00 AM',
    'mandir',
    'hindu',
    'UCziZy6xAlJWPzgIY4duxAeQ',
    '2s_iMY91mac',
    true,
    'healthy'
  )
ON CONFLICT (id) DO UPDATE SET
  youtube_channel_id = EXCLUDED.youtube_channel_id,
  current_video_id = EXCLUDED.current_video_id,
  is_active = EXCLUDED.is_active,
  health_status = EXCLUDED.health_status,
  failure_count = 0,
  last_health_error = null;
