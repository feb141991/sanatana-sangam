import { EMBED_POPULAR_CITIES, type EmbedCityPreset } from '@/lib/embed/cities';
import { calculatePanchang } from '@/lib/panchang';
import { unstable_cache } from 'next/cache';
import {
  calculateObservancesForYearCorrected,
  type CalculatedOccurrence,
} from '@/lib/calendar/engine';

export interface FestivalCityFacts {
  city: EmbedCityPreset;
  year: number;
  festivalDate: string | null;
  panchang: ReturnType<typeof calculatePanchang>;
  calculationLabel: string;
}

function normalizeCitySlug(value: string): string {
  return decodeURIComponent(value).trim().toLowerCase().replace(/\s+/g, '-');
}

/** Resolve only curated city presets; never silently substitute Ujjain. */
export function resolveFestivalSeoCity(value: string): EmbedCityPreset | null {
  const slug = normalizeCitySlug(value);
  if (slug === 'delhi') return EMBED_POPULAR_CITIES['new-delhi'];
  return EMBED_POPULAR_CITIES[slug] ?? null;
}

function civilNoon(date: string): Date {
  return new Date(`${date}T12:00:00Z`);
}

function currentCivilDate(timeZone: string, now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

function occurrenceDate(
  occurrences: readonly CalculatedOccurrence[],
  slug: string,
): string | null {
  return occurrences.find((occurrence) => occurrence.slug === slug)?.date ?? null;
}

function computeFestivalCityFacts(
  festivalSlug: string,
  citySlug: string,
  year: number,
): FestivalCityFacts | null {
  const city = resolveFestivalSeoCity(citySlug);
  if (!city) return null;

  const location = { lat: city.lat, lon: city.lon, tz: city.tz };
  const festivalDate = occurrenceDate(
    calculateObservancesForYearCorrected(year, location),
    festivalSlug,
  );
  const panchangDate = festivalDate ?? currentCivilDate(city.tz);

  return {
    city,
    year,
    festivalDate,
    panchang: calculatePanchang(civilNoon(panchangDate), city.lat, city.lon, city.tz),
    calculationLabel: 'Corrected Shoonaya engine · local coordinates · local IANA timezone',
  };
}

const getCachedFestivalCityFacts = unstable_cache(
  async (festivalSlug: string, citySlug: string, year: number) =>
    computeFestivalCityFacts(festivalSlug, citySlug, year),
  ['festival-city-facts-v1'],
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
