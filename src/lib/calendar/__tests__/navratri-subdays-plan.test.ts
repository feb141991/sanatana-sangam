import { describe, expect, it } from 'vitest';
import {
  NAVRATRI_SUBDAY_SLUGS, planNavratriSubdays,
  type ExistingSubdayRow,
} from '../../../../scripts/navratri-subdays-plan';
import type { CalculatedOccurrence } from '../engine';

const slug = NAVRATRI_SUBDAY_SLUGS[0];
const definitions = new Map([[slug, 'def-day1']]);
const calculated: CalculatedOccurrence[] = [{ slug, ruleKey: slug, date: '2026-10-11', year: 2026 }];

function existing(overrides: Partial<ExistingSubdayRow> = {}): ExistingSubdayRow {
  return {
    id: 'row-day1', definition_id: 'def-day1', year: 2026,
    date: '2026-10-11', occurrence_date: '2026-10-11',
    calendar_profile: 'legacy-ujjain', spiritual_tradition: null,
    variant_key: 'legacy-default', computed_latitude: 23.1765,
    computed_longitude: 75.7885, computed_timezone: 'Asia/Kolkata',
    locked_for_regeneration: false, manual_date_override: null,
    final_date_source: 'calculation_engine', publication_status: 'withheld_disputed', review_status: null,
    verification_status: 'not_checked', ...overrides,
  };
}

describe('Navratri scoped materialisation plan', () => {
  it('inserts a missing Day 1 as withheld and unapproved', () => {
    const plan = planNavratriSubdays(calculated, definitions, [], 'engine-test');
    expect(plan.toInsert).toHaveLength(1);
    expect(plan.toStamp).toHaveLength(0);
    expect(plan.toInsert[0]).toMatchObject({
      date: '2026-10-11', occurrence_date: '2026-10-11',
      publication_status: 'withheld_disputed', review_status: 'needs_review',
      verification_status: 'not_checked', audit_status: 'not_run',
    });
    expect([...plan.expectedByIdentity.values()]).toEqual([1]);
  });

  it('restamps an exact existing row into a complete expected batch on repeat runs', () => {
    const first = planNavratriSubdays(calculated, definitions, [existing()], 'engine-test');
    const repeat = planNavratriSubdays(calculated, definitions, [existing()], 'engine-test');
    expect(first.toInsert).toHaveLength(0);
    expect(first.toStamp).toEqual(repeat.toStamp);
    expect(first.toStamp).toMatchObject([{ id: 'row-day1', slug, date: '2026-10-11' }]);
    expect(first.expectedByIdentity.get(first.toStamp[0].identityKey)).toBe(1);
  });

  it('does not mistake another location for the Ujjain identity', () => {
    const plan = planNavratriSubdays(calculated, definitions, [existing({ computed_latitude: 40, computed_longitude: 20, computed_timezone: 'Europe/Tirane' })], 'engine-test');
    expect(plan.toInsert).toHaveLength(1);
    expect(plan.toStamp).toHaveLength(0);
  });

  it('fails closed on same-identity date conflicts or duplicate rows', () => {
    expect(() => planNavratriSubdays(calculated, definitions, [existing({ date: '2026-10-12', occurrence_date: '2026-10-12' })], 'engine-test')).toThrow(/date conflict/);
    expect(() => planNavratriSubdays(calculated, definitions, [existing(), existing({ id: 'duplicate' })], 'engine-test')).toThrow(/Multiple rows/);
  });

  it('does not restamp a protected review or manual override', () => {
    expect(() => planNavratriSubdays(calculated, definitions, [existing({ review_status: 'reviewed' })], 'engine-test')).toThrow(/protected/);
    expect(() => planNavratriSubdays(calculated, definitions, [existing({ manual_date_override: '2026-10-11' })], 'engine-test')).toThrow(/protected/);
  });

  it('refuses to restamp a Day 1 row that escaped the publication gate', () => {
    expect(() => planNavratriSubdays(calculated, definitions, [existing({ publication_status: 'published' })], 'engine-test')).toThrow(/containment migration/);
  });

  it('detects missing or multiply calculated annual children', () => {
    expect(() => planNavratriSubdays(calculated, new Map(), [], 'engine-test')).toThrow(/Missing definition/);
    expect(() => planNavratriSubdays([...calculated, ...calculated], definitions, [], 'engine-test')).toThrow(/Multiple annual/);
  });
});
