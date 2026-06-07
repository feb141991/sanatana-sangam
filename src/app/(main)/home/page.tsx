import { getAuthUser, getSupabaseClient } from '@/lib/auth-cache';
import { redirect } from 'next/navigation';
import { unstable_cache } from 'next/cache';
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
import { createAdminClient } from '@/lib/supabase-admin';

// ── Cached public/shared data — non-user-specific, served from the Next.js
//    data cache so repeated home-page loads don't hammer the DB for these rows. ─

const getCachedHeroAssets = unstable_cache(
  async () => {
    const admin = createAdminClient();
    const { data } = await admin
      .from('hero_assets')
      .select('id, label, hero_image, hero_alt, object_position, traditions, sampradayas, ishta_devatas, festival_slugs, priority, is_active')
      .eq('is_active', true)
      .order('priority', { ascending: false });
    return data ?? [];
  },
  ['hero_assets_v1'],
  { revalidate: 900 }, // 15 min
);

const getCachedLiveDarshans = unstable_cache(
  async () => {
    const admin = createAdminClient();
    const { data } = await admin
      .from('live_darshans')
      .select('id, title, location, schedule, category, tradition, current_video_id, is_active')
      .eq('is_active', true);
    return data ?? [];
  },
  ['live_darshans_v1'],
  { revalidate: 60 }, // 1 min — live status changes frequently
);

const getCachedObservances = unstable_cache(
  async (fromDate: string) => {
    const admin = createAdminClient();
    const { data } = await admin
      .from('observance_occurrences')
      .select('id, date, year, manual_date_override, source_provenance, review_status, verification_status, verification_confidence, verification_note, suggested_date, verification_run_at, final_date_source, locked_for_regeneration, audit_status, audit_failure_reason, audit_retry_count, last_audited_at, observance_definitions(display_name, emoji, description, kind, tradition, verification_type, route_kind, route_slug, slug)')
      .gte('date', fromDate)
      .order('date', { ascending: true })
      .limit(90);
    return data ?? [];
  },
  ['observances_v1'],
  { revalidate: 3600 }, // 60 min
);

const getCachedDharmVeer = unstable_cache(
  async (tradition: string | null) => {
    const admin = createAdminClient();
    return getDharmVeerOfTheDay(admin, tradition);
  },
  ['dharm_veer_v1'],
  { revalidate: 3600 }, // 60 min — changes once per day
);

// Fix 5: Revalidate home page every 5 minutes (ISR) — avoids full SSR on each visit
// No revalidate — home page is user-specific (auth cookies), ISR would cache
// one user's data and serve it to others causing 403s at the edge.


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

  const supabase = await getSupabaseClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, username, avatar_url, cover_url, city, country, latitude, longitude, shloka_streak, last_shloka_date, sampradaya, ishta_devata, tradition, spiritual_level, seeking, custom_greeting, life_stage, timezone, app_language, meaning_language, transliteration_language, show_transliteration, scripture_script, is_pro, subscription_status, subscription_expires_at, entitlement_source, entitlement_updated_at, karma_points, seva_score, is_admin, streak_freeze_count, last_freeze_used, active_symbol_id, onboarding_completed, onboarding_goal, nitya_rhythm_mode')
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

  // ── Cached public data + user-specific queries run concurrently ─────────────
  // Cached calls resolve from the Next.js data cache (no DB hit after warm-up).
  // 4 daily_sadhana queries consolidated → 1 range query; derived in memory below.
  const DB_TIMEOUT = 4_000;

  const [
    [heroAssetRowsRaw, liveDarshanDataRaw, calendarRowsRaw, dharmVeerCached],
    [
      guidedResult, consolidatedSadhanaResult,
      nityaResult, nityaStreakResult, malaResult, sankalpaResult,
    ],
  ] = await Promise.all([
    // ── Public/shared data from cache ──────────────────────────────────────
    Promise.all([
      getCachedHeroAssets(),
      getCachedLiveDarshans(),
      getCachedObservances(calendarFromDate),
      getCachedDharmVeer(tradition),
    ]),
    // ── User-specific queries (always fresh) ───────────────────────────────
    Promise.allSettled([
      // guided path progress
      withTimeout(
        supabase.from('guided_path_progress').select('path_id, status, completed_at, updated_at, current_lesson, completed_lessons').eq('user_id', user.id),
        DB_TIMEOUT,
      ),
      // consolidated daily_sadhana — replaces 4 separate queries (today, yesterday, latestStreak, 28-day history)
      withTimeout(
        supabase.from('daily_sadhana').select('date, streak_count, japa_done, quiz_done, nitya_done, pathshala_done, dharmveer_done').eq('user_id', user.id).gte('date', historyFrom).lte('date', today),
        DB_TIMEOUT,
      ),
      // nitya karma log
      withTimeout(
        supabase.from('nitya_karma_log').select('log_date').eq('user_id', user.id).gte('log_date', historyFrom).lte('log_date', today),
        DB_TIMEOUT,
      ),
      // nitya karma morning streak
      withTimeout(
        supabase.from('nitya_karma_streaks').select('current_streak').eq('user_id', user.id).maybeSingle(),
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
    ]),
  ]);

  // ── Extract results ────────────────────────────────────────────────────────
  const heroAssetRows   = heroAssetRowsRaw as any[] | null;
  const liveDarshanData = liveDarshanDataRaw as any[] | null;
  const calendarRows    = calendarRowsRaw as any[] | null;
  const dharmVeer: DharmVeer = (dharmVeerCached ?? null) as unknown as DharmVeer;

  const guidedPathProgress = (guidedResult.status === 'fulfilled' ? guidedResult.value.data : null) as any[] | null;

  // Consolidated sadhana rows — derive today/yesterday/streak/history in memory
  type SadhanaRow = {
    date: string;
    streak_count: number | null;
    japa_done: boolean | null;
    quiz_done: boolean | null;
    nitya_done: boolean | null;
    pathshala_done: boolean | null;
    dharmveer_done: boolean | null;
  };
  const allSadhanaRows = (consolidatedSadhanaResult.status === 'fulfilled'
    ? consolidatedSadhanaResult.value.data
    : null) as SadhanaRow[] | null;

  const todaySadhana = allSadhanaRows?.find(r => r.date === today) ?? null;
  const yesterdaySadhana = allSadhanaRows?.find(r => r.date === yesterday) ?? null;
  const latestStreakRow = (allSadhanaRows ?? [])
    .filter(r => r.streak_count != null)
    .sort((a, b) => b.date.localeCompare(a.date))[0] ?? null;
  const sadhanaHistory = (allSadhanaRows ?? []).map(r => ({
    date: r.date,
    japa_done: Boolean(r.japa_done),
  }));

  const nityaHistory    = (nityaResult.status === 'fulfilled' ? nityaResult.value.data : null) as { log_date: string }[] | null;
  const nityaStreakRow  = (nityaStreakResult.status === 'fulfilled' ? nityaStreakResult.value.data : null) as { current_streak: number | null } | null;
  const malaSessionsToday = (malaResult.status === 'fulfilled' ? malaResult.value.data : null) as { id: string }[] | null;
  const sankalpaRow     = (sankalpaResult.status === 'fulfilled' ? sankalpaResult.value.data : null) as { id: string; text: string; start_date: string; target_days: number | null; tradition: string | null } | null;

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
      userName={profile?.full_name ?? profile?.username ?? ''}
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
      rhythmMode={(profile as any)?.nitya_rhythm_mode ?? 'morning'}
      displayStreak={nityaStreakRow?.current_streak ?? 0}
    />
  );
}
