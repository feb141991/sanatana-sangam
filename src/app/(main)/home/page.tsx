import { createServerSupabaseClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import HomeDashboard from './HomeDashboard';
import { getTodayShloka } from '@/lib/shlokas';
import {
  attachFestivalTrust,
  buildFestivalCalendarMeta,
  daysUntil,
  FESTIVALS_2026,
  getNextFestival,
  getTodayPanchang,
} from '@/lib/festivals';
import { mapHeroAssetToTheme, type HeroAssetRow, type HomeHeroTheme } from '@/config/festivalThemes';
import { getDailySacredText, getDayOfYear } from '@/lib/sacred-texts';
import { getTraditionMeta } from '@/lib/tradition-config';
import type { GuidedPathProgressRow } from '@/lib/guided-paths';
import type { Festival, FestivalCalendarMeta } from '@/lib/festivals';
import type { Database } from '@/types/database';

export default async function HomePage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, username, avatar_url, city, country, latitude, longitude, shloka_streak, last_shloka_date, sampradaya, ishta_devata, tradition, spiritual_level, seeking, custom_greeting, life_stage, timezone')
    .eq('id', user.id)
    .single();

  const { data: guidedPathProgress } = await supabase
    .from('guided_path_progress')
    .select('path_id, status, completed_at, updated_at')
    .eq('user_id', user.id);

  const tradition = profile?.tradition ?? null;
  const dayIndex  = getDayOfYear();

  const { data: calendarRows } = await supabase
    .from('festivals')
    .select('name, date, emoji, description, type, tradition, source_name, source_kind, review_status')
    .order('date', { ascending: true })
    .limit(160);

  // Tradition-aware daily sacred text.
  // Explicit Hindu uses shlokas.ts; Sikh/Buddhist/Jain/exploring use sacred-texts.ts.
  const shloka     = getTodayShloka(profile?.timezone ?? undefined);
  const sacredText = getDailySacredText(tradition, dayIndex);

  const calendarFromDb = ((calendarRows ?? []) as Pick<Database['public']['Tables']['festivals']['Row'], 'name' | 'date' | 'emoji' | 'description' | 'type' | 'tradition' | 'source_name' | 'source_kind' | 'review_status'>[])
    .map((row) => attachFestivalTrust(row));

  const festivalCalendar = calendarFromDb.length > 0 ? calendarFromDb : FESTIVALS_2026;
  const festivalCalendarMeta: FestivalCalendarMeta = buildFestivalCalendarMeta(
    calendarFromDb.length > 0 ? 'database' : 'fallback',
    festivalCalendar,
  );

  // Tradition-aware festival: shows their tradition's next festival first
  const festival = getNextFestival(festivalCalendar, new Date(), tradition);
  const daysLeft = festival ? daysUntil(festival.date) : null;

  const { data: heroAssetRows } = await supabase
    .from('hero_assets')
    .select('id, label, hero_image, hero_alt, object_position, traditions, sampradayas, ishta_devatas, festival_slugs, priority, is_active')
    .eq('is_active', true)
    .order('priority', { ascending: false });

  const heroThemes = ((heroAssetRows ?? []) as HeroAssetRow[])
    .map(mapHeroAssetToTheme)
    .filter((theme): theme is HomeHeroTheme => Boolean(theme));

  const panchang = getTodayPanchang(
    profile?.latitude  ?? undefined,
    profile?.longitude ?? undefined,
  );

  // Japa streak from today's daily_sadhana record
  const today = new Date().toISOString().slice(0, 10);
  const { data: todaySadhana } = await supabase
    .from('daily_sadhana')
    .select('streak_count, japa_done')
    .eq('user_id', user.id)
    .eq('date', today)
    .single();

  // 28-day practice history for Practice Pulse heatmap
  const twentyEightDaysAgo = new Date();
  twentyEightDaysAgo.setDate(twentyEightDaysAgo.getDate() - 27);
  const historyFrom = twentyEightDaysAgo.toISOString().slice(0, 10);

  const [{ data: sadhanaHistory }, { data: nityaHistory }] = await Promise.all([
    supabase
      .from('daily_sadhana')
      .select('date, japa_done')
      .eq('user_id', user.id)
      .gte('date', historyFrom)
      .lte('date', today),
    supabase
      .from('nitya_karma_log')
      .select('log_date')
      .eq('user_id', user.id)
      .gte('log_date', historyFrom)
      .lte('log_date', today),
  ]);

  // Build nitya set (dates with any log entry = done)
  const nityaDates = new Set((nityaHistory ?? []).map(r => r.log_date));

  // Merge into DayDot[]
  const sadhanaMap: Record<string, boolean> = {};
  (sadhanaHistory ?? []).forEach(r => { sadhanaMap[r.date] = r.japa_done; });

  const practiceHistory = Array.from({ length: 28 }, (_, i) => {
    const d = new Date(twentyEightDaysAgo);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    return { date: dateStr, japa: sadhanaMap[dateStr] ?? false, nitya: nityaDates.has(dateStr) };
  });

  const meta = getTraditionMeta(tradition ?? 'other');
  const showFirstTimeGuidance = (
    (profile?.shloka_streak ?? 0) === 0
    && !profile?.last_shloka_date
    && ((guidedPathProgress?.length ?? 0) === 0)
  );

  return (
    <HomeDashboard
      userId={user.id}
      userName={profile?.full_name ?? profile?.username ?? 'Sanatani'}
      avatarUrl={profile?.avatar_url ?? null}
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
      festivalCalendar={festivalCalendar}
      festivalCalendarMeta={festivalCalendarMeta}
      heroThemes={heroThemes}
      daysUntilFestival={daysLeft}
      initialPanchang={panchang}
      shlokaStreak={profile?.shloka_streak ?? 0}
      lastShlokaDate={profile?.last_shloka_date ?? null}
      tradition={tradition}
      sampradaya={profile?.sampradaya ?? null}
      ishtaDevata={profile?.ishta_devata ?? null}
      spiritualLevel={profile?.spiritual_level ?? null}
      seeking={profile?.seeking ?? []}
      lifeStage={(profile as any)?.life_stage ?? null}
      customGreeting={(profile as any)?.custom_greeting ?? null}
      guidedPathProgress={(guidedPathProgress as GuidedPathProgressRow[]) ?? []}
      showFirstTimeGuidance={showFirstTimeGuidance}
      japaStreak={todaySadhana?.streak_count ?? 0}
      japaAlreadyDoneToday={todaySadhana?.japa_done ?? false}
      nityaDoneToday={nityaDates.has(today)}
      practiceHistory={practiceHistory}
    />
  );
}
