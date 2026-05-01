-- ─── Migration v33: devotional_tracks table + storage bucket ─────────────────
-- Stores metadata for all CC0/public-domain devotional audio tracks.
-- Audio files live in Supabase Storage bucket: devotional-audio
-- Run this in: Supabase Dashboard → SQL Editor

-- ── 1. Storage bucket ────────────────────────────────────────────────────────
-- Create via Dashboard: Storage → New Bucket → "devotional-audio" → Public ON
-- Or via SQL (requires storage extension):
-- insert into storage.buckets (id, name, public) values ('devotional-audio', 'devotional-audio', true)
-- on conflict (id) do nothing;

-- ── 2. devotional_tracks table ───────────────────────────────────────────────
create table if not exists public.devotional_tracks (
  id               text primary key,             -- slug e.g. 'gayatri-mantra'
  title            text        not null,          -- Display name
  title_devanagari text,                          -- Sanskrit title if applicable
  type             text        not null           -- 'mantra' | 'stotram' | 'kirtan' | 'bhajan' | 'dhyana' | 'simran'
    check (type in ('mantra','stotram','kirtan','bhajan','dhyana','simran')),
  deity            text,                          -- 'ganesha' | 'shiva' | 'vishnu' | 'devi' | 'hanuman' | 'surya' | 'universal'
  tradition        text        not null default 'hindu'
    check (tradition in ('hindu','sikh','buddhist','jain','all')),
  mood             text[],                        -- ['morning','festival','meditation','evening','difficult']
  audio_url        text,                          -- Supabase Storage public URL (null until uploaded)
  duration_secs    integer,                       -- Audio length in seconds
  creator          text,                          -- Performer/uploader name
  license          text        not null,          -- 'CC0' | 'CC-BY' | 'CC-BY-SA' | 'Public Domain'
  attribution_text text,                          -- Full attribution string (required for CC-BY)
  source_url       text,                          -- Original Wikimedia/Archive.org page URL
  verse_count      integer,                       -- Number of verses (for stotrams)
  language         text        default 'sanskrit',-- 'sanskrit' | 'hindi' | 'punjabi' | 'pali' | 'tamil'
  is_active        boolean     not null default false, -- false until audio_url is filled
  sort_order       integer     default 100,       -- For ordering within a deity/type
  created_at       timestamptz not null default now()
);

-- ── 3. Row-Level Security ─────────────────────────────────────────────────────
alter table public.devotional_tracks enable row level security;

-- Anyone can read active tracks
create policy "devotional_tracks: public read active"
  on public.devotional_tracks for select
  using (is_active = true);

-- Only service role can insert/update (admin uploads via Supabase dashboard)
-- No public insert/update policy needed

-- ── 4. Indexes ───────────────────────────────────────────────────────────────
create index if not exists devotional_tracks_tradition_idx  on public.devotional_tracks (tradition);
create index if not exists devotional_tracks_deity_idx      on public.devotional_tracks (deity);
create index if not exists devotional_tracks_type_idx       on public.devotional_tracks (type);
create index if not exists devotional_tracks_is_active_idx  on public.devotional_tracks (is_active);

-- ── 5. Seed data — all tracks INACTIVE until audio_url is filled ──────────────
-- Set is_active = true after uploading to Supabase Storage and pasting the URL.

insert into public.devotional_tracks
  (id, title, title_devanagari, type, deity, tradition, mood, audio_url, duration_secs, creator, license, attribution_text, source_url, verse_count, language, is_active, sort_order)
values

-- ── Already working (from Wikimedia — keep for backward compat) ──────────────
('gayatri-mantra',
 'Gayatri Mantra', 'गायत्री मंत्र', 'mantra', 'surya', 'hindu',
 array['morning','meditation'], null, 22,
 'Rameshvar', 'CC-BY',
 'Gayatri Mantra as it is by Rameshvar via Wikimedia Commons, Free Art License.',
 'https://commons.wikimedia.org/wiki/File:Gayatri_Mantra_as_it_is.ogg',
 1, 'sanskrit', false, 10),

('guru-stotram',
 'Guru Stotram', 'गुरु स्तोत्रम्', 'stotram', 'universal', 'hindu',
 array['morning','meditation'], null, 295,
 'Swami Atmananda', 'CC0',
 'Sanskrit Chanting Guru Stotram by Swami Atmananda via Wikimedia Commons, CC0.',
 'https://commons.wikimedia.org/wiki/File:Sanskrit_Chanting_Guru_Stotram.ogg',
 8, 'sanskrit', false, 20),

-- ── To be uploaded by user ────────────────────────────────────────────────────
('ganesha-pancharatnam',
 'Ganesha Pancharatnam', 'गणेश पञ्चरत्नम्', 'stotram', 'ganesha', 'hindu',
 array['morning','meditation'], null, null,
 null, 'CC-BY-SA',
 'Ganesha Pancharatnam via Wikimedia Commons.',
 'https://commons.wikimedia.org/wiki/File:Ganesha_Pancharatnam.ogg',
 5, 'sanskrit', false, 30),

('mahamrityunjaya-mantra',
 'Mahamrityunjaya Mantra', 'महामृत्युञ्जय मंत्र', 'mantra', 'shiva', 'hindu',
 array['morning','meditation','difficult'], null, null,
 null, 'CC0',
 'Mahamrityunjaya Mantra via Wikimedia Commons, Public Domain.',
 'https://commons.wikimedia.org/wiki/File:Mahamrityunjaya_mantra.ogg',
 1, 'sanskrit', false, 40),

('shiva-panchakshara',
 'Shiva Panchakshara Stotram', 'शिव पञ्चाक्षर स्तोत्रम्', 'stotram', 'shiva', 'hindu',
 array['morning','evening'], null, null,
 null, 'CC0',
 'Shiva Panchakshara Stotram via Wikimedia Commons, Public Domain.',
 'https://commons.wikimedia.org/wiki/File:Shiva_Panchakshara_Stotram.ogg',
 5, 'sanskrit', false, 50),

('om-namah-shivaya',
 'Om Namah Shivaya', 'ॐ नमः शिवाय', 'mantra', 'shiva', 'hindu',
 array['morning','meditation','evening'], null, null,
 null, 'CC0',
 'Om Namah Shivaya chant, Public Domain.',
 null, 1, 'sanskrit', false, 60),

('hanuman-chalisa',
 'Hanuman Chalisa', 'हनुमान चालीसा', 'bhajan', 'hanuman', 'hindu',
 array['morning','difficult','festival'], null, null,
 null, 'CC0',
 'Hanuman Chalisa via Wikimedia Commons, Public Domain.',
 'https://commons.wikimedia.org/wiki/File:Hanuman_Chalisa.ogg',
 40, 'hindi', false, 70),

('vishnu-sahasranama',
 'Vishnu Sahasranama', 'विष्णु सहस्रनाम', 'stotram', 'vishnu', 'hindu',
 array['morning','meditation'], null, null,
 null, 'CC0',
 'Vishnu Sahasranama via Wikimedia Commons, Public Domain.',
 'https://commons.wikimedia.org/wiki/File:Vishnu_Sahasranama.ogg',
 108, 'sanskrit', false, 80),

('shree-suktam',
 'Shree Suktam', 'श्री सूक्तम्', 'stotram', 'devi', 'hindu',
 array['morning','festival'], null, null,
 null, 'CC0',
 'Shree Suktam Vedic chant, Public Domain.',
 'https://commons.wikimedia.org/wiki/File:Shree_Suktam.ogg',
 16, 'sanskrit', false, 90),

('devi-stuti',
 'Devi Stuti', 'देवी स्तुति', 'stotram', 'devi', 'hindu',
 array['morning','festival'], null, null,
 null, 'CC0',
 'Devi Stuti chant, Public Domain.',
 null, 8, 'sanskrit', false, 100),

('kirtana-hindi',
 'Kirtana in Hindi', 'कीर्तन', 'kirtan', 'universal', 'hindu',
 array['festival','evening'], null, null,
 null, 'CC-BY',
 'Kirtana in Hindi via Wikimedia Commons.',
 'https://commons.wikimedia.org/wiki/File:Kirtana_in_Hindi.ogg',
 null, 'hindi', false, 110),

-- ── Sikh ──────────────────────────────────────────────────────────────────────
('waheguru-simran',
 'Waheguru Simran', 'ਵਾਹਿਗੁਰੂ ਸਿਮਰਨ', 'simran', 'universal', 'sikh',
 array['morning','meditation'], null, null,
 null, 'CC0',
 'Waheguru Simran, Public Domain Sikh chant.',
 null, null, 'punjabi', false, 10),

('japji-sahib',
 'Japji Sahib (Excerpt)', 'ਜਪੁ ਜੀ ਸਾਹਿਬ', 'simran', 'universal', 'sikh',
 array['morning'], null, null,
 null, 'CC0',
 'Japji Sahib, Public Domain scripture of Sikhism.',
 null, null, 'punjabi', false, 20),

-- ── Buddhist ─────────────────────────────────────────────────────────────────
('heart-sutra',
 'Heart Sutra', 'प्रज्ञापारमिता हृदय सूत्र', 'dhyana', 'universal', 'buddhist',
 array['meditation','morning'], null, null,
 null, 'CC0',
 'Heart Sutra chant, Public Domain Buddhist text.',
 null, null, 'pali', false, 10),

('om-mani-padme-hum',
 'Om Mani Padme Hum', 'ॐ मणि पद्मे हूँ', 'mantra', 'universal', 'buddhist',
 array['meditation','difficult'], null, null,
 null, 'CC0',
 'Om Mani Padme Hum mantra, Public Domain.',
 null, 1, 'sanskrit', false, 20),

-- ── Jain ─────────────────────────────────────────────────────────────────────
('namokar-mantra',
 'Namokar Mantra', 'णमोकार मंत्र', 'mantra', 'universal', 'jain',
 array['morning','meditation'], null, null,
 null, 'CC0',
 'Namokar Mantra (Navkar Mantra), Public Domain Jain chant.',
 null, 1, 'sanskrit', false, 10)

on conflict (id) do update set
  title            = excluded.title,
  title_devanagari = excluded.title_devanagari,
  type             = excluded.type,
  deity            = excluded.deity,
  tradition        = excluded.tradition,
  mood             = excluded.mood,
  license          = excluded.license,
  attribution_text = excluded.attribution_text,
  source_url       = excluded.source_url,
  verse_count      = excluded.verse_count,
  language         = excluded.language,
  sort_order       = excluded.sort_order;

-- ── Instructions ─────────────────────────────────────────────────────────────
-- After uploading each .mp3 to the 'devotional-audio' Supabase Storage bucket:
--
-- update public.devotional_tracks
-- set audio_url = 'https://[project-ref].supabase.co/storage/v1/object/public/devotional-audio/hindu/gayatri-mantra.mp3',
--     is_active  = true,
--     duration_secs = 22,
--     creator = 'Rameshvar'
-- where id = 'gayatri-mantra';
