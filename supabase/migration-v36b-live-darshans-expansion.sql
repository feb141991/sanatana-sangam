-- ═══════════════════════════════════════════════════════════════
-- Live Darshan Expansion — All Over India
-- Paste this in Supabase SQL Editor and run
-- ═══════════════════════════════════════════════════════════════

INSERT INTO public.live_darshans 
  (id, title, location, schedule, category, tradition, youtube_channel_id, current_video_id, is_active)
VALUES
  ('ram-mandir-ayodhya', 'Shri Ram Mandir Ayodhya', 'Ayodhya, UP', 'Shringar Aarti: 6:30 AM', 'mandir', 'hindu', 'UCram-mandir-channel', 'WrXoqHUVjz0', true),
  ('naina-devi-himachal', 'Shri Naina Devi Temple', 'Bilaspur, Himachal Pradesh', 'Aarti: 6:00 AM & 7:00 PM', 'mandir', 'hindu', 'UCnaina-devi-channel', 'uhRWO9anDj0', true),
  ('vaishno-devi-aarti', 'Maa Vaishno Devi Aarti', 'Katra, Jammu & Kashmir', 'Aarti: 6:20 AM & 8:20 PM', 'mandir', 'hindu', 'UCvaishno-devi-bhajan', '5zoTUmefHiw', true),
  ('parmarth-niketan-rishikesh', 'Parmarth Niketan Rishikesh', 'Rishikesh, Uttarakhand', 'Ganga Aarti: 6:00 PM daily', 'mandir', 'hindu', 'UCparmarth-niketan-channel', 'Yv2D6cWWTq8', true)
ON CONFLICT (id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- After running this, the Cron Job (every 4 hrs) will 
-- auto-update current_video_id using each temple's 
-- youtube_channel_id via the YouTube Data API.
--
-- To add more temples yourself in future, just:
-- INSERT INTO live_darshans (id, title, location, schedule, 
--   category, tradition, youtube_channel_id)
-- VALUES ('your-id', 'Temple Name', 'City, State', 
--   'Schedule', 'mandir', 'hindu', 'UCxxxxx');
-- ═══════════════════════════════════════════════════════════════
