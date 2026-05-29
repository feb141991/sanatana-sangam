import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import BottomNav from '@/components/layout/BottomNav';
import TopBar from '@/components/layout/TopBar';
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
  let avatarUrl:        string | null = null;
  let userInitials:     string        = 'SS';
  let wantsFestivalReminders    = true;
  let wantsShlokaReminders      = true;
  let wantsNityaReminders       = true;
  let wantsCommunityNotifications = true;
  let wantsFamilyNotifications    = true;

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select(`latitude, longitude, city, country, country_code, tradition,
               full_name, username, app_language, is_banned, avatar_url,
               wants_festival_reminders, wants_shloka_reminders,
               wants_nitya_reminders, wants_community_notifications,
               wants_family_notifications`)
      .eq('id', user.id)
      .single();

    // Enforce suspension
    if (profile?.is_banned) {
      redirect('/banned');
    }

    // NOTE: onboarding redirect intentionally removed from layout.
    // The layout wraps /onboarding itself — redirecting here caused an
    // infinite loop (layout → redirect /onboarding → layout → repeat).
    // Onboarding gate lives in home/page.tsx only.

    savedLat         = profile?.latitude     ?? null;
    savedLon         = profile?.longitude    ?? null;
    savedCity        = profile?.city         ?? '';
    savedCountry     = profile?.country      ?? '';
    savedCountryCode = profile?.country_code ?? '';
    userName         = profile?.full_name ?? profile?.username ?? 'Sadhak';
    tradition        = profile?.tradition ?? 'hindu';
    avatarUrl        = (profile as any)?.avatar_url ?? null;

    // Derive initials from name
    const nameParts = userName.trim().split(/\s+/);
    userInitials = nameParts.length >= 2
      ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
      : userName.slice(0, 2).toUpperCase();

    const rawLang = profile?.app_language ?? 'en';
    appLanguage = (['en', 'hi', 'pa'] as AppLang[]).includes(rawLang as AppLang)
      ? (rawLang as AppLang)
      : 'en';

    wantsFestivalReminders      = (profile as any)?.wants_festival_reminders    ?? true;
    wantsShlokaReminders        = (profile as any)?.wants_shloka_reminders      ?? true;
    wantsNityaReminders         = (profile as any)?.wants_nitya_reminders       ?? true;
    wantsCommunityNotifications = (profile as any)?.wants_community_notifications ?? true;
    wantsFamilyNotifications    = (profile as any)?.wants_family_notifications   ?? true;
  }

  return (
    <LanguageProvider lang={appLanguage}>
      <div className="min-h-screen flex flex-col">
        {user && (
          <TopBar
            userId={userId}
            isGuest={false}
            avatarUrl={avatarUrl}
            userInitials={userInitials}
            tradition={tradition}
            city={savedCity || null}
            countryCode={savedCountryCode || null}
            wantsFestivalReminders={wantsFestivalReminders}
            wantsShlokaReminders={wantsShlokaReminders}
            wantsNityaReminders={wantsNityaReminders}
            wantsCommunityNotifications={wantsCommunityNotifications}
            wantsFamilyNotifications={wantsFamilyNotifications}
          />
        )}
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
