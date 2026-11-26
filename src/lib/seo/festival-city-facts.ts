import { EMBED_POPULAR_CITIES, type EmbedCityPreset } from '@/lib/embed/cities';
import { calculatePanchang, REFERENCE_LOCATION_UJJAIN } from '@/lib/panchang';
import { unstable_cache } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import { lunarMonthLabel, type LunarMonthLabel } from '@/lib/calendar/lunar-month-label';
import { zonedTimeToUtcIso } from '@/lib/marketing/social/schedule-time';
import {
  filterEligibleMarketingObservances,
  type ObservanceJoinedRow,
} from '@/lib/marketing/sources/published-observance';

export interface FestivalCityFacts {
  city: EmbedCityPreset;
  year: number;
  festivalDate: string | null;
  panchang: ReturnType<typeof calculatePanchang>;
  /** Lunar month at local noon of the reference date; null without a reference date. */
  lunarMonth: LunarMonthLabel | null;
  calculationLabel: string;
}

export const FESTIVAL_DATE_LOCATION = {
  lat: REFERENCE_LOCATION_UJJAIN.lat,
  lon: REFERENCE_LOCATION_UJJAIN.lon,
  tz: REFERENCE_LOCATION_UJJAIN.tz,
} as const;

function normalizeCitySlug(value: string): string {
  return decodeURIComponent(value).trim().toLowerCase().replace(/\s+/g, '-');
}

/** Resolve only curated city presets; never silently substitute Ujjain. */
export function resolveFestivalSeoCity(value: string): EmbedCityPreset | null {
  const slug = normalizeCitySlug(value);
  if (slug === 'delhi') return EMBED_POPULAR_CITIES['new-delhi'];
  return EMBED_POPULAR_CITIES[slug] ?? null;
}

/** The instant of 12:00 in the city, so "at local noon" means the city's noon and not 12:00 UTC. */
export function localCivilNoon(date: string, timeZone: string): Date {
  return new Date(zonedTimeToUtcIso(date, '12:00', timeZone));
}

function currentCivilDate(timeZone: string, now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/**
 * The Ujjain reference point the app publishes. Rows on the same profile and an Indian timezone are also
 * materialised at other coordinates (Kolkata, Delhi, even London with an Indian timezone), and they can fall
 * on a different day, so the coordinates must match too.
 */
export const PUBLISHED_REFERENCE_PROFILE = 'legacy-ujjain';
const PUBLISHED_REFERENCE_TIMEZONES = new Set(['Asia/Kolkata', 'Asia/Calcutta']);
const COORDINATE_TOLERANCE = 0.001;

function isAtReferencePoint(row: PublishedOccurrenceRow): boolean {
  return typeof row.computed_latitude === 'number' && typeof row.computed_longitude === 'number'
    && Math.abs(row.computed_latitude - FESTIVAL_DATE_LOCATION.lat) < COORDINATE_TOLERANCE
    && Math.abs(row.computed_longitude - FESTIVAL_DATE_LOCATION.lon) < COORDINATE_TOLERANCE;
}

export type PublishedOccurrenceRow = ObservanceJoinedRow & {
  year?: number | null;
  calendar_profile?: string | null;
  computed_timezone?: string | null;
  computed_latitude?: number | null;
  computed_longitude?: number | null;
  is_primary_variant?: boolean | null;
  manual_date_override?: string | null;
};

function definitionSlug(row: ObservanceJoinedRow): string | undefined {
  const def = Array.isArray(row.observance_definitions) ? row.observance_definitions[0] : row.observance_definitions;
  return def?.slug;
}

/**
 * The date Shoonaya has published for this festival on the Ujjain reference set, or null.
 *
 * Only published, rule-governed rows that pass the withheld/disputed and final-date gates
 * (the same gate marketing uses) count. The primary variant wins; without one, every
 * remaining row must agree. Disagreement is not resolved here: the page shows no date.
 * The page never computes a date of its own (AGENTS.md section 2).
 */
export function selectPublishedFestivalDate(
  rows: readonly PublishedOccurrenceRow[],
  festivalSlug: string,
  year: number,
): string | null {
  const candidates = (filterEligibleMarketingObservances([...rows]) as PublishedOccurrenceRow[]).filter((row) =>
    definitionSlug(row) === festivalSlug
    && row.calendar_profile === PUBLISHED_REFERENCE_PROFILE
    && PUBLISHED_REFERENCE_TIMEZONES.has(row.computed_timezone ?? '')
    && isAtReferencePoint(row));
  const effectiveDate = (row: PublishedOccurrenceRow) => row.manual_date_override ?? row.date;
  const inYear = candidates.filter((row) => effectiveDate(row)?.startsWith(`${year}-`));
  const primary = inYear.filter((row) => row.is_primary_variant === true);
  const dates = new Set((primary.length ? primary : inYear).map(effectiveDate));
  return dates.size === 1 ? [...dates][0] : null;
}

async function fetchPublishedFestivalDate(festivalSlug: string, year: number): Promise<string | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) throw new Error('Supabase is not configured for festival city pages.');
  const supabase = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
  const { data, error } = await supabase
    .from('observance_occurrences')
    .select('*, observance_definitions!inner(*)')
    .eq('observance_definitions.slug', festivalSlug)
    .eq('publication_status', 'published')
    .eq('calendar_profile', PUBLISHED_REFERENCE_PROFILE)
    .gte('computed_latitude', FESTIVAL_DATE_LOCATION.lat - COORDINATE_TOLERANCE)
    .lte('computed_latitude', FESTIVAL_DATE_LOCATION.lat + COORDINATE_TOLERANCE)
    .gte('computed_longitude', FESTIVAL_DATE_LOCATION.lon - COORDINATE_TOLERANCE)
    .lte('computed_longitude', FESTIVAL_DATE_LOCATION.lon + COORDINATE_TOLERANCE)
    .gte('date', `${year - 1}-12-01`)
    .lte('date', `${year + 1}-01-31`)
    .limit(500);
  // A failed read is not "no published date" (AGENTS.md section 18): throw, so nothing is cached.
  if (error) throw new Error('Published festival dates are unavailable.');
  return selectPublishedFestivalDate((data ?? []) as PublishedOccurrenceRow[], festivalSlug, year);
}

/** City facts around a festival date that was already published; never derives the date. */
export function computeFestivalCityFacts(
  citySlug: string,
  year: number,
  festivalDate: string | null,
): FestivalCityFacts | null {
  const city = resolveFestivalSeoCity(citySlug);
  if (!city) return null;

  const noon = localCivilNoon(festivalDate ?? currentCivilDate(city.tz), city.tz);

  return {
    city,
    year,
    festivalDate,
    panchang: calculatePanchang(noon, city.lat, city.lon, city.tz),
    lunarMonth: festivalDate ? lunarMonthLabel(noon) : null,
    calculationLabel: 'Festival date: Shoonaya published calendar (Ujjain reference) · timings: local coordinates and IANA timezone',
  };
}

const getCachedFestivalCityFacts = unstable_cache(
  async (festivalSlug: string, citySlug: string, year: number) => {
    if (!resolveFestivalSeoCity(citySlug)) return null;
    return computeFestivalCityFacts(citySlug, year, await fetchPublishedFestivalDate(festivalSlug, year));
  },
  ['festival-city-facts-v3'],
  { revalidate: 86_400 },
);

export async function getFestivalCityFacts(
  festivalSlug: string,
  citySlug: string,
  year: number,
): Promise<FestivalCityFacts | null> {
  return getCachedFestivalCityFacts(festivalSlug, citySlug, year);
}

export function formatCityCoordinates(city: EmbedCityPreset): string {
  return `${Math.abs(city.lat).toFixed(4)}° ${city.lat >= 0 ? 'N' : 'S'}, ${Math.abs(city.lon).toFixed(4)}° ${city.lon >= 0 ? 'E' : 'W'}`;
}
