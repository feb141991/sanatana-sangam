/**
 * Kumbh Mela 2027 Schedule & Snan Guide Helpers.
 *
 * One canonical source of truth: packages/dharma-rules/src/melas/mela-schedule.json.
 * Transcribes the official Uttarakhand and Maharashtra Mela authority schedules.
 */

import scheduleJson from '../../packages/dharma-rules/src/melas/mela-schedule.json';

export interface KumbhDay {
  date: string;
  title: string;
  kind: 'event' | 'amrit_snan' | 'principal_amrit_snan' | 'parva_snan';
  place: string;
  status: 'confirmed' | 'unconfirmed' | 'withheld';
  note?: string;
  melaSlug: string;
  melaName: string;
}

export interface KumbhMela {
  slug: string;
  tradition: string;
  emoji: string;
  timezone: string;
  periodStart: string | null;
  periodEnd: string | null;
  officialUrl: string;
  name: string;
  tagline: string;
  significance: string;
  places: string[];
  rituals: string[];
  guidance: string[];
  days: KumbhDay[];
}

export function getKumbhMelas(): KumbhMela[] {
  return scheduleJson.melas.map((m: any) => ({
    slug: m.slug,
    tradition: m.tradition,
    emoji: m.emoji,
    timezone: m.timezone,
    periodStart: m.periodStart,
    periodEnd: m.periodEnd,
    officialUrl: m.officialUrl,
    name: m.name.value.en,
    tagline: m.tagline.value.en,
    significance: m.significance.value.en,
    places: m.places.value.en,
    rituals: m.rituals.value.en,
    guidance: m.guidance?.value?.en ?? [],
    days: (m.days as any[]).map((d) => ({
      ...d,
      melaSlug: m.slug,
      melaName: m.name.value.en,
    })),
  }));
}

export function getAllKumbhDays(): KumbhDay[] {
  const melas = getKumbhMelas();
  const allDays = melas.flatMap((m) => m.days);
  return allDays
    .filter((d) => d.status === 'confirmed')
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function getNextKumbhDay(referenceDate: Date = new Date()): KumbhDay | null {
  const isoToday = referenceDate.toISOString().slice(0, 10);
  const days = getAllKumbhDays();
  return days.find((d) => d.date >= isoToday) ?? null;
}

export function getNextAmritSnan(referenceDate: Date = new Date()): KumbhDay | null {
  const isoToday = referenceDate.toISOString().slice(0, 10);
  const days = getAllKumbhDays();
  return (
    days.find(
      (d) =>
        d.date >= isoToday &&
        (d.kind === 'amrit_snan' || d.kind === 'principal_amrit_snan'),
    ) ?? null
  );
}
