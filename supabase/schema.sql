-- ══════════════════════════════════════════════════════════════════
--  SANATANA SANGAM — Supabase Database Schema
--  Run this in: Supabase Dashboard → SQL Editor → New Query
-- ══════════════════════════════════════════════════════════════════

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";  -- for geo queries (optional, enable in Supabase dashboard)

-- ─── PROFILES ───────────────────────────────────────────────────
CREATE TABLE public.profiles (
  id               UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at       TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at       TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  full_name        TEXT NOT NULL,
  username         TEXT UNIQUE NOT NULL,
  avatar_url       TEXT,
  bio              TEXT,
  city             TEXT,
  country          TEXT,
  latitude         DOUBLE PRECISION,
  longitude        DOUBLE PRECISION,
  sampradaya       TEXT,
  ishta_devata     TEXT,
  spiritual_level  TEXT DEFAULT 'jigyasu',
  kul              TEXT,
  gotra            TEXT,
  languages        TEXT[]  DEFAULT ARRAY['en'],
  seeking          TEXT[]  DEFAULT ARRAY[]::TEXT[],
  seva_score       INTEGER DEFAULT 0,
  mandali_id       UUID
);

-- ─── MANDALIS ───────────────────────────────────────────────────
CREATE TABLE public.mandalis (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  name         TEXT NOT NULL,
  city         TEXT NOT NULL,
  country      TEXT NOT NULL,
  latitude     DOUBLE PRECISION NOT NULL,
  longitude    DOUBLE PRECISION NOT NULL,
  radius_km    DOUBLE PRECISION DEFAULT 10,
  member_count INTEGER DEFAULT 0,
  description  TEXT
);

-- Add FK from profiles to mandalis
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_mandali_id_fkey
  FOREIGN KEY (mandali_id) REFERENCES public.mandalis(id) ON DELETE SET NULL;

-- ─── POSTS (Mandali feed) ────────────────────────────────────────
CREATE TABLE public.posts (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at     TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at     TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  author_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mandali_id     UUID REFERENCES public.mandalis(id) ON DELETE CASCADE,
  content        TEXT NOT NULL,
  type           TEXT DEFAULT 'update' CHECK (type IN ('update','event','question','announcement')),
  upvotes        INTEGER DEFAULT 0,
  comment_count  INTEGER DEFAULT 0,
  is_pinned      BOOLEAN DEFAULT FALSE,
  event_date     TIMESTAMPTZ,
  event_location TEXT
);

-- ─── FORUM THREADS ──────────────────────────────────────────────
CREATE TABLE public.forum_threads (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at        TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at        TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  author_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category          TEXT NOT NULL,
  title             TEXT NOT NULL,
  body              TEXT NOT NULL,
  upvotes           INTEGER DEFAULT 0,
  reply_count       INTEGER DEFAULT 0,
  is_answered       BOOLEAN DEFAULT FALSE,
  is_pinned         BOOLEAN DEFAULT FALSE,
  tags              TEXT[] DEFAULT ARRAY[]::TEXT[],
  sampradaya_filter TEXT
);

-- ─── FORUM REPLIES ──────────────────────────────────────────────
CREATE TABLE public.forum_replies (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  thread_id   UUID NOT NULL REFERENCES public.forum_threads(id) ON DELETE CASCADE,
  author_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body        TEXT NOT NULL,
  upvotes     INTEGER DEFAULT 0,
  is_accepted BOOLEAN DEFAULT FALSE,
  parent_id   UUID REFERENCES public.forum_replies(id) ON DELETE CASCADE
);

-- ─── UPVOTES ────────────────────────────────────────────────────
CREATE TABLE public.post_upvotes (
  post_id    UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  PRIMARY KEY (post_id, user_id)
);

CREATE TABLE public.thread_upvotes (
  thread_id  UUID NOT NULL REFERENCES public.forum_threads(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  PRIMARY KEY (thread_id, user_id)
);

-- ─── INDEXES ────────────────────────────────────────────────────
CREATE INDEX idx_posts_mandali       ON public.posts(mandali_id, created_at DESC);
CREATE INDEX idx_posts_author        ON public.posts(author_id);
CREATE INDEX idx_threads_category    ON public.forum_threads(category, created_at DESC);
CREATE INDEX idx_threads_author      ON public.forum_threads(author_id);
CREATE INDEX idx_replies_thread      ON public.forum_replies(thread_id, created_at ASC);
CREATE INDEX idx_profiles_mandali    ON public.profiles(mandali_id);
CREATE INDEX idx_profiles_location   ON public.profiles(latitude, longitude);

-- ─── UPDATED_AT TRIGGER ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at      BEFORE UPDATE ON public.profiles       FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER set_posts_updated_at         BEFORE UPDATE ON public.posts           FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER set_forum_threads_updated_at BEFORE UPDATE ON public.forum_threads   FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- ─── AUTO-CREATE PROFILE ON SIGNUP ──────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Sanatani'),
    COALESCE(NEW.raw_user_meta_data->>'username',  'user_' || substr(NEW.id::text, 1, 8))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ─── MANDALI MEMBER COUNT TRIGGER ───────────────────────────────
CREATE OR REPLACE FUNCTION public.update_mandali_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.mandali_id IS DISTINCT FROM NEW.mandali_id THEN
      IF OLD.mandali_id IS NOT NULL THEN
        UPDATE public.mandalis SET member_count = member_count - 1 WHERE id = OLD.mandali_id;
      END IF;
      IF NEW.mandali_id IS NOT NULL THEN
        UPDATE public.mandalis SET member_count = member_count + 1 WHERE id = NEW.mandali_id;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_profile_mandali_change
  AFTER UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.update_mandali_member_count();

-- ─── ROW LEVEL SECURITY ─────────────────────────────────────────
ALTER TABLE public.profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mandalis        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_threads   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_replies   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_upvotes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thread_upvotes  ENABLE ROW LEVEL SECURITY;

-- Profiles: public read, own write
CREATE POLICY "Public profiles are viewable by everyone"  ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile"              ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile"              ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Mandalis: public read, authenticated create
CREATE POLICY "Mandalis viewable by all"    ON public.mandalis FOR SELECT USING (true);
CREATE POLICY "Authenticated can create"    ON public.mandalis FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Posts: public read, own write/delete
CREATE POLICY "Posts viewable by all"         ON public.posts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can post"  ON public.posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can update own posts"  ON public.posts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Authors can delete own posts"  ON public.posts FOR DELETE USING (auth.uid() = author_id);

-- Forum threads: same pattern
CREATE POLICY "Threads viewable by all"           ON public.forum_threads FOR SELECT USING (true);
CREATE POLICY "Authenticated can create threads"  ON public.forum_threads FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can update threads"        ON public.forum_threads FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Authors can delete threads"        ON public.forum_threads FOR DELETE USING (auth.uid() = author_id);

-- Replies
CREATE POLICY "Replies viewable by all"           ON public.forum_replies FOR SELECT USING (true);
CREATE POLICY "Authenticated can reply"           ON public.forum_replies FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can update replies"        ON public.forum_replies FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Authors can delete replies"        ON public.forum_replies FOR DELETE USING (auth.uid() = author_id);

-- Upvotes
CREATE POLICY "Upvotes viewable by all"       ON public.post_upvotes   FOR SELECT USING (true);
CREATE POLICY "Users can manage own upvotes"  ON public.post_upvotes   FOR ALL    USING (auth.uid() = user_id);
CREATE POLICY "Thread upvotes viewable"       ON public.thread_upvotes FOR SELECT USING (true);
CREATE POLICY "Users manage thread upvotes"   ON public.thread_upvotes FOR ALL    USING (auth.uid() = user_id);

-- ─── SEED: Default Mandalis ──────────────────────────────────────
INSERT INTO public.mandalis (name, city, country, latitude, longitude, radius_km) VALUES
  ('London Mandali',      'London',    'UK',        51.5074, -0.1278,  15),
  ('Leicester Mandali',   'Leicester', 'UK',        52.6369, -1.1398,  10),
  ('Birmingham Mandali',  'Birmingham','UK',        52.4862, -1.8904,  12),
  ('Toronto Mandali',     'Toronto',   'Canada',    43.6532, -79.3832, 15),
  ('New York Mandali',    'New York',  'USA',       40.7128, -74.0060, 20),
  ('Mumbai Mandali',      'Mumbai',    'India',     19.0760,  72.8777, 20),
  ('Delhi Mandali',       'Delhi',     'India',     28.6139,  77.2090, 25),
  ('Sydney Mandali',      'Sydney',    'Australia', -33.8688, 151.2093,15),
  ('Singapore Mandali',   'Singapore', 'Singapore',  1.3521, 103.8198, 10),
  ('Mauritius Mandali',   'Port Louis','Mauritius', -20.1609, 57.4989,  5);
