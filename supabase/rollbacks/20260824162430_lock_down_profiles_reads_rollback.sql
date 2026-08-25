DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
ALTER TABLE public.profiles NO FORCE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles
  FOR SELECT
  TO PUBLIC
  USING (true);

GRANT ALL ON TABLE public.profiles TO anon, authenticated;
