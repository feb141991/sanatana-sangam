/**
 * mela-schedule.test.ts
 *
 * Kumbh and other melas are dated by the state Mela authorities with the
 * akharas, not by the calendar engine, so mela-schedule.json is a transcription
 * of their official pages (read 2026-11-14). These tests pin the governance
 * rules (AGENTS.md sections 2 and 3): every date is a real civil date in order,
 * every text field cites an official source, and a date the authorities have
 * not consistently announced is marked unconfirmed with the reason.
 */

import { describe, it, expect } from 'vitest';
import schedule from '../mela-schedule.json';

type Day = { date: string; title: string; kind: string; place: string; status: string; note?: string };
type SourceRef = { sourceName: string; publisher?: string; tier: number; url?: string };
type Field = { value: Record<string, unknown>; status: string; sourceRefs: SourceRef[]; translationStatus?: Record<string, string> };

const OFFICIAL_HOSTS = ['haridwarkumbh.uk.gov.in', 'simhasthamahakumbh.maharashtra.gov.in'];
const DAY_KINDS = new Set(['snan', 'amrit_snan', 'principal_amrit_snan', 'event']);
const EDITORIAL_KEYS = ['name', 'tagline', 'significance', 'places', 'rituals', 'guidance'] as const;

function isRealDate(iso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const parsed = new Date(`${iso}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === iso;
}

function isOfficial(url: string | undefined): boolean {
  if (!url) return false;
  try {
    const { protocol, hostname } = new URL(url);
    return protocol === 'https:' && OFFICIAL_HOSTS.includes(hostname);
  } catch {
    return false;
  }
}

describe('mela schedule: official dates, cited content', () => {
  const melas = schedule.melas as unknown as Array<Record<string, unknown> & { slug: string; days: Day[] }>;

  it('has unique slugs and a version', () => {
    expect(schedule.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(isRealDate(schedule.accessedOn)).toBe(true);
    expect(new Set(melas.map((m) => m.slug)).size).toBe(melas.length);
  });

  for (const mela of melas) {
    describe(mela.slug, () => {
      it('lists real civil dates in order, without duplicates of the same day and place', () => {
        expect(mela.days.length).toBeGreaterThan(0);
        const keys = new Set<string>();
        let previous = '';
        for (const day of mela.days) {
          expect(isRealDate(day.date), `${day.date} is not a real date`).toBe(true);
          expect(day.date >= previous, `${day.date} is out of order`).toBe(true);
          previous = day.date;
          expect(DAY_KINDS.has(day.kind), `unknown kind ${day.kind}`).toBe(true);
          expect(['confirmed', 'unconfirmed']).toContain(day.status);
          expect(day.title.trim().length).toBeGreaterThan(0);
          expect(day.place.trim().length).toBeGreaterThan(0);
          const key = `${day.date}|${day.place}`;
          expect(keys.has(key), `duplicate ${key}`).toBe(false);
          keys.add(key);
        }
      });

      it('explains every unconfirmed date', () => {
        for (const day of mela.days.filter((d) => d.status === 'unconfirmed')) {
          expect(day.note?.trim().length ?? 0, `${day.date} needs a note`).toBeGreaterThan(20);
        }
      });

      it('keeps the period around its days and in IST', () => {
        expect(mela.timezone).toBe('Asia/Kolkata');
        const start = mela.periodStart as string | null;
        const end = mela.periodEnd as string | null;
        if (start) expect(start <= mela.days[0].date).toBe(true);
        if (end) expect(end >= mela.days[mela.days.length - 1].date).toBe(true);
        expect(isOfficial(mela.officialUrl as string)).toBe(true);
      });

      it('cites an official Tier 1-4 source for every text field and never fills one without a source', () => {
        for (const key of EDITORIAL_KEYS) {
          const field = mela[key] as Field | undefined;
          if (!field) continue;
          expect(field.status, `${key} status`).toBe('source_backed');
          expect(field.sourceRefs.length, `${key} needs a source`).toBeGreaterThan(0);
          for (const ref of field.sourceRefs) {
            expect(ref.tier).toBeGreaterThanOrEqual(1);
            expect(ref.tier).toBeLessThanOrEqual(4);
            expect(isOfficial(ref.url), `${key} cites ${ref.url}`).toBe(true);
          }
          expect(field.value.en, `${key} needs English text`).toBeTruthy();
          // Only English is written; a Hindi rendering waits for review (AGENTS.md section 27).
          expect(field.value.hi).toBeUndefined();
          expect(field.translationStatus?.hi).toBe('pending');
        }
        for (const required of ['name', 'tagline', 'significance', 'places', 'rituals'] as const) {
          expect(mela[required], `${required} is required`).toBeTruthy();
        }
      });
    });
  }

  it('pins the Haridwar list as read from the official site, with 15 March unconfirmed', () => {
    const haridwar = melas.find((m) => m.slug === 'haridwar-kumbh-2027')!;
    expect(haridwar.days.map((d) => d.date)).toEqual([
      '2027-01-14', '2027-02-06', '2027-02-11', '2027-02-20', '2027-03-06', '2027-03-08',
      '2027-03-15', '2027-04-07', '2027-04-14', '2027-04-15', '2027-04-20',
    ]);
    expect(haridwar.days.filter((d) => d.status === 'unconfirmed').map((d) => d.date)).toEqual(['2027-03-15']);
    const confirmedAmrit = haridwar.days.filter((d) => d.status === 'confirmed' && d.kind !== 'snan').map((d) => d.date);
    expect(confirmedAmrit).toEqual(['2027-03-06', '2027-03-08', '2027-04-14']);
  });

  it('pins the Nashik–Trimbakeshwar Amrit Snan days as read from the official site', () => {
    const nashik = melas.find((m) => m.slug === 'nashik-trimbakeshwar-simhastha-2027')!;
    const amrit = nashik.days.filter((d) => d.kind === 'amrit_snan' || d.kind === 'principal_amrit_snan').map((d) => `${d.date} ${d.place}`);
    expect(amrit).toEqual([
      '2027-08-02 Nashik',
      '2027-08-31 Nashik',
      '2027-09-11 Ramtirth, Nashik',
      '2027-09-12 Kushavarta Tirth, Trimbakeshwar',
    ]);
    // 29 July is the Nagar Pradakshina procession, not a bath (some news reports called it the first Amrit Snan).
    expect(nashik.days.find((d) => d.date === '2027-07-29')?.kind).toBe('event');
  });
});
