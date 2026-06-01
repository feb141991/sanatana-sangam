-- ─── Migration v55 — Akasha Sync Engine & Sadhana Mastery ──────────────

-- 1. Extend Shlokas to support time-synchronized metadata
ALTER TABLE public.shlokas 
ADD COLUMN IF NOT EXISTS sync_metadata JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.shlokas.sync_metadata IS 'Array of {start: ms, end: ms, word: string, layer: "sanskrit"|"translation"}';

-- 2. Create Sadhana Mastery Tracker
-- This tracks how many times a user has successfully "mastered" a recitation.
CREATE TABLE IF NOT EXISTS public.sadhana_mastery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    shloka_id UUID NOT NULL REFERENCES public.shlokas(id) ON DELETE CASCADE,
    mastery_level FLOAT DEFAULT 0.0, -- 0.0 to 1.0 (Mastered)
    recitation_count INTEGER DEFAULT 0,
    last_practiced_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, shloka_id)
);

-- 3. RLS for Mastery
ALTER TABLE public.sadhana_mastery ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own mastery"
    ON public.sadhana_mastery
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 4. Utility function to update mastery
CREATE OR REPLACE FUNCTION public.increment_sadhana_mastery(p_shloka_id UUID)
RETURNS void AS $$
BEGIN
    INSERT INTO public.sadhana_mastery (user_id, shloka_id, recitation_count, last_practiced_at)
    VALUES (auth.uid(), p_shloka_id, 1, now())
    ON CONFLICT (user_id, shloka_id) 
    DO UPDATE SET 
        recitation_count = sadhana_mastery.recitation_count + 1,
        last_practiced_at = now(),
        mastery_level = LEAST(1.0, sadhana_mastery.mastery_level + 0.05); -- Increment mastery by 5% each time
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
