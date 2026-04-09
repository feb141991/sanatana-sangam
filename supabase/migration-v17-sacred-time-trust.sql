-- ─────────────────────────────────────────────────────────────────────────────
-- Sanatana Sangam — Migration v17 (Sacred Time Trust)
-- Run this in Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

-- Festival trust metadata
ALTER TABLE public.festivals
  ADD COLUMN IF NOT EXISTS tradition text CHECK (tradition IN ('hindu', 'sikh', 'buddhist', 'jain', 'all')),
  ADD COLUMN IF NOT EXISTS is_shared boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS source_name text,
  ADD COLUMN IF NOT EXISTS source_kind text CHECK (source_kind IN ('curated', 'official', 'partner', 'community_reviewed')),
  ADD COLUMN IF NOT EXISTS review_status text CHECK (review_status IN ('needs_review', 'reviewed')),
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS review_notes text;

UPDATE public.festivals
SET
  source_name = COALESCE(source_name, 'Sanatana Sangam editorial calendar'),
  source_kind = COALESCE(source_kind, 'curated'),
  review_status = COALESCE(review_status, 'needs_review')
WHERE true;

UPDATE public.festivals
SET
  tradition = CASE name
    WHEN 'Makar Sankranti' THEN 'hindu'
    WHEN 'Vasant Panchami' THEN 'hindu'
    WHEN 'Maha Shivaratri' THEN 'hindu'
    WHEN 'Holi' THEN 'hindu'
    WHEN 'Gudi Padwa' THEN 'hindu'
    WHEN 'Ugadi' THEN 'hindu'
    WHEN 'Ram Navami' THEN 'hindu'
    WHEN 'Hanuman Jayanti' THEN 'hindu'
    WHEN 'Akshaya Tritiya' THEN 'hindu'
    WHEN 'Narasimha Jayanti' THEN 'hindu'
    WHEN 'Vat Savitri Vrat' THEN 'hindu'
    WHEN 'Jagannath Rath Yatra' THEN 'hindu'
    WHEN 'Guru Purnima' THEN 'all'
    WHEN 'Nag Panchami' THEN 'hindu'
    WHEN 'Raksha Bandhan' THEN 'hindu'
    WHEN 'Krishna Janmashtami' THEN 'hindu'
    WHEN 'Ganesh Chaturthi' THEN 'hindu'
    WHEN 'Onam' THEN 'hindu'
    WHEN 'Mahalaya Amavasya' THEN 'hindu'
    WHEN 'Navratri begins' THEN 'hindu'
    WHEN 'Dussehra' THEN 'hindu'
    WHEN 'Karva Chauth' THEN 'hindu'
    WHEN 'Dhanteras' THEN 'hindu'
    WHEN 'Diwali' THEN 'all'
    WHEN 'Govardhan Puja' THEN 'hindu'
    WHEN 'Bhai Dooj' THEN 'hindu'
    WHEN 'Chhath Puja' THEN 'hindu'
    WHEN 'Kartik Purnima' THEN 'hindu'
    WHEN 'Vivah Panchami' THEN 'hindu'
    WHEN 'Gita Jayanti' THEN 'hindu'
    WHEN 'Vaikunta Ekadashi' THEN 'hindu'
    WHEN 'Guru Gobind Singh Gurpurab' THEN 'sikh'
    WHEN 'Lohri' THEN 'sikh'
    WHEN 'Baisakhi' THEN 'sikh'
    WHEN 'Guru Arjan Dev Martyrdom' THEN 'sikh'
    WHEN 'Bandhi Chhor Divas' THEN 'sikh'
    WHEN 'Guru Nanak Gurpurab' THEN 'sikh'
    WHEN 'Guru Tegh Bahadur Martyrdom' THEN 'sikh'
    WHEN 'Gurpurab — Guru Nanak' THEN 'sikh'
    WHEN 'Losar (Tibetan New Year)' THEN 'buddhist'
    WHEN 'Magha Puja' THEN 'buddhist'
    WHEN 'Vesak / Buddha Purnima' THEN 'buddhist'
    WHEN 'Buddha Purnima' THEN 'buddhist'
    WHEN 'Asalha Puja' THEN 'buddhist'
    WHEN 'Vassa begins (Rains Retreat)' THEN 'buddhist'
    WHEN 'Kathina' THEN 'buddhist'
    WHEN 'Mahavir Jayanti' THEN 'jain'
    WHEN 'Paryushana begins' THEN 'jain'
    WHEN 'Samvatsari' THEN 'jain'
    WHEN 'Jain Diwali (Nirvana)' THEN 'jain'
    WHEN 'Kartik Purnima (Jain)' THEN 'jain'
    ELSE COALESCE(tradition, 'all')
  END,
  is_shared = CASE name
    WHEN 'Guru Purnima' THEN true
    WHEN 'Diwali' THEN true
    ELSE false
  END
WHERE tradition IS NULL OR source_name = 'Sanatana Sangam editorial calendar';

CREATE INDEX IF NOT EXISTS idx_festivals_tradition_date
  ON public.festivals (tradition, date);
