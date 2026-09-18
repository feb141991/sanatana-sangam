import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { compareOfficialClaims, OFFICIAL_CALENDAR_CLAIMS, type FixtureEvidence } from '../official-calendar-claims';

const claim = OFFICIAL_CALENDAR_CLAIMS.find((row) => row.slug === 'diwali');
if (!claim) throw new Error('Missing manifest-backed Diwali spot check');

const fixture = (expected: string | null, approved = false): FixtureEvidence => ({
  case_id: 'diwali-2026-ujjain',
  festival_id: 'diwali',
  year: 2026,
  expected: expected ? { civilDate: expected } : null,
  approved,
  profile: { calendar: 'legacy-ujjain' },
  location: { label: 'Ujjain', tz: 'Asia/Kolkata' },
});

describe('official calendar claim comparison', () => {
  it('keeps every copied claim traceable to the edition manifest row', () => {
    for (const row of OFFICIAL_CALENDAR_CLAIMS) {
      const manifest = readFileSync(join(process.cwd(), row.manifest), 'utf8');
      const citedRow = manifest.split('\n').find((line) => line.startsWith('|') && line.includes(`\`${row.slug}\``) && line.includes(row.date));
      expect(citedRow, `${row.slug} ${row.date} missing from ${row.manifest}`).toBeDefined();
    }
  });

  it('reports missing and unsourced fixtures without calling them date conflicts', () => {
    expect(compareOfficialClaims([claim], [])[0].status).toBe('no_fixture');
    expect(compareOfficialClaims([claim], [fixture(null)])[0].status).toBe('fixture_needs_source');
  });

  it('separates matching unapproved, matching approved, and differing dates', () => {
    expect(compareOfficialClaims([claim], [fixture(claim.date)])[0].status).toBe('matching_unapproved');
    expect(compareOfficialClaims([claim], [fixture(claim.date, true)])[0].status).toBe('matching_approved');
    expect(compareOfficialClaims([claim], [fixture('2026-11-09')])[0].status).toBe('different_date');
    expect(compareOfficialClaims([claim], [fixture(claim.date, true), { ...fixture('2026-11-09'), case_id: 'other-profile' }])[0].status).toBe('mixed_dates');
  });

  it('does not collapse recurring variant evidence or other years', () => {
    const variants = OFFICIAL_CALENDAR_CLAIMS.filter((row) => row.slug === 'yogini-ekadashi');
    expect(variants).toHaveLength(2);
    const unrelatedYear = { ...fixture('2026-07-10'), festival_id: 'yogini-ekadashi', year: 2027 };
    expect(compareOfficialClaims(variants, [unrelatedYear]).map((row) => row.status)).toEqual(['no_fixture', 'no_fixture']);
  });
});
