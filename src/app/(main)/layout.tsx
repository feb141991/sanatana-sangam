import { redirect } from 'next/navigation';
import { getAuthUser, getSupabaseClient } from '@/lib/auth-cache';
import BottomNav from '@/components/layout/BottomNav';
import AIChatFABWrapper from '@/components/layout/AIChatFABWrapper';
import { TraditionSync } from '@/components/providers/TraditionSync';
import { LocationProvider } from '@/lib/LocationContext';
import { EngineProvider } from '@/contexts/EngineContext';
import { LanguageProvider } from '@/lib/i18n/LanguageContext';
import type { AppLang } from '@/lib/i18n/translations';

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthUser();
  const userId = user?.id ?? '';
  // Reuse the same cached client — prevents token-refresh divergence
  const supabase = await getSupabaseClient();

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
      .select('latitude, longitude, city, country, country_code, tradition, full_name, username, app_language, is_banned')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile) {
      redirect('/auth/sign-out?reason=missing_profile');
    }

    // Enforce suspension
    if (profile.is_banned) {
      redirect('/banned');
    }

    // NOTE: onboarding redirect intentionally removed from layout.
    // The layout wraps /onboarding itself — redirecting here caused an
    // infinite loop (layout → redirect /onboarding → layout → repeat).
    // Onboarding gate lives in home/page.tsx only.

    savedLat         = profile.latitude     ?? null;
    savedLon         = profile.longitude    ?? null;
    savedCity        = profile.city         ?? '';
    savedCountry     = profile.country      ?? '';
    savedCountryCode = profile.country_code ?? '';
    userName         = profile.full_name ?? profile.username ?? 'Sadhak';
    tradition        = profile.tradition ?? 'hindu';
    const rawLang = profile.app_language ?? 'en';
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
        <AIChatFABWrapper userId={userId} tradition={tradition} userName={userName} isGuest={!user} appLanguage={appLanguage} />
        {/* Persist tradition to localStorage for cold-start loader */}
        {user && <TraditionSync tradition={tradition} />}
      </div>
    </LanguageProvider>
  );
}
