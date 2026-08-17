import { getGeneratedFallback } from './festival-fallback.generated';
/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Shoonaya — 2026 Festival Calendar
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Covers Hindu · Sikh · Buddhist · Jain festivals.
 * Each festival is tagged with `tradition` so the home screen can
 * prioritise the user's own tradition first.
 *
 * Shared festivals (e.g. Diwali, celebrated by Hindu + Jain) are tagged
 * with the primary tradition but appear for everyone.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface Festival {
  id?:         string;
  name:        string;
  date:        string;   // YYYY-MM-DD
  emoji:       string;
  description: string;
  type:        'major' | 'vrat' | 'regional';
  /** Which tradition this festival belongs to */
  tradition:   'hindu' | 'sikh' | 'buddhist' | 'jain' | 'all';
  source_name?: string | null;
  source_kind?: FestivalSourceKind | null;
  review_status?: FestivalReviewStatus | null;
  verification_status?: FestivalVerificationStoredStatus | null;
  verification_confidence?: FestivalVerificationConfidence | null;
  verification_note?: string | null;
  suggested_date?: string | null;
  verification_run_at?: string | null;
  verification_type?: FestivalVerificationType | null;
  route_kind?: string | null;
  route_slug?: string | null;
  year?: number;
  slug?: string | null;
  final_date_source?: string | null;
  manual_date_override?: string | null;
  locked_for_regeneration?: boolean | null;
  audit_status?: string | null;
  audit_failure_reason?: string | null;
  audit_retry_count?: number | null;
  last_audited_at?: string | null;
}

export type FestivalSourceKind = 'curated' | 'official' | 'partner' | 'community_reviewed';
export type FestivalReviewStatus = 'needs_review' | 'reviewed';
export type FestivalVerificationStoredStatus = 'verified' | 'mismatch' | 'uncertain' | 'not_checked' | 'manual_review';
export type FestivalVerificationConfidence = 'high' | 'medium' | 'low';
export type FestivalVerificationType = 'solar_fixed' | 'lunar_tithi' | 'nakshatra_based' | 'regional_calendar' | 'historical_commemoration' | 'solar_sankranti' | 'solar_month_day';

export interface FestivalSourceRow {
  name: string;
  date: string;
  emoji: string | null;
  description: string;
  type: Festival['type'];
  tradition?: Festival['tradition'] | null;
  source_name?: string | null;
  source_kind?: FestivalSourceKind | null;
  review_status?: FestivalReviewStatus | null;
  verification_status?: FestivalVerificationStoredStatus | null;
  verification_confidence?: FestivalVerificationConfidence | null;
  verification_note?: string | null;
  suggested_date?: string | null;
  verification_run_at?: string | null;
  verification_type?: FestivalVerificationType | null;
  year?: number;
  slug?: string | null;
}

export interface FestivalCalendarMeta {
  label: string;
  coverage: string;
  sourceNote: string;
  isFallback: boolean;
}


export const FESTIVAL_CALENDAR_FALLBACK_META: FestivalCalendarMeta = {
  label: 'Curated 2026 festival edition',
  coverage: 'In-app fallback calendar with 2026 coverage only',
  sourceNote: 'Used when the shared festival database is unavailable, so reminders and browsing still work with an explicit coverage boundary.',
  isFallback: true,
};

/**
 * Offline fallback, generated from the rules engine.
 *
 * This used to be `FESTIVALS_2026`, a hand-written array of 66 Gregorian dates.
 * That violated AGENTS.md rule 1, bypassed the launch gate entirely (it carried
 * Losar, Kathina, Vesak, Onam and six more suppressed observances), and had
 * drifted from the ratified dates -- it held Mahashivaratri on 2026-02-17 and
 * Janmashtami on 2026-09-03 where the council ruled 15 Feb and 4 Sep. It also
 * covered only 2026, so every later year fell back to nothing.
 *
 * It is now produced by `npm run generate:fallback`, so the launch gate, the
 * derivability gate and the ratified dates all apply automatically, and it
 * spans 2026-2028 including the ekadashi cycle.
 *
 * MUST be regenerated after any change to rules.json, the launch set, or a
 * ratification. Stale generated data is still stale data -- the difference is
 * that regenerating is one command rather than an editing exercise.
 */
export function getFallbackFestivalCalendar(year: number): Festival[] {
  return getGeneratedFallback(year).map(f => ({
    name: f.name,
    date: f.date,
    emoji: f.emoji,
    description: f.description,
    type: f.type as Festival['type'],
    tradition: f.tradition as Festival['tradition'],
    slug: f.slug,
  }));
}

/**
 * @deprecated Prefer `getFallbackFestivalCalendar(year)` — this is fixed to 2026.
 *
 * Retained under its original name so existing callers keep working, but it is
 * no longer a hand-written array: it is DERIVED from the generated fallback, so
 * the launch gate, the derivability gate and the ratified dates all apply.
 *
 * The name is now misleading in a second way too — the generated data covers
 * 2026-2028, and this exposes only the first of those. New code should call
 * getFallbackFestivalCalendar with an explicit year.
 */
export const FESTIVALS_2026: Festival[] = getFallbackFestivalCalendar(2026);


export function buildFestivalCalendarMeta(
  source: 'database' | 'fallback',
  festivals: Array<Pick<Festival, 'date'> & Partial<Pick<FestivalSourceRow, 'source_name' | 'source_kind' | 'review_status'>>>,
): FestivalCalendarMeta {
  if (source === 'fallback') return FESTIVAL_CALENDAR_FALLBACK_META;

  const years = Array.from(new Set(festivals.map((festival) => new Date(festival.date).getFullYear()))).sort();
  const coverage = years.length > 0
    ? `Shared festival calendar covering ${years.join(', ')}`
    : 'Shared festival calendar';
  const reviewedCount = festivals.filter((festival) => festival.review_status === 'reviewed').length;
  const allReviewed = festivals.length > 0 && reviewedCount === festivals.length;
  const sourceNames = Array.from(new Set(festivals.map((festival) => festival.source_name).filter(Boolean)));
  const sourceLabel = sourceNames.length > 0 ? sourceNames.join(', ') : 'the shared festival table';

  return {
    label: allReviewed ? 'Reviewed shared festival calendar' : 'Shared festival calendar',
    coverage,
    sourceNote: allReviewed
      ? `Home and reminder notifications are reading from ${sourceLabel}, and the current entries are marked as reviewed in the shared festival table.`
      : `Home and reminder notifications are reading from ${sourceLabel}. This keeps countdowns and cron reminders aligned while editorial review is still being completed.`,
    isFallback: false,
  };
}

export function attachFestivalTrust(row: FestivalSourceRow): Festival & Pick<FestivalSourceRow, 'source_name' | 'source_kind' | 'review_status'> {
  const staticMatch = FESTIVALS_2026.find(
    (entry) => entry.name === row.name && entry.date === row.date
  );

  return {
    name: row.name,
    date: row.date,
    emoji: row.emoji ?? '🪔',
    description: row.description,
    type: row.type,
    tradition: row.tradition ?? staticMatch?.tradition ?? 'all',
    source_name: row.source_name ?? null,
    source_kind: row.source_kind ?? null,
    review_status: row.review_status ?? null,
    verification_status: row.verification_status ?? null,
    verification_confidence: row.verification_confidence ?? null,
    verification_note: row.verification_note ?? null,
    suggested_date: row.suggested_date ?? null,
    verification_run_at: row.verification_run_at ?? null,
    verification_type: row.verification_type ?? null,
    year: row.year ?? staticMatch?.year ?? (row.date ? new Date(row.date).getFullYear() : undefined),
    slug: row.slug ?? null,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Get all festivals occurring on a specific date string (YYYY-MM-DD) */
export function getFestivalsForDate(
  dateStr: string,
  festivals: Festival[] = FESTIVALS_2026,
): Festival[] {
  return festivals.filter(f => f.date === dateStr);
}

/** Get the next upcoming festival(s), strictly filtered by the user's tradition */
export function getNextFestivals(
  festivals: Festival[] = FESTIVALS_2026,
  today: Date = new Date(),
  tradition?: string | null,
): Festival[] {
  const todayStr = today.toISOString().split('T')[0];
  
  // 1. Strict Tradition Filtering: Only show events for the user's path or 'all'
  const filtered = (tradition && tradition !== 'other' && tradition !== 'exploring')
    ? festivals.filter(f => f.tradition === tradition || f.tradition === 'all')
    : festivals;

  const upcoming = filtered.filter(f => f.date >= todayStr);
  
  if (upcoming.length === 0) return filtered.length > 0 ? [filtered[filtered.length - 1]] : [];

  // 2. Identify the very next date in THIS tradition's calendar
  const nextDate = upcoming[0].date;
  return upcoming.filter(f => f.date === nextDate);
}

/** Days until a festival date */
export function daysUntil(dateStr: string, today: Date = new Date()): number {
  const fest = new Date(dateStr + 'T00:00:00');
  const d    = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.ceil((fest.getTime() - d.getTime()) / 86_400_000);
}

/** Get a panchang stub for today (minimal implementation for server component) */
export function getTodayPanchang(
  lat?: number,
  lon?: number,
): { tithi: string; nakshatra: string; yoga: string; sunrise: string; sunset: string; rahuKaal: string } {
  // Delegated to the full panchang engine — this stub is used by the server component
  // The full calculation happens client-side in HomeDashboard via calculatePanchang()
  return {
    tithi:     'Loading…',
    nakshatra: 'Loading…',
    yoga:      'Loading…',
    sunrise:   '6:00 AM',
    sunset:    '6:00 PM',
    rahuKaal:  'Loading…',
  };
}

export function mapOccurrenceToFestival(row: any): Festival {
  const def = row.observance_definitions || {};
  const provenance = row.source_provenance || {};
  const effectiveDate = row.manual_date_override || row.date;
  return {
    id: row.id,
    name: def.display_name || '',
    date: effectiveDate,
    emoji: def.emoji || '🪔',
    description: def.description || '',
    type: def.kind || 'major',
    tradition: def.tradition || 'all',
    source_name: provenance.source_name || null,
    source_kind: provenance.source_kind || null,
    review_status: row.review_status || null,
    verification_status: row.verification_status || null,
    verification_confidence: row.verification_confidence || null,
    verification_note: row.verification_note || null,
    suggested_date: row.suggested_date || null,
    verification_run_at: row.verification_run_at || null,
    verification_type: def.verification_type || null,
    route_kind: def.route_kind || null,
    route_slug: def.route_slug || null,
    year: row.year,
    slug: def.slug || null,
    final_date_source: row.final_date_source || null,
    manual_date_override: row.manual_date_override || null,
    locked_for_regeneration: row.locked_for_regeneration ?? null,
    audit_status: row.audit_status || null,
    audit_failure_reason: row.audit_failure_reason || null,
    audit_retry_count: row.audit_retry_count ?? null,
    last_audited_at: row.last_audited_at || null,
  };
}
