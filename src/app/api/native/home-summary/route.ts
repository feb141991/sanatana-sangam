import { NextRequest, NextResponse } from 'next/server';

import { mapHeroAssetToTheme, resolveHomeHeroTheme, type HeroAssetRow, type HomeHeroTheme } from '@/config/festivalThemes';
import { getApiUser } from '@/lib/api-auth';
import { getDharmVeerRoster, selectDharmVeerOfTheDayFromRoster } from '@/lib/dharm-veer-db';
import { NATIVE_NITYA_STEP_ORDER, countCompletedNativeNityaSteps } from '@/lib/native-nitya-karma';
import { getTodayShloka } from '@/lib/shlokas';
import { localSpiritualDate } from '@/lib/sacred-time';
import { getDailySacredText, getDayOfYear } from '@/lib/sacred-texts';
import { SACRED_RELICS } from '@/lib/relics';
import { getSacredTextLabel, getTraditionMeta } from '@/lib/tradition-config';
import { PATHSHALA_PATH_IDS } from '@/lib/pathshala-paths';
import { calculatePanchang, getTodaySpiritualPulses } from '@/lib/panchang';

export const runtime = 'nodejs';

type TraditionKey = 'hindu' | 'sikh' | 'buddhist' | 'jain' | 'all';

type ProfileRow = {
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  city: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
  tradition: string | null;
  sampradaya: string | null;
  ishta_devata: string | null;
  app_language: string | null;
  active_symbol_id: string | null;
  karma_points: number | null;
  nitya_rhythm_mode: string | null;
  shloka_streak: number | null;
  last_shloka_date: string | null;
};

type DailySadhanaRow = {
  date: string;
  streak_count: number | null;
  japa_done: boolean | null;
  quiz_done: boolean | null;
  nitya_done: boolean | null;
  pathshala_done: boolean | null;
  dharmveer_done: boolean | null;
  panchang_viewed: boolean | null;
};

type GuidedPathProgressRow = {
  path_id: string;
  status: string | null;
  updated_at: string | null;
  current_lesson: number | null;
  completed_lessons: number[] | null;
};

type SankalpaRow = {
  id: string;
  text: string;
  start_date: string;
  target_days: number | null;
  tradition: string | null;
  related_practice: string | null;
};

type ObservanceDefinitionJoin = {
  slug: string;
  display_name: string;
  emoji: string | null;
  description: string | null;
  kind: string | null;
  tradition: string | null;
  route_kind: string | null;
  route_slug: string | null;
  active: boolean | null;
};

type ObservanceRow = {
  date: string;
  observance_definitions: ObservanceDefinitionJoin | ObservanceDefinitionJoin[] | null;
};

type PracticeRow = {
  id: 'japa' | 'nitya' | 'pathshala' | 'quiz' | 'dharmveer';
  icon: string;
  label: string;
  detail: string;
  href: string;
  done: boolean;
  progress: number;
  color: string;
  streak?: number;
};

type HomeSummaryResponse = {
  profile: {
    name: string;
    firstName: string;
    tradition: string;
    city: string;
    country: string;
    karmaPoints: number;
    relicImageUrl: string | null;
    avatarUrl: string | null;
  };
  hero: {
    imageUrl: string;
    alt: string;
    objectPosition: string;
    label: string;
  };
  date: {
    iso: string;
    timezone: string;
    latitude: number;
    longitude: number;
  };
  sacredText: {
    label: string;
    icon: string;
    original: string;
    transliteration: string;
    meaning: string;
    source: string;
    accentColour: string;
    accentLight: string;
  };
  panchang: {
    href: string;
    tithiLabel: string;
    festivalLabel: string | null;
    vratLabel: string | null;
    viewedToday: boolean;
    observance: {
      name: string;
      emoji: string | null;
      daysLeft: number;
      routeKind: string;
      routeSlug: string;
      href: string;
      label: string;
    } | null;
  };
  nextPractice: {
    id: PracticeRow['id'];
    contextLabel: string;
    title: string;
    suggestion: string;
    nudge: string;
    actionLabel: string;
    actionHref: string;
    progress: number;
  };
  practices: PracticeRow[];
  sankalpa: {
    id: string;
    text: string;
    startDate: string;
    endDate: string;
    targetDays: number;
    day: number;
    progress: number;
    tradition: string;
    relatedPractice: string | null;
  } | null;
  dharmVeer: {
    id: string;
    name: string;
    tagline: string;
    href: string;
  };
  // True when the user has no shloka-reading streak, no last-shloka-read
  // date, and no guided-path progress rows — identical to the PWA's own
  // showFirstTimeGuidance formula (src/app/(main)/home/page.tsx), so native
  // and web agree on who counts as "new" without inventing a second
  // definition.
  firstWeek: boolean;
};

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

function getMetadataName(metadata: Record<string, unknown> | null | undefined) {
  const fullName = metadata?.full_name;
  if (typeof fullName === 'string' && fullName.trim()) return fullName.trim();

  const name = metadata?.name;
  if (typeof name === 'string' && name.trim()) return name.trim();

  return '';
}

function getDisplayName({
  profileName,
  username,
  metadata,
  email,
}: {
  profileName?: string | null;
  username?: string | null;
  metadata?: Record<string, unknown> | null;
  email?: string | null;
}) {
  const savedName = profileName?.trim() || username?.trim();
  if (savedName) return savedName;
  const metadataName = getMetadataName(metadata);
  if (metadataName) return metadataName;
  return email?.split('@')[0] || 'Seeker';
}

function getFirstName(name: string) {
  return name.trim().split(/\s+/)[0] || 'Seeker';
}

function getDefinition(row: ObservanceRow): ObservanceDefinitionJoin | null {
  if (Array.isArray(row.observance_definitions)) {
    return row.observance_definitions[0] ?? null;
  }
  return row.observance_definitions;
}

function clampProgress(value: number) {
  return Math.max(0, Math.min(1, value));
}

function isPresentString(value: string | null): value is string {
  return Boolean(value);
}

function buildEndDate(startDate: string, targetDays: number) {
  const startMs = new Date(`${startDate}T00:00:00Z`).getTime();
  return new Date(startMs + Math.max(targetDays - 1, 0) * 86_400_000).toISOString().slice(0, 10);
}

function buildDayNumber(startDate: string, today: string) {
  const start = new Date(`${startDate}T00:00:00Z`).getTime();
  const current = new Date(`${today}T00:00:00Z`).getTime();
  return Math.max(1, Math.floor((current - start) / 86_400_000) + 1);
}

function getRelicImageUrl(activeSymbolId?: string | null) {
  if (!activeSymbolId) return null;
  return SACRED_RELICS.find((relic) => relic.id === activeSymbolId)?.imageUrl ?? null;
}

function toFestivalTradition(value?: string | null): TraditionKey {
  return value === 'hindu' || value === 'sikh' || value === 'buddhist' || value === 'jain' || value === 'all'
    ? value
    : 'all';
}

function buildSacredText(profile: ProfileRow | null, dayIndex: number) {
  const tradition = profile?.tradition ?? 'hindu';
  const meta = getTraditionMeta(tradition);
  const sacredText = getDailySacredText(tradition, dayIndex);

  if (sacredText) {
    return {
      label: getSacredTextLabel(tradition, profile?.app_language ?? 'en'),
      icon: meta.sacredTextIcon,
      original: sacredText.original,
      transliteration: sacredText.transliteration,
      meaning: sacredText.meaning,
      source: sacredText.source,
      accentColour: meta.accentColour,
      accentLight: meta.accentLight,
    };
  }

  const shloka = getTodayShloka(profile?.timezone ?? undefined);
  return {
    label: getSacredTextLabel(tradition, profile?.app_language ?? 'en'),
    icon: meta.sacredTextIcon,
    original: shloka.sanskrit,
    transliteration: shloka.transliteration ?? '',
    meaning: shloka.meaning,
    source: shloka.source,
    accentColour: meta.accentColour,
    accentLight: meta.accentLight,
  };
}

function buildPractices({
  todaySadhana,
  malaDone,
  nityaCompletedCount,
  pathshalaDone,
  pathshalaHref,
  japaStreak,
  nityaStreak,
}: {
  todaySadhana: DailySadhanaRow | null;
  malaDone: boolean;
  nityaCompletedCount: number;
  pathshalaDone: boolean;
  pathshalaHref: string;
  japaStreak: number;
  nityaStreak: number;
}): PracticeRow[] {
  const nityaProgress = clampProgress(nityaCompletedCount / NATIVE_NITYA_STEP_ORDER.length);
  const nityaDone = Boolean(todaySadhana?.nitya_done) || nityaCompletedCount === NATIVE_NITYA_STEP_ORDER.length;

  return [
    {
      id: 'japa',
      icon: 'circle',
      label: 'Japa Mala',
      detail: malaDone || todaySadhana?.japa_done ? 'Mala completed today' : 'Begin your mala',
      href: '/bhakti',
      done: Boolean(todaySadhana?.japa_done) || malaDone,
      progress: Boolean(todaySadhana?.japa_done) || malaDone ? 1 : 0,
      color: '#F59E4A',
      streak: japaStreak,
    },
    {
      id: 'nitya',
      icon: 'check-circle',
      label: 'Nitya Karma',
      detail: nityaDone || todaySadhana?.nitya_done ? 'Morning practice complete' : 'Open your daily sequence',
      href: '/nitya-karma',
      done: nityaDone,
      progress: nityaDone ? 1 : nityaProgress,
      color: '#5aaa38',
      streak: nityaStreak,
    },
    {
      id: 'pathshala',
      icon: 'book-open',
      label: 'Pathshala',
      detail: pathshalaDone || todaySadhana?.pathshala_done ? 'Study completed today' : 'Study scripture',
      href: pathshalaHref,
      done: Boolean(todaySadhana?.pathshala_done) || pathshalaDone,
      progress: Boolean(todaySadhana?.pathshala_done) || pathshalaDone ? 1 : 0,
      color: '#5aaa38',
    },
    {
      id: 'quiz',
      icon: 'help-circle',
      label: 'Daily Quiz',
      detail: todaySadhana?.quiz_done ? 'Quiz completed today' : 'Test your dharmic memory',
      href: '/quiz',
      done: Boolean(todaySadhana?.quiz_done),
      progress: todaySadhana?.quiz_done ? 1 : 0,
      color: '#A594E0',
    },
    {
      id: 'dharmveer',
      icon: 'shield',
      label: 'Dharm Veer',
      detail: todaySadhana?.dharmveer_done ? 'Remembered today' : 'Remember a life of courage',
      href: '/dharm-veer',
      done: Boolean(todaySadhana?.dharmveer_done),
      progress: todaySadhana?.dharmveer_done ? 1 : 0,
      color: '#FF8A65',
    },
  ];
}

function buildNextPractice(practices: PracticeRow[]) {
  const next = practices.find((practice) => !practice.done) ?? practices[0];
  const actionLabels: Record<PracticeRow['id'], string> = {
    japa: 'Start Japa',
    nitya: 'Open Nitya Karma',
    pathshala: 'Study Now',
    quiz: 'Answer Quiz',
    dharmveer: 'Open Dharm Veer',
  };

  return {
    id: next.id,
    contextLabel: 'Next Practice',
    title: next.done ? 'Daily practice complete' : next.label,
    suggestion: next.done ? 'All core practices are complete. Review Panchang or rest in gratitude.' : next.detail,
    nudge: next.done ? 'Progress is quiet when the day is complete.' : 'One steady action is enough to keep the rhythm alive.',
    actionLabel: next.done ? 'View all practices' : actionLabels[next.id],
    actionHref: next.href,
    progress: next.done ? 1 : next.progress,
  };
}

function getPulseRouteSlug(label: string) {
  const normalized = label.toLowerCase();
  if (normalized.includes('shivaratri')) return 'shivaratri';
  if (normalized.includes('ekadashi')) return 'ekadashi';
  if (normalized.includes('pradosh')) return 'pradosh';
  if (normalized.includes('chaturthi')) return 'chaturthi';
  if (normalized.includes('purnima')) return 'purnima';
  if (normalized.includes('amavasya')) return 'amavasya';
  return 'vrat';
}

export async function GET(request: NextRequest) {
  const { user, error, supabase } = await getApiUser(request);

  if (error || !user || !supabase) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const DB_TIMEOUT = 4_000;

  const { data: profileData } = await supabase
    .from('profiles')
    .select('full_name, username, avatar_url, cover_url, city, country, latitude, longitude, timezone, tradition, sampradaya, ishta_devata, app_language, active_symbol_id, karma_points, nitya_rhythm_mode, shloka_streak, last_shloka_date')
    .eq('id', user.id)
    .maybeSingle();

  const profile = profileData as ProfileRow | null;
  const timezone = profile?.timezone ?? 'Asia/Kolkata';
  const today = localSpiritualDate(timezone, 4);
  const historyFrom = shiftIsoDate(today, -27);
  const calendarTo = shiftIsoDate(today, 14);
  const tradition = profile?.tradition ?? 'hindu';
  const latitude = profile?.latitude ?? 23.1765;
  const longitude = profile?.longitude ?? 75.7885;

  const [
    guidedResult,
    sadhanaResult,
    nityaResult,
    nityaStreakResult,
    malaResult,
    sankalpaResult,
    observanceResult,
    heroAssetResult,
    dharmVeerRoster,
  ] = await Promise.all([
    withTimeout<GuidedPathProgressRow[]>(
      supabase
        .from('guided_path_progress')
        .select('path_id, status, updated_at, current_lesson, completed_lessons')
        .eq('user_id', user.id),
      DB_TIMEOUT,
    ),
    withTimeout<DailySadhanaRow[]>(
      supabase
        .from('daily_sadhana')
        .select('date, streak_count, japa_done, quiz_done, nitya_done, pathshala_done, dharmveer_done, panchang_viewed')
        .eq('user_id', user.id)
        .gte('date', historyFrom)
        .lte('date', today),
      DB_TIMEOUT,
    ),
    withTimeout<Array<{ log_date: string; step_id: string | null }>>(
      supabase
        .from('nitya_karma_log')
        .select('log_date, step_id')
        .eq('user_id', user.id)
        .gte('log_date', historyFrom)
        .lte('log_date', today),
      DB_TIMEOUT,
    ),
    withTimeout<{ current_streak: number | null }>(
      supabase
        .from('nitya_karma_streaks')
        .select('current_streak')
        .eq('user_id', user.id)
        .maybeSingle(),
      DB_TIMEOUT,
    ),
    withTimeout<Array<{ id: string }>>(
      supabase
        .from('mala_sessions')
        .select('id')
        .eq('user_id', user.id)
        .gte('completed_at', `${today}T00:00:00Z`)
        .lte('completed_at', `${today}T23:59:59Z`)
        .limit(1),
      DB_TIMEOUT,
    ),
    withTimeout<SankalpaRow>(
      supabase
        .from('sankalpas')
        .select('id, text, start_date, target_days, tradition, related_practice')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      DB_TIMEOUT,
    ),
    withTimeout<ObservanceRow[]>(
      supabase
        .from('observance_occurrences')
        .select('date, observance_definitions!inner(slug, display_name, emoji, description, kind, tradition, route_kind, route_slug, active)')
        .gte('date', today)
        .lte('date', calendarTo)
        .eq('observance_definitions.active', true)
        .in('observance_definitions.tradition', [tradition, 'all'])
        .order('date', { ascending: true })
        .limit(8),
      DB_TIMEOUT,
    ),
    withTimeout<HeroAssetRow[]>(
      supabase
        .from('hero_assets')
        .select('id, label, hero_image, hero_alt, object_position, traditions, sampradayas, ishta_devatas, festival_slugs, priority, is_active')
        .eq('is_active', true)
        .order('priority', { ascending: false }),
      DB_TIMEOUT,
    ),
    getDharmVeerRoster(supabase).catch(() => []),
  ]);

  const guidedPathProgress = guidedResult.data ?? [];
  const firstWeek = (profile?.shloka_streak ?? 0) === 0 && !profile?.last_shloka_date && guidedPathProgress.length === 0;
  const sadhanaRows = sadhanaResult.data ?? [];
  const nityaRows = nityaResult.data ?? [];
  const nityaStreak = nityaStreakResult.data?.current_streak ?? 0;
  const malaRows = malaResult.data ?? [];
  const sankalpaRow = sankalpaResult.data ?? null;
  const observanceRows = observanceResult.data ?? [];
  const heroAssetRows = heroAssetResult.data ?? [];

  const todaySadhana = sadhanaRows.find((row) => row.date === today) ?? null;
  const activePathshala = guidedPathProgress.find(
    (progress) => progress.status === 'active' && PATHSHALA_PATH_IDS.includes(progress.path_id),
  );
  const pathshalaDoneToday = guidedPathProgress.some((progress) => progress.updated_at?.startsWith(today));
  // Native has no literal "/lesson" resolver route (web's
  // `/pathshala/[pathId]/lesson/page.tsx` does, native's `[lessonId].tsx`
  // expects a numeric lesson index and shows "Lesson not found" for the
  // literal string "lesson"). Native's `app/pathshala/[pathId].tsx` already
  // reads enrollment progress and highlights the correct next lesson itself,
  // so the plain path-detail route is the correct, working destination
  // whether or not today's lesson is already done.
  const pathshalaHref = activePathshala
    ? `/pathshala/${activePathshala.path_id}`
    : '/pathshala';
  const latestStreakRow = sadhanaRows
    .filter((row) => row.streak_count != null)
    .sort((a, b) => b.date.localeCompare(a.date))[0] ?? null;
  const japaStreak = todaySadhana?.streak_count ?? latestStreakRow?.streak_count ?? 0;
  const nityaDoneIdsToday = new Set(
    nityaRows
      .filter((row) => row.log_date === today && row.step_id)
      .map((row) => row.step_id)
      .filter(isPresentString),
  );
  const nityaCompletedCount = countCompletedNativeNityaSteps(nityaDoneIdsToday);

  const practices = buildPractices({
    todaySadhana,
    malaDone: malaRows.length > 0,
    nityaCompletedCount,
    pathshalaDone: pathshalaDoneToday,
    pathshalaHref,
    japaStreak,
    nityaStreak,
  });

  const firstObservance = observanceRows
    .map((row) => ({ row, definition: getDefinition(row) }))
    .find((entry) => entry.definition?.active !== false) ?? null;
  const firstDefinition = firstObservance?.definition ?? null;
  const firstIsToday = firstObservance?.row.date === today;

  const tithiPulse = (() => {
    try {
      const panchang = calculatePanchang(new Date(`${today}T12:00:00`), latitude, longitude, timezone);
      return getTodaySpiritualPulses(panchang.tithiIndex, tradition, new Date(`${today}T12:00:00`))[0] ?? null;
    } catch {
      return null;
    }
  })();

  const fallbackPulse = !firstIsToday && tithiPulse ? tithiPulse : null;
  const festivalLabel = firstDefinition
    ? `${firstDefinition.emoji ?? '🪔'} ${firstDefinition.display_name}`
    : fallbackPulse
      ? `${fallbackPulse.emoji} ${fallbackPulse.label}`
    : null;
  const vratLabel = firstDefinition?.kind === 'vrat' ? festivalLabel : null;

  let observance = null;
  if (fallbackPulse) {
    const routeSlug = getPulseRouteSlug(fallbackPulse.label);
    observance = {
      name: fallbackPulse.label,
      emoji: fallbackPulse.emoji,
      daysLeft: 0,
      routeKind: 'vrat',
      routeSlug,
      href: '/vrat',
      label: `${fallbackPulse.label} Today`,
    };
  } else if (firstDefinition && firstObservance) {
    const dLeft = Math.round((new Date(firstObservance.row.date).getTime() - new Date(today).getTime()) / 86400000);
    const name = firstDefinition.display_name;
    const label = dLeft === 0
      ? `Today is ${name}`
      : dLeft === 1
        ? `Tomorrow is ${name}`
        : `${name} in ${dLeft} days`;

    const routeKind = firstDefinition.route_kind || 'festival';
    const routeSlug = firstDefinition.route_slug || firstDefinition.slug;
    const href = routeKind === 'vrat' ? '/vrat' : '/panchang';

    observance = {
      name,
      emoji: firstDefinition.emoji ?? '🪔',
      daysLeft: dLeft,
      routeKind,
      routeSlug,
      href,
      label
    };
  }

  const dbHeroThemes = heroAssetRows
    .map(mapHeroAssetToTheme)
    .filter((theme): theme is HomeHeroTheme => Boolean(theme));
  const heroTheme = resolveHomeHeroTheme({
    tradition,
    sampradaya: profile?.sampradaya,
    ishtaDevata: profile?.ishta_devata,
    festival: firstDefinition
      ? { name: firstDefinition.display_name, tradition: toFestivalTradition(firstDefinition.tradition) }
      : null,
    dbThemes: dbHeroThemes,
  });

  const targetDays = sankalpaRow?.target_days ?? 30;
  const sankalpaDay = sankalpaRow ? buildDayNumber(sankalpaRow.start_date, today) : 1;
  const name = getDisplayName({
    profileName: profile?.full_name,
    username: profile?.username,
    metadata: user.user_metadata,
    email: user.email,
  });
  const dharmVeer = selectDharmVeerOfTheDayFromRoster(dharmVeerRoster, tradition);

  const response: HomeSummaryResponse = {
    profile: {
      name,
      firstName: getFirstName(name),
      tradition,
      city: profile?.city ?? '',
      country: profile?.country ?? '',
      karmaPoints: profile?.karma_points ?? 0,
      relicImageUrl: getRelicImageUrl(profile?.active_symbol_id),
      avatarUrl: profile?.avatar_url ?? null,
    },
    hero: {
      imageUrl: profile?.cover_url ?? heroTheme.heroImage,
      alt: heroTheme.heroAlt,
      objectPosition: heroTheme.objectPosition,
      label: heroTheme.label,
    },
    date: {
      iso: today,
      timezone,
      latitude,
      longitude,
    },
    sacredText: buildSacredText(profile, getDayOfYear()),
    panchang: {
      href: '/panchang',
      tithiLabel: 'Today’s Panchang',
      festivalLabel,
      vratLabel,
      viewedToday: Boolean(todaySadhana?.panchang_viewed),
      observance,
    },
    nextPractice: buildNextPractice(practices),
    practices,
    sankalpa: sankalpaRow
      ? {
          id: sankalpaRow.id,
          text: sankalpaRow.text,
          startDate: sankalpaRow.start_date,
          endDate: buildEndDate(sankalpaRow.start_date, targetDays),
          targetDays,
          day: Math.min(sankalpaDay, targetDays),
          progress: clampProgress(sankalpaDay / targetDays),
          tradition: sankalpaRow.tradition ?? tradition,
          relatedPractice: sankalpaRow.related_practice,
        }
      : null,
    dharmVeer: {
      id: dharmVeer.id,
      name: dharmVeer.name,
      tagline: dharmVeer.tagline,
      href: `/dharm-veer/${dharmVeer.id}`,
    },
    firstWeek,
  };

  return NextResponse.json(response, {
    headers: {
      'Cache-Control': 'private, no-store',
    },
  });
}
