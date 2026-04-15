-- ============================================================
-- Migration 012 — Pathshala Seed Data
--
-- Seeds:
--   1. 7 launch curriculum paths
--   2. 12 launch badges
--   3. Language + category metadata on existing scripture_chunks
--
-- Safe to re-run: all inserts use ON CONFLICT DO NOTHING
-- ============================================================

-- ============================================================
-- 1. CURRICULUM PATHS
-- ============================================================

INSERT INTO pathshala_paths
  (slug, title, subtitle, description, language, tradition, difficulty, text_category, total_chunks, estimated_weeks, cover_emoji, cover_color)
VALUES

-- ── Bhagavad Gita ───────────────────────────────────────────
(
  'bhagavad-gita-18-chapters',
  'Bhagavad Gita',
  '18 Chapters · 700 Shlokas',
  'The song of the Lord — Arjuna''s crisis on the battlefield of Kurukshetra becomes the setting for Krishna''s revelation of dharma, karma yoga, jnana yoga, bhakti yoga, and the nature of the Self. The foundational text of Sanatana Dharma, studied across all traditions and sampradayas.',
  'sa', 'smarta', 'beginner', 'smriti',
  700, 18, '🦚', '#FF6B35'
),

-- ── Principal Upanishads ────────────────────────────────────
(
  'principal-upanishads',
  'Principal Upanishads',
  'Isha · Kena · Katha · Mundaka · Mandukya',
  'The crown of the Vedas — the Upanishads explore the nature of Brahman, Atman, consciousness, and liberation. This path covers the five most studied Upanishads, forming the philosophical bedrock of Advaita Vedanta and all Vedantic schools.',
  'sa', 'smarta', 'intermediate', 'shruti',
  280, 10, '🕉️', '#6B35FF'
),

-- ── Mahabharata Story Mode ──────────────────────────────────
(
  'mahabharata-story-mode',
  'Mahabharata',
  '18 Parvas · Narrative Mode',
  'The world''s longest epic — the story of the Kuru dynasty, dharma in conflict, and the avatara of Krishna. This path covers all 18 parvas in narrative Hindi format, distilling the core stories and their spiritual teachings. Includes the Harivamsa appendix.',
  'hi', 'smarta', 'beginner', 'itihasa',
  360, 52, '⚔️', '#C0392B'
),

-- ── Ram Charit Manas ────────────────────────────────────────
(
  'ram-charit-manas',
  'Ram Charit Manas',
  'Goswami Tulsidas · 7 Kandas',
  'Tulsidas''s Awadhi retelling of the Ramayana — one of the most beloved texts in the North Indian bhakti tradition. Written in doha and chaupai metres, it covers the seven kandas from Bal Kanda to Uttara Kanda. The living scripture of the Vaishnava sant tradition of the Gangetic plain.',
  'awa', 'vaishnava', 'beginner', 'bhakti',
  1074, 24, '🏹', '#E67E22'
),

-- ── Nalayira Divya Prabandham ───────────────────────────────
(
  'nalayira-divya-prabandham',
  'Nalayira Divya Prabandham',
  '4000 Pasurams · 12 Alvars',
  'The 4000 divine hymns of the 12 Alvars — the foundational scripture of Sri Vaishnavism and Tamil bhakti. Composed in classical Tamil, these pasurams praise Vishnu at the 108 Divya Desams and form the "Dravida Veda" of the South. Studied alongside Sanskrit Vedas in Sri Vaishnava tradition.',
  'ta', 'vaishnava', 'intermediate', 'pasuram',
  4000, 40, '🌺', '#27AE60'
),

-- ── Yoga Sutras of Patanjali ────────────────────────────────
(
  'yoga-sutras-patanjali',
  'Yoga Sutras of Patanjali',
  '196 Sutras · Raja Yoga',
  'The classical systemisation of yoga — Patanjali''s 196 aphorisms define the eight-limbed path (Ashtanga Yoga): yama, niyama, asana, pranayama, pratyahara, dharana, dhyana, samadhi. Studied with Vyasa''s Yoga Bhashya commentary. Essential for practitioners of meditation and inner enquiry.',
  'sa', 'yoga', 'intermediate', 'darshana',
  196, 8, '🧘', '#2980B9'
),

-- ── Kabir & Sant Tradition ──────────────────────────────────
(
  'kabir-sant-tradition',
  'Kabir & Sant Tradition',
  'Dohas · Sakhis · Pads',
  'The radical bhakti poetry of Kabir Das, Mirabai, Surdas, Ravidas, and Dadu — saints who transcended caste and creed to sing of the formless divine. These dohas and pads in Braj Bhasha and Khari Boli carry a direct, uncompromising spirituality that resonates across traditions. Preserved in the Bijak, Guru Granth Sahib, and Panch Vani.',
  'hi', 'sant', 'beginner', 'doha',
  450, 12, '🪔', '#8E44AD'
)

ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 2. BADGES
-- ============================================================

INSERT INTO pathshala_badges (slug, title, emoji, description, category, criteria)
VALUES

-- ── Path completion badges ──────────────────────────────────
(
  'gita-adhikari',
  'Gita Adhikari',
  '🦚',
  'Completed all 18 chapters of the Bhagavad Gita',
  'learning',
  '{"type":"path_complete","path_slug":"bhagavad-gita-18-chapters"}'::jsonb
),
(
  'upanishad-seeker',
  'Upanishad Seeker',
  '🕉️',
  'Completed the five principal Upanishads',
  'learning',
  '{"type":"path_complete","path_slug":"principal-upanishads"}'::jsonb
),
(
  'vyas-bhakta',
  'Vyas Bhakta',
  '⚔️',
  'Completed 50 or more parvas of the Mahabharata journey',
  'learning',
  '{"type":"path_progress","path_slug":"mahabharata-story-mode","min_position":180}'::jsonb
),
(
  'manas-pathi',
  'Manas Pathi',
  '🏹',
  'Completed Ram Charit Manas — all seven kandas',
  'learning',
  '{"type":"path_complete","path_slug":"ram-charit-manas"}'::jsonb
),
(
  'alvar-shraddha',
  'Alvar Shraddha',
  '🌺',
  'Completed 1000 pasurams of the Nalayira Divya Prabandham',
  'learning',
  '{"type":"path_progress","path_slug":"nalayira-divya-prabandham","min_position":1000}'::jsonb
),
(
  'raja-yogi',
  'Raja Yogi',
  '🧘',
  'Completed all 196 Yoga Sutras of Patanjali',
  'learning',
  '{"type":"path_complete","path_slug":"yoga-sutras-patanjali"}'::jsonb
),
(
  'sant-shiromani',
  'Sant Shiromani',
  '🪔',
  'Completed the Kabir and Sant Tradition path',
  'learning',
  '{"type":"path_complete","path_slug":"kabir-sant-tradition"}'::jsonb
),

-- ── Recitation / Shruti badges ──────────────────────────────
(
  'prathamika-vak',
  'Prathamika Vak',
  '🗣️',
  'Submitted your first recitation for AI scoring',
  'recitation',
  '{"type":"recitation_count","min_count":1}'::jsonb
),
(
  'shuddha-uccharan',
  'Shuddha Uccharan',
  '✨',
  'Scored 4.5 or above on 5 AI recitation reviews',
  'recitation',
  '{"type":"recitation_score","min_score":4.5,"count":5}'::jsonb
),
(
  'pandit',
  'Pandit',
  '📿',
  'Certified by a guru on 10 or more verses',
  'recitation',
  '{"type":"verses_certified","count":10}'::jsonb
),

-- ── Mastery badge ───────────────────────────────────────────
(
  'trikala-sadhaka',
  'Trikala Sadhaka',
  '🌟',
  'Achieved full mastery (reading + memorisation + certified recitation) on any verse',
  'mastery',
  '{"type":"full_mastery_count","min_count":1}'::jsonb
),

-- ── Community / Kul badge ───────────────────────────────────
(
  'sangha-priya',
  'Sangha Priya',
  '🤝',
  'Joined and completed a kul study circle',
  'community',
  '{"type":"study_circle_complete"}'::jsonb
)

ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 3. UPDATE EXISTING scripture_chunks WITH METADATA
--
--    We don't know exactly what content is already seeded, so
--    we apply sensible defaults by book name pattern matching.
--    The application can refine these per-row later.
-- ============================================================

-- Sanskrit Vedic texts (Upanishads, Vedas)
UPDATE scripture_chunks
   SET language         = 'sa',
       script           = 'Devanagari',
       tradition_region = 'pan',
       text_category    = 'shruti'
 WHERE (
   LOWER(text_id) LIKE '%upanishad%'
   OR LOWER(text_id) LIKE '%veda%'
   OR LOWER(text_id) LIKE '%isha%'
   OR LOWER(text_id) LIKE '%kena%'
   OR LOWER(text_id) LIKE '%katha%'
   OR LOWER(text_id) LIKE '%mundaka%'
   OR LOWER(text_id) LIKE '%mandukya%'
   OR LOWER(text_id) LIKE '%chandogya%'
   OR LOWER(text_id) LIKE '%brihadaranyaka%'
 )
 AND language IS NULL;

-- Bhagavad Gita
UPDATE scripture_chunks
   SET language         = 'sa',
       script           = 'Devanagari',
       tradition_region = 'pan',
       text_category    = 'smriti'
 WHERE (
   LOWER(text_id) LIKE '%bhagavad%'
   OR LOWER(text_id) LIKE '%gita%'
 )
 AND language IS NULL;

-- Mahabharata
UPDATE scripture_chunks
   SET language         = 'sa',
       script           = 'Devanagari',
       tradition_region = 'pan',
       text_category    = 'itihasa'
 WHERE LOWER(text_id) LIKE '%mahabharata%'
   AND language IS NULL;

-- Ramayana (Sanskrit Valmiki)
UPDATE scripture_chunks
   SET language         = 'sa',
       script           = 'Devanagari',
       tradition_region = 'pan',
       text_category    = 'itihasa'
 WHERE (
   LOWER(text_id) LIKE '%ramayana%'
   OR LOWER(text_id) LIKE '%valmiki%'
 )
 AND language IS NULL;

-- Puranas
UPDATE scripture_chunks
   SET language         = 'sa',
       script           = 'Devanagari',
       tradition_region = 'pan',
       text_category    = 'purana'
 WHERE (
   LOWER(text_id) LIKE '%purana%'
   OR LOWER(text_id) LIKE '%bhagavata%'
   OR LOWER(text_id) LIKE '%vishnu purana%'
   OR LOWER(text_id) LIKE '%shiva purana%'
 )
 AND language IS NULL;

-- Yoga Sutras
UPDATE scripture_chunks
   SET language         = 'sa',
       script           = 'Devanagari',
       tradition_region = 'pan',
       text_category    = 'darshana'
 WHERE (
   LOWER(text_id) LIKE '%yoga sutra%'
   OR LOWER(text_id) LIKE '%patanjali%'
 )
 AND language IS NULL;

-- Stotras and hymns
UPDATE scripture_chunks
   SET language         = 'sa',
       script           = 'Devanagari',
       tradition_region = 'pan',
       text_category    = 'stotra'
 WHERE (
   LOWER(text_id) LIKE '%stotra%'
   OR LOWER(text_id) LIKE '%sahasranama%'
   OR LOWER(text_id) LIKE '%stuti%'
   OR LOWER(text_id) LIKE '%lahari%'
   OR LOWER(text_id) LIKE '%ashtakam%'
   OR LOWER(text_id) LIKE '%kavach%'
 )
 AND language IS NULL;

-- Tamil texts (Divya Prabandham, Thiruvasagam, Kural)
UPDATE scripture_chunks
   SET language         = 'ta',
       script           = 'Tamil',
       tradition_region = 'south',
       text_category    = 'pasuram'
 WHERE (
   LOWER(text_id) LIKE '%divya prabandham%'
   OR LOWER(text_id) LIKE '%thiruvasagam%'
   OR LOWER(text_id) LIKE '%thiruvachagam%'
   OR LOWER(text_id) LIKE '%tirukkural%'
   OR LOWER(text_id) LIKE '%thirukural%'
   OR LOWER(text_id) LIKE '%nalayira%'
 )
 AND language IS NULL;

-- Hindi bhakti texts
UPDATE scripture_chunks
   SET language         = 'hi',
       script           = 'Devanagari',
       tradition_region = 'north',
       text_category    = 'bhakti'
 WHERE (
   LOWER(text_id) LIKE '%ram charit%'
   OR LOWER(text_id) LIKE '%ramcharit%'
   OR LOWER(text_id) LIKE '%kabir%'
   OR LOWER(text_id) LIKE '%mirabai%'
   OR LOWER(text_id) LIKE '%surdas%'
   OR LOWER(text_id) LIKE '%tulsidas%'
   OR LOWER(text_id) LIKE '%doha%'
 )
 AND language IS NULL;

-- Bengali texts
UPDATE scripture_chunks
   SET language         = 'bn',
       script           = 'Bengali',
       tradition_region = 'east',
       text_category    = 'bhakti'
 WHERE (
   LOWER(text_id) LIKE '%chandi%'
   OR LOWER(text_id) LIKE '%chaitanya%'
 )
 AND language IS NULL;

-- Fallback: anything still NULL defaults to Sanskrit/pan
UPDATE scripture_chunks
   SET language         = 'sa',
       script           = 'Devanagari',
       tradition_region = 'pan',
       text_category    = COALESCE(text_category, 'smriti')
 WHERE language IS NULL;

-- ============================================================
-- 4. SUPABASE STORAGE BUCKET for recitation audio
--    Creates the bucket if it doesn''t already exist.
--    Run this in the Supabase SQL editor (service role access).
-- ============================================================

-- NOTE: bucket creation via SQL requires the storage schema.
-- If this fails, create it manually in the Supabase dashboard:
--   Storage → New bucket → "pathshala-recordings" → Private

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'pathshala-recordings'
  ) THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'pathshala-recordings',
      'pathshala-recordings',
      false,   -- private: signed URLs only
      10485760, -- 10 MB per file
      ARRAY['audio/webm','audio/mp4','audio/mpeg','audio/ogg','audio/wav','audio/mp3']
    );
  END IF;
END $$;

-- RLS policies on storage bucket
DO $$
BEGIN
  -- Users can upload their own recordings
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Users upload own recordings'
    AND tablename = 'objects'
    AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Users upload own recordings"
    ON storage.objects FOR INSERT
    WITH CHECK (
      bucket_id = 'pathshala-recordings'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;

  -- Users can read their own recordings
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Users read own recordings'
    AND tablename = 'objects'
    AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Users read own recordings"
    ON storage.objects FOR SELECT
    USING (
      bucket_id = 'pathshala-recordings'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;
END $$;

-- ============================================================
-- DONE
-- ============================================================
-- Seeded:
--   7 curriculum paths (Gita, Upanishads, Mahabharata, Ram Charit Manas,
--     Nalayira Divya Prabandham, Yoga Sutras, Kabir Sant Tradition)
--   12 badges (7 learning, 3 recitation, 1 mastery, 1 community)
--   Corpus metadata updated on all existing scripture_chunks
--   Supabase Storage bucket: pathshala-recordings (private, 10MB limit)
--
-- Next: deploy Edge Functions
--   ai-recitation-score
--   ai-pathshala-explain
--   ai-shloka-of-day
-- ============================================================
