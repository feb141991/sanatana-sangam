import { describe, expect, it } from 'vitest';

import {
  APPROVED_FIXTURE_WRITER,
  fixtureDecisionMatchesOccurrence,
  fixtureEligibilityReasons,
  parseCalendarProfileDecision,
  parseGoldenFixtureDecision,
} from '../approved-fixture-governance';

const fixture = parseGoldenFixtureDecision({
  case_id: 'yogini-ekadashi__2026__ujjain_india__north_indian_purnimanta__smarta',
  festival_id: 'yogini-ekadashi',
  year: 2026,
  location: { label: 'Ujjain, India', lat: 23.1765, lon: 75.7885, tz: 'Asia/Kolkata' },
  profile: { calendar: 'north_indian_purnimanta', tradition: 'smarta', variantKey: 'smarta' },
  expected: { civilDate: '2026-07-10', reasonCodes: ['kshaya_tithi_prevails_before_sunrise'] },
  source: { tier: 1, ref: 'rashtriya-panchang-p29', citation: 'Rashtriya Panchang, printed p.29' },
  approved: true,
  reviewed_by: 'Prince Sharma',
  reviewed_at: '2026-08-14T00:00:00Z',
  review_notes: 'Council batch 0.',
  effective_from: '2026-08-14',
});

const profile = parseCalendarProfileDecision({
  slug: 'north_indian_purnimanta',
  month_system: 'purnimanta',
  version: '1.0.0',
  scholarly_status: 'approved',
  reviewed_by: 'Prince Sharma',
  reviewed_at: '2026-08-14T00:00:00Z',
  effective_from: '2026-08-14',
});

const occurrence = {
  date: '2026-07-10',
  occurrence_date: '2026-07-10',
  year: 2026,
  calculated_by: APPROVED_FIXTURE_WRITER,
  source_provenance: { caseId: fixture.caseId },
  calendar_profile: 'north_indian_purnimanta',
  spiritual_tradition: 'smarta',
  variant_key: 'smarta',
  computed_latitude: 23.1765,
  computed_longitude: 75.7885,
  computed_timezone: 'Asia/Kolkata',
  observance_definitions: { slug: 'yogini-ekadashi' },
};

describe('approved fixture governance', () => {
  it('accepts only an exact effective fixture/profile/occurrence identity', () => {
    expect(fixtureEligibilityReasons(fixture, profile, '2026-08-14')).toEqual([]);
    expect(fixtureDecisionMatchesOccurrence(fixture, profile, occurrence, '2026-08-14')).toBe(true);
  });

  it.each([
    ['date', { date: '2026-07-11', occurrence_date: '2026-07-11' }],
    ['festival', { observance_definitions: { slug: 'another-observance' } }],
    ['variant', { variant_key: 'vaishnava_vidhava' }],
    ['location', { computed_latitude: 52.136 }],
    ['writer', { calculated_by: 'cron_job' }],
    ['case identity', { source_provenance: { caseId: 'another-case' } }],
  ])('rejects a valid decision attached to the wrong %s', (_label, patch) => {
    expect(fixtureDecisionMatchesOccurrence(
      fixture,
      profile,
      { ...occurrence, ...patch },
      '2026-08-14',
    )).toBe(false);
  });

  it('fails closed when the fixture or profile decision is not effective', () => {
    expect(fixtureEligibilityReasons(fixture, profile, '2026-08-13')).toContain('fixture_not_yet_effective');
    expect(fixtureEligibilityReasons(fixture, profile, '2026-08-13')).toContain('calendar_profile_not_yet_effective');
  });
});
