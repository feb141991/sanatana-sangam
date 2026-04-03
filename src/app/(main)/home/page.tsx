import { createServerSupabaseClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import HomeDashboard from './HomeDashboard';
import { getTodayShloka } from '@/lib/shlokas';
import { getNextFestival, daysUntil, getTodayPanchang } from '@/lib/festivals';
import { getDailySacredText, getDayOfYear } from '@/lib/sacred-texts';
import { getTraditionMeta } from '@/lib/tradition-config';
import type { GuidedPathProgressRow } from '@/lib/guided-paths';

export default async function HomePage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, username, city, country, latitude, longitude, shloka_streak, last_shloka_date, sampradaya, tradition, spiritual_level, seeking, custom_greeting')
    .eq('id', user.id)
    .single();

  const { data: guidedPathProgress } = await supabase
    .from('guided_path_progress')
    .select('path_id, status, completed_at, updated_at')
    .eq('user_id', user.id);

  const tradition = profile?.tradition ?? null;
  const dayIndex  = getDayOfYear();

  // Tradition-aware daily sacred text
  // Hindu + other use shlokas.ts; other traditions use sacred-texts.ts
  const shloka     = getTodayShloka();
  const sacredText = getDailySacredText(tradition, dayIndex); // null for Hindu

  // Tradition-aware festival: shows their tradition's next festival first
  const festival = getNextFestival(new Date(), tradition);
  const daysLeft = festival ? daysUntil(festival.date) : null;

  const panchang = getTodayPanchang(
    profile?.latitude  ?? undefined,
    profile?.longitude ?? undefined,
  );

  const meta = getTraditionMeta(tradition);

  return (
    <HomeDashboard
      userId={user.id}
      userName={profile?.full_name ?? profile?.username ?? 'Sanatani'}
      city={profile?.city ?? ''}
      savedLat={profile?.latitude  ?? null}
      savedLon={profile?.longitude ?? null}
      shloka={shloka}
      sacredText={sacredText}
      sacredTextMeta={{
        label:       meta.sacredTextLabel,
        icon:        meta.sacredTextIcon,
        shareLabel:  meta.sacredTextShareLabel,
        accentColour: meta.accentColour,
        accentLight: meta.accentLight,
      }}
      festival={festival}
      daysUntilFestival={daysLeft}
      initialPanchang={panchang}
      shlokaStreak={profile?.shloka_streak ?? 0}
      lastShlokaDate={profile?.last_shloka_date ?? null}
      tradition={tradition}
      sampradaya={profile?.sampradaya ?? null}
      spiritualLevel={profile?.spiritual_level ?? null}
      seeking={profile?.seeking ?? []}
      customGreeting={(profile as any)?.custom_greeting ?? null}
      guidedPathProgress={(guidedPathProgress as GuidedPathProgressRow[]) ?? []}
    />
  );
}
