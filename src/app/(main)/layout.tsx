import { createServerSupabaseClient } from '@/lib/supabase-server';
import BottomNav from '@/components/layout/BottomNav';
import TopBar from '@/components/layout/TopBar';
import { LocationProvider } from '@/lib/LocationContext';
import { getTraditionMeta } from '@/lib/tradition-config';

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  const userId = user?.id ?? '';

  let savedLat:         number | null = null;
  let savedLon:         number | null = null;
  let savedCity:        string        = '';
  let savedCountry:     string        = '';
  let savedCountryCode: string        = '';
  let libraryLabel:     string        = 'Library';

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('latitude, longitude, city, country, country_code, tradition')
      .eq('id', user.id)
      .single();

    savedLat         = profile?.latitude     ?? null;
    savedLon         = profile?.longitude    ?? null;
    savedCity        = profile?.city         ?? '';
    savedCountry     = profile?.country      ?? '';
    savedCountryCode = profile?.country_code ?? '';
    libraryLabel     = getTraditionMeta(profile?.tradition).navLibraryLabel;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar userId={userId} isGuest={!user} />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 pt-4 pb-28">
        <LocationProvider
          savedLat={savedLat}
          savedLon={savedLon}
          savedCity={savedCity}
          savedCountry={savedCountry}
          savedCountryCode={savedCountryCode}
        >
          {children}
        </LocationProvider>
      </main>
      <BottomNav libraryLabel={libraryLabel} isGuest={!user} />
    </div>
  );
}
