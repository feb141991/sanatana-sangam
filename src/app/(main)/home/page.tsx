import { createServerSupabaseClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import HomeDashboard from './HomeDashboard';
import { getTodayShloka } from '@/lib/shlokas';
import {
  mapOccurrenceToFestival,
  buildFestivalCalendarMeta,
  daysUntil,
  FESTIVALS_2026,
  getNextFestivals,
  getTodayPanchang,
} from '@/lib/festivals';
import { mapHeroAssetToTheme, type HeroAssetRow, type HomeHeroTheme } from '@/config/festivalThemes';
import { getDailySacredText, getDayOfYear } from '@/lib/sacred-texts';
import { getTraditionMeta, getSacredTextLabel } from '@/lib/tradition-config';
import { LIVE_STREAMS } from '@/lib/live-streams';
import { getPlanById, type GuidedPathProgressRow } from '@/lib/guided-paths';
import type { Festival, FestivalCalendarMeta } from '@/lib/festivals';
import type { Database } from '@/types/database';


export default async function HomePage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, username, avatar_url, cover_url, city, country, latitude, longitude, shloka_streak, last_shloka_date, sampradaya, ishta_devata, tradition, spiritual_level, seeking, custom_greeting, life_stage, timezone, app_language, meaning_language, transliteration_language, show_transliteration, scripture_script, is_pro, subscription_status, subscription_expires_at, entitlement_source, entitlement_updated_at, karma_points, seva_score, is_admin')
    .eq('id', user.id)
    .single();

  const { data: guidedPathProgress } = await supabase
    .from('guided_path_progress')
    .select('path_id, status, completed_at, updated_at, current_lesson, completed_lessons')
    .eq('user_id', user.id);

  const tradition = profile?.tradition ?? null;
  const dayIndex  = getDayOfYear();

  const { data: calendarRows } = await supabase
    .from('observance_occurrences')
    .select('*, observance_definitions(*)')
    .order('date', { ascending: true })
    .limit(160);

  // Tradition-aware daily sacred text.
  // Explicit Hindu uses shlokas.ts; Sikh/Buddhist/Jain/exploring use sacred-texts.ts.
  const shloka     = getTodayShloka(profile?.timezone ?? undefined);
  const sacredText = getDailySacredText(tradition, dayIndex);

  const calendarFromDb = (calendarRows ?? []).map((row) => mapOccurrenceToFestival(row));

  const festivalCalendar = calendarFromDb.length > 0 ? calendarFromDb : FESTIVALS_2026;
  const festivalCalendarMeta: FestivalCalendarMeta = buildFestivalCalendarMeta(
    calendarFromDb.length > 0 ? 'database' : 'fallback',
    festivalCalendar,
  );

  // Tradition-aware festival: shows their tradition's next festival(s) first
  const festivals = getNextFestivals(festivalCalendar, new Date(), tradition);
  const festival  = festivals[0] ?? null;
  const daysLeft  = festival ? daysUntil(festival.date) : null;

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

  const twentyEightDaysAgo = new Date();
  twentyEightDaysAgo.setDate(twentyEightDaysAgo.getDate() - 27);
  const historyFrom = twentyEightDaysAgo.toISOString().slice(0, 10);

  const [{ data: sadhanaHistory }, { data: nityaHistory }, { data: liveDarshanData }, { data: malaSessionsToday }] = await Promise.all([
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
    supabase
      .from('live_darshans')
      .select('*')
      .eq('is_active', true),
    supabase
      .from('mala_sessions')
      .select('id')
      .eq('user_id', user.id)
      .gte('completed_at', `${today}T00:00:00Z`)
      .lte('completed_at', `${today}T23:59:59Z`)
      .limit(1),
  ]);

  const dbStreams = (liveDarshanData ?? []).map(row => ({
    id: row.id,
    title: row.title,
    location: row.location,
    schedule: row.schedule,
    category: row.category as any,
    tradition: row.tradition as any,
    youtubeVideoId: row.current_video_id || '',
  }));

  const allStreams = dbStreams.length > 0 ? dbStreams : LIVE_STREAMS;

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

  const meta      = getTraditionMeta(tradition ?? 'other');
  const appLanguage = profile?.app_language ?? 'en';
  const showFirstTimeGuidance = (
    (profile?.shloka_streak ?? 0) === 0
    && !profile?.last_shloka_date
    && ((guidedPathProgress?.length ?? 0) === 0)
  );

  const pathshalaDoneToday = (guidedPathProgress ?? []).some(
    (p: GuidedPathProgressRow) => p.updated_at && p.updated_at.startsWith(today)
  );

  const activePath = (guidedPathProgress ?? []).find((p: GuidedPathProgressRow) => p.status === 'active');
  let pathshalaLabel = 'Pathshala';
  let pathshalaHref = '/pathshala';

  if (activePath) {
    const plan = getPlanById(activePath.path_id);
    if (plan) {
      const currentDay = (activePath.current_lesson ?? 0) + 1;
      pathshalaLabel = `${plan.title} Day ${currentDay}`;
      pathshalaHref = pathshalaDoneToday 
        ? `/pathshala/${activePath.path_id}`
        : `/pathshala/${activePath.path_id}/lesson`;
    }
  }

  return (
    <HomeDashboard
      userId={user.id}
      userName={profile?.full_name ?? profile?.username ?? 'Seeker'}
      avatarUrl={profile?.avatar_url ?? null}
      city={profile?.city ?? ''}
      savedLat={profile?.latitude  ?? null}
      savedLon={profile?.longitude ?? null}
      shloka={shloka}
      sacredText={sacredText}
      sacredTextMeta={{
        label:       getSacredTextLabel(tradition, appLanguage),
        icon:        meta.sacredTextIcon,
        shareLabel:  meta.sacredTextShareLabel,
        accentColour: meta.accentColour,
        accentLight: meta.accentLight,
      }}
      festivals={festivals}
      festivalCalendar={festivalCalendar}
      festivalCalendarMeta={festivalCalendarMeta}
      heroThemes={heroThemes}
      daysUntilFestival={daysLeft}
      initialPanchang={panchang as any}
      shlokaStreak={profile?.shloka_streak ?? 0}
      lastShlokaDate={profile?.last_shloka_date ?? null}
      tradition={tradition}
      sampradaya={profile?.sampradaya ?? null}
      ishtaDevata={profile?.ishta_devata ?? null}
      spiritualLevel={profile?.spiritual_level ?? null}
      seeking={profile?.seeking ?? []}
      lifeStage={(profile as any)?.life_stage ?? null}
      customGreeting={(profile as any)?.custom_greeting ?? null}
      coverUrl={profile?.cover_url ?? null}
      guidedPathProgress={(guidedPathProgress as GuidedPathProgressRow[]) ?? []}
      showFirstTimeGuidance={showFirstTimeGuidance}
      japaStreak={todaySadhana?.streak_count ?? 0}
      japaAlreadyDoneToday={(malaSessionsToday?.length ?? 0) > 0}
      nityaDoneToday={nityaDates.has(today)}
      practiceHistory={practiceHistory}
      appLanguage={(profile as any)?.app_language ?? 'en'}
      meaningLanguage={(profile as any)?.meaning_language ?? 'en'}
      transliterationLanguage={(profile as any)?.transliteration_language ?? 'en'}
      showTransliteration={(profile as any)?.show_transliteration ?? true}
      liveStreams={allStreams}
      isAdmin={profile?.is_admin ?? false}
      sevaScore={(profile as any)?.seva_score ?? 0}
      pathshalaDoneToday={pathshalaDoneToday}
      pathshalaLabel={pathshalaLabel}
      pathshalaHref={pathshalaHref}
    />
  );
}
