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
} from './festival-city-facts';

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
        const facts = computeFestivalCityFacts('gita-jayanti', city, year);
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
    // 17 festivals have both a rule month and an engine date: a skip must not pass quietly.
    expect(checked).toBe(17 * 15 * years.length);
  });

  it('shows no lunar month when there is no festival date to take it from', () => {
    const facts = computeFestivalCityFacts('guru-purnima', 'london', 2026);
    expect(facts?.festivalDate).toBeNull();
    expect(facts?.lunarMonth).toBeNull();
  });

  it('uses the city\'s own noon', () => {
    expect(localCivilNoon('2026-12-20', 'Australia/Sydney').toISOString()).toBe('2026-12-20T01:00:00.000Z');
    expect(localCivilNoon('2026-12-20', 'America/Los_Angeles').toISOString()).toBe('2026-12-20T20:00:00.000Z');
  });
});
