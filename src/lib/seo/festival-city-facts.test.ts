import { describe, expect, it } from 'vitest';
import sitemap from '@/app/sitemap';
import { calculateObservancesForYearCorrected } from '@/lib/calendar/engine';
import { lunarMonthLabel } from '@/lib/calendar/lunar-month-label';
import rules from '@sangam/dharma-rules/src/festivals/rules.json';
import {
  computeFestivalCityFacts,
  FESTIVAL_DATE_LOCATION,
  formatCityCoordinates,
  localCivilNoon,
  resolveFestivalSeoCity,
  selectPublishedFestivalDate,
  type PublishedOccurrenceRow,
} from './festival-city-facts';
import { readFileSync } from 'node:fs';

describe('festival city facts', () => {
  it('resolves curated cities without falling back to Ujjain', () => {
    expect(resolveFestivalSeoCity('london')?.tz).toBe('Europe/London');
    expect(resolveFestivalSeoCity('delhi')?.id).toBe('new-delhi');
    expect(resolveFestivalSeoCity('not-a-real-city')).toBeNull();
  });

  it('keeps the location context explicit', () => {
    const city = resolveFestivalSeoCity('san-francisco');
    expect(city).not.toBeNull();
    expect(formatCityCoordinates(city!)).toBe('37.7749° N, 122.4194° W');
  });

  it('keeps the published festival date on the Ujjain reference set', () => {
    expect(FESTIVAL_DATE_LOCATION).toMatchObject({
      lat: 23.1765,
      lon: 75.7885,
      tz: 'Asia/Kolkata',
    });
  });
});

describe('lunar month on festival city pages', () => {
  type MonthRule = { slug: string; corrected_lunar_masa_name?: string | null; corrected_month_system?: string | null };
  const years = [2026, 2027];

  // The slugs and cities are the ones the sitemap publishes, not a second list.
  async function publishedPairs(): Promise<Array<{ slug: string; city: string }>> {
    const entries = await sitemap();
    return entries.flatMap(({ url }) => {
      const match = new URL(url).pathname.match(/^\/festivals\/([^/]+)\/([^/]+)$/);
      return match ? [{ slug: match[1], city: match[2] }] : [];
    });
  }

  it('is Margashirsha for Gita Jayanti in every published city', async () => {
    const cities = (await publishedPairs()).filter(({ slug }) => slug === 'gita-jayanti').map(({ city }) => city);
    expect(cities).toHaveLength(15);
    for (const city of cities) {
      for (const year of years) {
        const date = calculateObservancesForYearCorrected(year, FESTIVAL_DATE_LOCATION).find((o) => o.slug === 'gita-jayanti')?.date ?? null;
        const facts = computeFestivalCityFacts(city, year, date);
        expect(facts?.festivalDate, `${city} ${year}`).toMatch(new RegExp(`^${year}-12-`));
        // Shukla Ekadashi: Amanta and Purnimanta agree, so exactly one name.
        expect(facts?.lunarMonth?.text, `${city} ${year}`).toBe('Margashirsha');
        expect(facts?.panchang.paksha, `${city} ${year}`).toBe('Shukla');
      }
    }
  });

  it('contains each festival rule\'s own month, in its own month system, in every published city', async () => {
    const pairs = await publishedPairs();
    expect(pairs).toHaveLength(300);
    const bySlug = new Map((rules as unknown as MonthRule[]).map((rule) => [rule.slug, rule]));
    let checked = 0;
    for (const year of years) {
      const occurrences = calculateObservancesForYearCorrected(year, FESTIVAL_DATE_LOCATION);
      for (const { slug, city } of pairs) {
        const rule = bySlug.get(slug);
        const date = occurrences.find((occurrence) => occurrence.slug === slug)?.date;
        if (!date || !rule?.corrected_lunar_masa_name) continue;
        const text = lunarMonthLabel(localCivilNoon(date, resolveFestivalSeoCity(city)!.tz))?.text ?? '';
        const system = rule.corrected_month_system === 'purnimanta' ? 'Purnimanta' : 'Amanta';
        const expected = text.includes(' / ')
          ? `${rule.corrected_lunar_masa_name} (${system})`
          : rule.corrected_lunar_masa_name;
        expect(text.split(' / '), `${slug} ${city} ${date}`).toContain(expected);
        checked += 1;
      }
    }
    // 18 festivals have both a rule month and an engine date (Dhanteras joined 2026-11-26 when it became its
    // own tithi rule instead of a Diwali offset): a skip must not pass quietly.
    expect(checked).toBe(18 * 15 * years.length);
  });

  it('shows no lunar month when there is no festival date to take it from', () => {
    const facts = computeFestivalCityFacts('london', 2026, null);
    expect(facts?.festivalDate).toBeNull();
    expect(facts?.lunarMonth).toBeNull();
  });

  it('uses the city\'s own noon', () => {
    expect(localCivilNoon('2026-12-20', 'Australia/Sydney').toISOString()).toBe('2026-12-20T01:00:00.000Z');
    expect(localCivilNoon('2026-12-20', 'America/Los_Angeles').toISOString()).toBe('2026-12-20T20:00:00.000Z');
  });
});

describe('published festival date on city pages', () => {
  const row = (date: string, extra: Partial<PublishedOccurrenceRow> = {}): PublishedOccurrenceRow => ({
    id: `${date}-${Math.random()}`,
    date,
    publication_status: 'published',
    calendar_profile: 'legacy-ujjain',
    computed_timezone: 'Asia/Kolkata',
    computed_latitude: 23.1765,
    computed_longitude: 75.7885,
    is_primary_variant: null,
    final_date_source: 'calculation_engine',
    observance_definitions: { slug: 'diwali' },
    ...extra,
  });

  it('uses the published 2026 Diwali date, not the engine\'s', () => {
    // Production on 2026-11-26: published 8 Nov; the page computed 9 Nov.
    const engine = calculateObservancesForYearCorrected(2026, FESTIVAL_DATE_LOCATION).find((o) => o.slug === 'diwali')?.date;
    expect(engine).toBe('2026-11-09');
    const rows = [row('2026-11-08', { is_primary_variant: true }), row('2026-11-08'), row('2026-11-08', { computed_timezone: 'Asia/Calcutta' })];
    expect(selectPublishedFestivalDate(rows, 'diwali', 2026)).toBe('2026-11-08');
  });

  it('prefers the primary variant and otherwise needs every row to agree', () => {
    expect(selectPublishedFestivalDate([row('2026-11-08', { is_primary_variant: true }), row('2026-11-09')], 'diwali', 2026)).toBe('2026-11-08');
    expect(selectPublishedFestivalDate([row('2026-11-08'), row('2026-11-09')], 'diwali', 2026)).toBeNull();
    expect(selectPublishedFestivalDate([row('2026-11-08'), row('2026-11-08')], 'diwali', 2026)).toBe('2026-11-08');
  });

  it('ignores unpublished rows, other profiles, other timezones, other festivals and other years', () => {
    expect(selectPublishedFestivalDate([
      row('2026-11-07', { publication_status: 'draft', is_primary_variant: true }),
      row('2026-11-07', { calendar_profile: 'north_indian_purnimanta', is_primary_variant: true }),
      row('2026-11-07', { computed_timezone: 'Europe/London', is_primary_variant: true }),
      row('2026-11-07', { observance_definitions: { slug: 'dhanteras' }, is_primary_variant: true }),
      row('2027-10-28', { is_primary_variant: true }),
      row('2026-11-08'),
    ], 'diwali', 2026)).toBe('2026-11-08');
  });

  it('ignores rows computed at other coordinates under the Ujjain profile and an Indian timezone', () => {
    // Production on 2026-11-26: Ram Navami 27 Mar rows were computed at Kolkata (22.5726, 88.3639).
    expect(selectPublishedFestivalDate([
      row('2026-03-27', { observance_definitions: { slug: 'ram-navami' }, computed_latitude: 22.5726, computed_longitude: 88.3639 }),
      row('2026-03-26', { observance_definitions: { slug: 'ram-navami' } }),
    ], 'ram-navami', 2026)).toBe('2026-03-26');
    expect(selectPublishedFestivalDate([row('2026-11-08', { computed_latitude: null, computed_longitude: null })], 'diwali', 2026)).toBeNull();
  });

  it('shows no date for a fallback date or when nothing is published', () => {
    expect(selectPublishedFestivalDate([row('2026-11-08', { final_date_source: 'fallback' })], 'diwali', 2026)).toBeNull();
    expect(selectPublishedFestivalDate([], 'diwali', 2026)).toBeNull();
  });

  it('honours a manual override', () => {
    expect(selectPublishedFestivalDate([row('2026-11-09', { manual_date_override: '2026-11-08', is_primary_variant: true })], 'diwali', 2026)).toBe('2026-11-08');
  });

  it('never computes a date of its own', () => {
    const source = readFileSync(new URL('./festival-city-facts.ts', import.meta.url), 'utf8');
    expect(source).not.toMatch(/calculateObservancesForYear/);
  });
});
