-- ─── Migration v59 — Tirtha Companion MVP ───────────────────────────────────
-- Canonical sacred places, private-first saves/check-ins, visit memory, and
-- shell tables for notes/media/collections/reports.

CREATE TABLE IF NOT EXISTS public.tirtha_places (
  id                text PRIMARY KEY,
  source            text NOT NULL DEFAULT 'overpass',
  source_id         text,
  name              text NOT NULL,
  tradition         text NOT NULL DEFAULT 'other',
  lat               double precision NOT NULL,
  lon               double precision NOT NULL,
  address           text,
  website           text,
  phone             text,
  opening_hours     text,
  deity             text,
  sampradaya        text,
  source_confidence text NOT NULL DEFAULT 'community_import',
  created_by        uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tirtha_saves (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  place_id   text NOT NULL REFERENCES public.tirtha_places(id) ON DELETE CASCADE,
  note       text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, place_id)
);

CREATE TABLE IF NOT EXISTS public.tirtha_checkins (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  place_id          text NOT NULL REFERENCES public.tirtha_places(id) ON DELETE CASCADE,
  visited_at        timestamptz NOT NULL DEFAULT now(),
  privacy           text NOT NULL DEFAULT 'private'
    CHECK (privacy IN ('private', 'family', 'mandali', 'public')),
  darshan_mood      text,
  intention         text,
  reflection        text,
  companions        text,
  family_member_ids uuid[] NOT NULL DEFAULT '{}',
  pradakshina_count integer NOT NULL DEFAULT 0 CHECK (pradakshina_count >= 0),
  seva_note         text,
  photo_url         text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tirtha_place_notes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id   text NOT NULL REFERENCES public.tirtha_places(id) ON DELETE CASCADE,
  user_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  note_type  text NOT NULL DEFAULT 'practical'
    CHECK (note_type IN ('practical', 'etiquette', 'accessibility', 'parking', 'timing', 'seva', 'correction')),
  body       text NOT NULL,
  status     text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tirtha_place_media (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id    text NOT NULL REFERENCES public.tirtha_places(id) ON DELETE CASCADE,
  user_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  media_url   text NOT NULL,
  media_type  text NOT NULL DEFAULT 'photo',
  license     text,
  status      text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tirtha_collections (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text UNIQUE NOT NULL,
  title       text NOT NULL,
  description text,
  tradition   text NOT NULL DEFAULT 'all',
  season_key  text,
  place_ids   text[] NOT NULL DEFAULT '{}',
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tirtha_reports (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  place_id    text REFERENCES public.tirtha_places(id) ON DELETE CASCADE,
  reason      text NOT NULL
    CHECK (reason IN ('wrong_location', 'closed', 'duplicate', 'tradition_mismatch', 'inappropriate', 'other')),
  details     text,
  status      text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'reviewing', 'resolved', 'dismissed')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tirtha_places_tradition ON public.tirtha_places(tradition);
CREATE INDEX IF NOT EXISTS idx_tirtha_places_location ON public.tirtha_places(lat, lon);
CREATE INDEX IF NOT EXISTS idx_tirtha_saves_user ON public.tirtha_saves(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tirtha_checkins_user ON public.tirtha_checkins(user_id, visited_at DESC);
CREATE INDEX IF NOT EXISTS idx_tirtha_checkins_place ON public.tirtha_checkins(place_id, visited_at DESC);

ALTER TABLE public.tirtha_places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tirtha_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tirtha_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tirtha_place_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tirtha_place_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tirtha_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tirtha_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read tirtha places" ON public.tirtha_places;
CREATE POLICY "Public can read tirtha places"
  ON public.tirtha_places FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can import tirtha places" ON public.tirtha_places;
CREATE POLICY "Authenticated users can import tirtha places"
  ON public.tirtha_places FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by OR created_by IS NULL);

DROP POLICY IF EXISTS "Authenticated users can refresh imported tirtha places" ON public.tirtha_places;
CREATE POLICY "Authenticated users can refresh imported tirtha places"
  ON public.tirtha_places FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users manage own tirtha saves" ON public.tirtha_saves;
CREATE POLICY "Users manage own tirtha saves"
  ON public.tirtha_saves FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users read own and public tirtha checkins" ON public.tirtha_checkins;
CREATE POLICY "Users read own and public tirtha checkins"
  ON public.tirtha_checkins FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR privacy = 'public');

DROP POLICY IF EXISTS "Users create own tirtha checkins" ON public.tirtha_checkins;
CREATE POLICY "Users create own tirtha checkins"
  ON public.tirtha_checkins FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own tirtha checkins" ON public.tirtha_checkins;
CREATE POLICY "Users update own tirtha checkins"
  ON public.tirtha_checkins FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public can read approved tirtha notes" ON public.tirtha_place_notes;
CREATE POLICY "Public can read approved tirtha notes"
  ON public.tirtha_place_notes FOR SELECT
  USING (status = 'approved' OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Users create tirtha notes" ON public.tirtha_place_notes;
CREATE POLICY "Users create tirtha notes"
  ON public.tirtha_place_notes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public can read approved tirtha media" ON public.tirtha_place_media;
CREATE POLICY "Public can read approved tirtha media"
  ON public.tirtha_place_media FOR SELECT
  USING (status = 'approved' OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Users create tirtha media" ON public.tirtha_place_media;
CREATE POLICY "Users create tirtha media"
  ON public.tirtha_place_media FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public can read active tirtha collections" ON public.tirtha_collections;
CREATE POLICY "Public can read active tirtha collections"
  ON public.tirtha_collections FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Users create tirtha reports" ON public.tirtha_reports;
CREATE POLICY "Users create tirtha reports"
  ON public.tirtha_reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users read own tirtha reports" ON public.tirtha_reports;
CREATE POLICY "Users read own tirtha reports"
  ON public.tirtha_reports FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
