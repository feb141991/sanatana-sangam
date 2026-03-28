import { createServerSupabaseClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import HomeDashboard from './HomeDashboard';
import { getTodayShloka } from '@/lib/shlokas';
import { getNextFestival, daysUntil, getTodayPanchang } from '@/lib/festivals';

export default async function HomePage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, username, city, country, latitude, longitude, shloka_streak, last_shloka_date, sampradaya, tradition, custom_greeting')
    .eq('id', user.id)
    .single();

  const shloka   = getTodayShloka();
  const festival = getNextFestival();
  const daysLeft = festival ? daysUntil(festival.date) : null;

  const panchang = getTodayPanchang(
    profile?.latitude  ?? undefined,
    profile?.longitude ?? undefined
  );

  return (
    <HomeDashboard
      userId={user.id}
      userName={profile?.full_name ?? profile?.username ?? 'Sanatani'}
      city={profile?.city ?? ''}
      savedLat={profile?.latitude  ?? null}
      savedLon={profile?.longitude ?? null}
      shloka={shloka}
      festival={festival}
      daysUntilFestival={daysLeft}
      initialPanchang={panchang}
      shlokaStreak={profile?.shloka_streak ?? 0}
      lastShlokaDate={profile?.last_shloka_date ?? null}
      tradition={profile?.tradition       ?? null}
      sampradaya={profile?.sampradaya     ?? null}
      customGreeting={(profile as any)?.custom_greeting ?? null}
    />
  );
}
