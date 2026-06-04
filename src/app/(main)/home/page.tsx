import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getAuthUser } from '@/lib/auth-cache';
import { redirect } from 'next/navigation';
import { cache } from 'react';
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
import { resolveActiveLiveStreams } from '@/lib/live-streams';
import { getPlanById, type GuidedPathProgressRow } from '@/lib/guided-paths';
import type { Festival, FestivalCalendarMeta } from '@/lib/festivals';
import { getDharmVeerOfTheDay } from '@/lib/dharm-veer-db';
import type { DharmVeer } from '@/lib/dharm-veer';
import type { Database } from '@/types/database';
import { localSpiritualDate } from '@/lib/sacred-time';

// Fix 5: Revalidate home page every 5 minutes (ISR) — avoids full SSR on each visit
export const revalidate = 300;

// Fix 4: Cache live darshan DB fetch for the duration of this server render
const fetchLiveDarshans = cache(async () => {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.from('live_darshans').select('*').eq('is_active', true);
  return data ?? null;
});

/** Wraps a promise with a timeout — resolves with null after timeoutMs instead of blocking.
 *  Accepts PromiseLike so Supabase PostgrestFilterBuilder (which is a thenable, not a
 *  true Promise) can be passed in without a TS error. */
function withTimeout<T>(promise: PromiseLike<{ data: T | null }>, timeoutMs: number): Promise<{ data: T | null }> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<{ data: null }>((resolve) => setTimeout(() => resolve({ data: null }), timeoutMs)),
  ]);
}

function shiftIsoDate(isoDate: string, days: number) {
  const date = new Date(`${isoDate}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function hasAnyCoreCompletion(row: {
  japa_done?: boolean | null;
  nitya_done?: boolean | null;
  pathshala_done?: boolean | null;
  quiz_done?: boolean | null;
  dharmveer_done?: boolean | null;
} | null | undefined) {
  if (!row) return false;
  return Boolean(row.japa_done || row.nitya_done || row.pathshala_done || row.quiz_done || row.dharmveer_done);
}

export default async function HomePage() {
  const user = await getAuthUser();

  if (!user) redirect('/');

  const supabase = await createServerSupabaseClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, username, avatar_url, cover_url, city, country, latitude, longitude, shloka_streak, last_shloka_date, sampradaya, ishta_devata, tradition, spiritual_level, seeking, custom_greeting, life_stage, timezone, app_language, meaning_language, transliteration_language, show_transliteration, scripture_script, is_pro, subscription_status, subscription_expires_at, entitlement_source, entitlement_updated_at, karma_points, seva_score, is_admin, streak_freeze_count, last_freeze_used, active_symbol_id, onboarding_completed, onboarding_goal')
    .eq('id', user.id)
    .single();

  // Only redirect new users — existing users with real data skip onboarding
  const needsOnboarding = profile?.onboarding_completed === false
    && !profile?.tradition      // no tradition set
    && !profile?.karma_points   // never earned karma
    && (profile?.shloka_streak ?? 0) === 0; // never done japa
    
  if (needsOnboarding) redirect('/onboarding');

  const tradition = profile?.tradition ?? null;
  const dayIndex  = getDayOfYear();
  const today     = localSpiritualDate(profile?.timezone, 4);
  const yesterday = shiftIsoDate(today, -1);
  const calendarFromDate = shiftIsoDate(new Date().toISOString().slice(0, 10), -1);
  const twentyEightDaysAgo = new Date();
  twentyEightDaysAgo.setDate(twentyEightDaysAgo.getDate() - 27);
  const historyFrom = twentyEightDaysAgo.toISOString().slice(0, 10);

  // Tradition-aware daily sacred text — pure computation, no I/O
  const shloka     = getTodayShloka(profile?.timezone ?? undefined);
  const sacredText = getDailySacredText(tradition, dayIndex);
  const panchang   = getTodayPanchang(
    profile?.latitude  ?? undefined,
    profile?.longitude ?? undefined,
  );

  // ── Single parallel fetch — all DB queries run simultaneously ─────────────
  // Previously these ran in 5 sequential waves. Now one round-trip.
  const DB_TIMEOUT = 4_000;
  const [
    guidedResult, calendarResult, heroResult,
    todayResult, yesterdayResult, latestStreakResult,
    sadhanaResult, nityaResult, liveResult, malaResult,
    sankalpaResult, dharmVeerResult,
  ] = await Promise.allSettled([
    // guided path progress
    withTimeout(
      supabase.from('guided_path_progress').select('path_id, status, completed_at, updated_at, current_lesson, completed_lessons').eq('user_id', user.id),
      DB_TIMEOUT,
    ),
    // observances calendar
    withTimeout(
      supabase.from('observance_occurrences').select('*, observance_definitions(*)').gte('date', calendarFromDate).order('date', { ascending: true }).limit(90),
      DB_TIMEOUT,
    ),
    // hero assets
    withTimeout(
      supabase.from('hero_assets').select('id, label, hero_image, hero_alt, object_position, traditions, sampradayas, ishta_devatas, festival_slugs, priority, is_active').eq('is_active', true).order('priority', { ascending: false }),
      DB_TIMEOUT,
    ),
    // today's sadhana
    withTimeout(
      supabase.from('daily_sadhana').select('streak_count, japa_done, quiz_done, nitya_done, pathshala_done, dharmveer_done').eq('user_id', user.id).eq('date', today).maybeSingle(),
      DB_TIMEOUT,
    ),
    // yesterday's sadhana
    withTimeout(
      supabase.from('daily_sadhana').select('japa_done, quiz_done, nitya_done, pathshala_done, dharmveer_done').eq('user_id', user.id).eq('date', yesterday).maybeSingle(),
      DB_TIMEOUT,
    ),
    // latest streak row
    withTimeout(
      supabase.from('daily_sadhana').select('date, streak_count').eq('user_id', user.id).not('streak_count', 'is', null).order('date', { ascending: false }).limit(1).maybeSingle(),
      DB_TIMEOUT,
    ),
    // 28-day sadhana history
    withTimeout(
      supabase.from('daily_sadhana').select('date, japa_done').eq('user_id', user.id).gte('date', historyFrom).lte('date', today),
      DB_TIMEOUT,
    ),
    // nitya karma log
    withTimeout(
      supabase.from('nitya_karma_log').select('log_date').eq('user_id', user.id).gte('log_date', historyFrom).lte('log_date', today),
      DB_TIMEOUT,
    ),
    // live darshans
    withTimeout(
      supabase.from('live_darshans').select('*').eq('is_active', true),
      DB_TIMEOUT,
    ),
    // mala sessions today
    withTimeout(
      supabase.from('mala_sessions').select('id').eq('user_id', user.id).gte('completed_at', `${today}T00:00:00Z`).lte('completed_at', `${today}T23:59:59Z`).limit(1),
      DB_TIMEOUT,
    ),
    // active sankalpa
    withTimeout(
      supabase.from('sankalpas').select('id, text, start_date, target_days, tradition').eq('user_id', user.id).eq('status', 'active').order('created_at', { ascending: false }).limit(1).maybeSingle(),
      DB_TIMEOUT,
    ),
    // dharm veer
    getDharmVeerOfTheDay(supabase, tradition).then((d) => ({ data: d })).catch(() => ({ data: null })),
  ]);

  // Extract results — use `as any` only at the extraction boundary;
  // downstream variables are typed explicitly below.
  const guidedPathProgress = (guidedResult.status  === 'fulfilled' ? guidedResult.value.data  : null) as any[] | null;
  const calendarRows       = (calendarResult.status === 'fulfilled' ? calendarResult.value.data : null) as any[] | null;
  const heroAssetRows      = (heroResult.status     === 'fulfilled' ? heroResult.value.data     : null) as any[] | null;
  const todaySadhana       = (todayResult.status    === 'fulfilled' ? todayResult.value.data    : null) as { streak_count: number | null; japa_done: boolean | null; quiz_done: boolean | null; nitya_done: boolean | null; pathshala_done: boolean | null; dharmveer_done: boolean | null } | null;
  const yesterdaySadhana   = (yesterdayResult.status === 'fulfilled' ? yesterdayResult.value.data : null) as { japa_done: boolean | null; quiz_done: boolean | null; nitya_done: boolean | null; pathshala_done: boolean | null; dharmveer_done: boolean | null } | null;
  const latestStreakRow     = (latestStreakResult.status === 'fulfilled' ? latestStreakResult.value.data : null) as { date: string; streak_count: number | null } | null;
  const sadhanaHistory     = (sadhanaResult.status  === 'fulfilled' ? sadhanaResult.value.data  : null) as { date: string; japa_done: boolean }[] | null;
  const nityaHistory       = (nityaResult.status    === 'fulfilled' ? nityaResult.value.data    : null) as { log_date: string }[] | null;
  const liveDarshanData    = (liveResult.status     === 'fulfilled' ? liveResult.value.data     : null) as any[] | null;
  const malaSessionsToday  = (malaResult.status     === 'fulfilled' ? malaResult.value.data     : null) as { id: string }[] | null;
  const sankalpaRow        = (sankalpaResult.status === 'fulfilled' ? sankalpaResult.value.data : null) as { id: string; text: string; start_date: string; target_days: number | null; tradition: string | null } | null;
  const dharmVeer: DharmVeer = (dharmVeerResult.status === 'fulfilled' ? dharmVeerResult.value.data : null) as unknown as DharmVeer
    ?? (await getDharmVeerOfTheDay(supabase, tradition));

  // Build calendar / festival data from results
  const calendarFromDb = (calendarRows ?? []).map((row) => mapOccurrenceToFestival(row));
  const festivalCalendar = calendarFromDb.length > 0 ? calendarFromDb : FESTIVALS_2026;
  const festivalCalendarMeta: FestivalCalendarMeta = buildFestivalCalendarMeta(
    calendarFromDb.length > 0 ? 'database' : 'fallback',
    festivalCalendar,
  );
  const festivals = getNextFestivals(festivalCalendar, new Date(), tradition);
  const festival  = festivals[0] ?? null;
  const daysLeft  = festival ? daysUntil(festival.date) : null;

  const heroThemes = ((heroAssetRows ?? []) as HeroAssetRow[])
    .map(mapHeroAssetToTheme)
    .filter((theme): theme is HomeHeroTheme => Boolean(theme));

  // Build active sankalpa from result
  let activeSankalpa: { id: string; text: string; start_date: string; end_date: string; tradition: string } | null = null;
  if (sankalpaRow) {
    const targetDays = sankalpaRow.target_days ?? 30;
    const startMs = new Date(sankalpaRow.start_date + 'T00:00:00Z').getTime();
    const endDate = new Date(startMs + targetDays * 86_400_000).toISOString().slice(0, 10);
    activeSankalpa = {
      id: sankalpaRow.id,
      text: sankalpaRow.text,
      start_date: sankalpaRow.start_date,
      end_date: endDate,
      tradition: sankalpaRow.tradition ?? tradition ?? 'hindu',
    };
  }

  const allStreams = resolveActiveLiveStreams(liveDarshanData ?? null);

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
  const effectiveJapaStreak = todaySadhana?.streak_count ?? latestStreakRow?.streak_count ?? 0;
  const missedYesterday = !hasAnyCoreCompletion(yesterdaySadhana);

  const activePath = (guidedPathProgress ?? []).find((p: GuidedPathProgressRow) => p.status === 'active');
  let pathshalaLabel = 'Pathshala';
  let pathshalaHref = '/pathshala';

  if (activePath) {
    const plan = getPlanById(activePath.path_id);
    if (plan) {
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
      timezone={profile?.timezone ?? 'UTC'}
      shloka={shloka}
      sacredText={sacredText}
      sacredTextMeta={{
        label:       getSacredTextLabel(tradition, appLanguage),
        icon:        meta.sacredTextIcon,
        shareLabel:  getSacredTextLabel(tradition, appLanguage),
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
      japaStreak={effectiveJapaStreak}
      japaAlreadyDoneToday={(malaSessionsToday?.length ?? 0) > 0}
      nityaDoneToday={Boolean(todaySadhana?.nitya_done) || nityaDates.has(today)}
      practiceHistory={practiceHistory}
      appLanguage={(profile as any)?.app_language ?? 'en'}
      meaningLanguage={(profile as any)?.meaning_language ?? 'en'}
      transliterationLanguage={(profile as any)?.transliteration_language ?? 'en'}
      showTransliteration={(profile as any)?.show_transliteration ?? true}
      liveStreams={allStreams}
      isAdmin={profile?.is_admin ?? false}
      sevaScore={(profile as any)?.seva_score ?? 0}
      pathshalaDoneToday={Boolean(todaySadhana?.pathshala_done) || pathshalaDoneToday}
      pathshalaLabel={pathshalaLabel}
      pathshalaHref={pathshalaHref}
      quizDoneToday={Boolean(todaySadhana?.quiz_done)}
      dharmVeerDoneToday={Boolean(todaySadhana?.dharmveer_done)}
      dharmVeer={dharmVeer}
      streakFreezeCount={(profile as { streak_freeze_count?: number | null })?.streak_freeze_count ?? 0}
      lastFreezeUsed={(profile as { last_freeze_used?: string | null })?.last_freeze_used ?? null}
      missedYesterday={missedYesterday}
      activeSymbolId={(profile as any)?.active_symbol_id ?? null}
      activeSankalpa={activeSankalpa}
      karmaPoints={(profile as any)?.karma_points ?? 0}
    />
  );
}
