-- ─── Migration v57 — Akasha Repair & Persistence ──────────────────

-- 1. Create the missing Shlokas table (The foundation of Akasha Sync)
CREATE TABLE IF NOT EXISTS public.shlokas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    devanagari TEXT NOT NULL,
    translation TEXT,
    sync_metadata JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for Shlokas
ALTER TABLE public.shlokas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view shlokas" ON public.shlokas;
CREATE POLICY "Anyone can view shlokas" ON public.shlokas FOR SELECT TO authenticated USING (true);

-- 2. Add cover_url to Profiles for Home Persistence
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cover_url TEXT;

-- 3. Upgrade Storage RLS to be more robust
-- We use a direct path split to verify membership without relying on foldername helpers
DROP POLICY IF EXISTS "Guardians can manage kul assets" ON storage.objects;
DROP POLICY IF EXISTS "Guardians can upload kul assets" ON storage.objects;

CREATE POLICY "Guardians can manage kul assets"
  ON storage.objects FOR ALL
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (string_to_array(name, '/'))[1] = 'kuls'
    AND (string_to_array(name, '/'))[2] = public.auth_kul_id()::text
    AND public.auth_kul_role() = 'guardian'
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND (string_to_array(name, '/'))[1] = 'kuls'
    AND (string_to_array(name, '/'))[2] = public.auth_kul_id()::text
    AND public.auth_kul_role() = 'guardian'
  );

-- 4. Harden Profile Updates
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 5. Seeding initial Gold Standard content (Now that table exists)
INSERT INTO public.shlokas (id, name, devanagari, translation, sync_metadata)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'Gita 2.47',
    'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन । मा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि ॥',
    'You have a right to perform your prescribed duties, but you are not entitled to the fruits of your actions.',
    '[
        {"start": 0,    "end": 800,  "word": "कर्मण्ये"},
        {"start": 800,  "end": 1800, "word": "वाधिकारस्ते"},
        {"start": 1800, "end": 2400, "word": "मा"},
        {"start": 2400, "end": 3200, "word": "फलेषु"},
        {"start": 3200, "end": 4200, "word": "कदाचन"},
        {"start": 4200, "end": 5000, "word": "।"},
        {"start": 5000, "end": 5800, "word": "मा"},
        {"start": 5800, "end": 6800, "word": "कर्मफलहेतुर्भूर्मा"},
        {"start": 6800, "end": 7400, "word": "ते"},
        {"start": 7400, "end": 8200, "word": "सङ्गोऽस्त्वकर्मणि"},
        {"start": 8200, "end": 9000, "word": "।।"}
    ]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  devanagari = EXCLUDED.devanagari,
  translation = EXCLUDED.translation,
  sync_metadata = EXCLUDED.sync_metadata;
