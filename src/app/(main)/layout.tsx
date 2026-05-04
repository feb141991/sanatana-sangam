import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import BottomNav from '@/components/layout/BottomNav';
import AIChatFAB from '@/components/layout/AIChatFAB';
import { LocationProvider } from '@/lib/LocationContext';
import { EngineProvider } from '@/contexts/EngineContext';
import { LanguageProvider } from '@/lib/i18n/LanguageContext';
import type { AppLang } from '@/lib/i18n/translations';

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
  let userName:         string        = 'Sadhak';
  let tradition:        string        = 'hindu';
  let appLanguage: AppLang            = 'en';

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('latitude, longitude, city, country, country_code, tradition, full_name, username, onboarding_completed, app_language')
      .eq('id', user.id)
      .single();

    // New users who haven't completed onboarding go there first
    if (profile && !profile.onboarding_completed) {
      redirect('/onboarding');
    }

    savedLat         = profile?.latitude     ?? null;
    savedLon         = profile?.longitude    ?? null;
    savedCity        = profile?.city         ?? '';
    savedCountry     = profile?.country      ?? '';
    savedCountryCode = profile?.country_code ?? '';
    userName         = profile?.full_name ?? profile?.username ?? 'Sadhak';
    tradition        = profile?.tradition ?? 'hindu';
    const rawLang = profile?.app_language ?? 'en';
    appLanguage = (['en', 'hi', 'pa'] as AppLang[]).includes(rawLang as AppLang)
      ? (rawLang as AppLang)
      : 'en';
  }

  return (
    <LanguageProvider lang={appLanguage}>
      <div className="min-h-screen flex flex-col">
        <main className="flex-1 max-w-2xl mx-auto w-full px-3 pt-0 pb-28 sm:px-4">
          <EngineProvider userId={userId || null} tradition={tradition}>
            <LocationProvider
              savedLat={savedLat}
              savedLon={savedLon}
              savedCity={savedCity}
              savedCountry={savedCountry}
              savedCountryCode={savedCountryCode}
            >
              {children}
            </LocationProvider>
          </EngineProvider>
        </main>
        <BottomNav isGuest={!user} />
        <AIChatFAB userId={userId} tradition={tradition} userName={userName} isGuest={!user} />
      </div>
    </LanguageProvider>
  );
}
