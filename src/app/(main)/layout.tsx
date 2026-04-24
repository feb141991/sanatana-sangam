import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import BottomNav from '@/components/layout/BottomNav';
import FloatingPill from '@/components/layout/FloatingPill';
import AIChatFAB from '@/components/layout/AIChatFAB';
import { LocationProvider } from '@/lib/LocationContext';
import { getTraditionMeta } from '@/lib/tradition-config';
import { getInitials } from '@/lib/utils';
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
  let libraryLabel:     string        = 'Pathshala';
  let libraryMobileLabel: string      = 'Pathshala';
  let avatarUrl:        string | null = null;
  let userInitials:     string        = 'SS';
  let userName:         string        = 'Sadhak';
  let tradition:        string        = 'hindu';
  let wantsFestivalReminders          = true;
  let wantsShlokaReminders            = true;
  let wantsCommunityNotifications     = true;
  let wantsFamilyNotifications        = true;
  let appLanguage: AppLang            = 'en';

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('latitude, longitude, city, country, country_code, tradition, avatar_url, full_name, username, wants_festival_reminders, wants_shloka_reminders, wants_community_notifications, wants_family_notifications, onboarding_completed, app_language')
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
    libraryLabel     = getTraditionMeta(profile?.tradition).navLibraryLabel;
    libraryMobileLabel = 'Pathshala';
    avatarUrl        = profile?.avatar_url ?? null;
    userInitials     = getInitials(profile?.full_name ?? profile?.username ?? 'Sanatana');
    userName         = profile?.full_name ?? profile?.username ?? 'Sadhak';
    tradition        = profile?.tradition ?? 'hindu';
    wantsFestivalReminders = profile?.wants_festival_reminders ?? true;
    wantsShlokaReminders = profile?.wants_shloka_reminders ?? true;
    wantsCommunityNotifications = profile?.wants_community_notifications ?? true;
    wantsFamilyNotifications = profile?.wants_family_notifications ?? true;
    const rawLang = profile?.app_language ?? 'en';
    appLanguage = (['en', 'hi', 'pa'] as AppLang[]).includes(rawLang as AppLang)
      ? (rawLang as AppLang)
      : 'en';
  }

  return (
    <LanguageProvider lang={appLanguage}>
      <div className="min-h-screen flex flex-col">
        <FloatingPill
          userId={userId}
          isGuest={!user}
          avatarUrl={avatarUrl}
          userInitials={userInitials}
          tradition={tradition}
          city={savedCity}
          countryCode={savedCountryCode}
          wantsFestivalReminders={wantsFestivalReminders}
          wantsShlokaReminders={wantsShlokaReminders}
          wantsCommunityNotifications={wantsCommunityNotifications}
          wantsFamilyNotifications={wantsFamilyNotifications}
        />
        <main className="flex-1 max-w-2xl mx-auto w-full px-3 pt-2 pb-28 sm:px-4">
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
        <BottomNav libraryLabel={libraryLabel} libraryMobileLabel={libraryMobileLabel} isGuest={!user} />
        <AIChatFAB userId={userId} tradition={tradition} userName={userName} isGuest={!user} />
      </div>
    </LanguageProvider>
  );
}
