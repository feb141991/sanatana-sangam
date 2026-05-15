-- Add cover_url column to kuls table
ALTER TABLE public.kuls ADD COLUMN IF NOT EXISTS cover_url TEXT;

-- Ensure RLS allows guardians to update the cover_url
-- Assuming guardians are identified via kul_members table
CREATE POLICY "Guardians can update kul cover"
ON public.kuls
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.kul_members
    WHERE kul_members.kul_id = kuls.id
    AND kul_members.user_id = auth.uid()
    AND kul_members.role = 'guardian'
  )
);
