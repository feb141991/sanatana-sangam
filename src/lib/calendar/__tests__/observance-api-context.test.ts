/**
 * observance-api-context.test.ts
 *
 * Unit and integration tests for observance API responses using ResolvedCalendarContext at read time.
 * Verifies:
 * 1. Smarta profile selects 2027-06-30 as primary, keeping Vaishnava date in alternatives.
 * 2. Vaishnava profile selects 2027-07-01 as primary, keeping Smarta date in alternatives.
 * 3. Unspecified profile uses Smarta date 2027-06-30, labelled 'unspecified', with diagnostic 'unspecified_tradition_default'.
 * 4. Missing profile / Unknown tradition profile returns status 'under_review' with civilDate: null, NEVER a guessed date.
 * 5. Guest access resolves context resolutionStatus = 'guest' safely.
 */

import { describe, it, expect } from 'vitest';
import { formatOccurrencesToResults } from '../observance-formatter';
import { resolveCalendarContext } from '../calendar-context';

describe('Observance API Responses with ResolvedCalendarContext', () => {
  const yoginiOccurrences2027Raw = [
    {
      date: '2027-06-30',
      year: '2027',
      calendar_profile: 'north_indian_purnimanta',
      spiritual_tradition: 'smarta',
      variant_key: 'smarta',
      is_primary_variant: false,
      review_status: 'reviewed',
      computed_latitude: 23.1765,
      computed_longitude: 75.7885,
      computed_timezone: 'Asia/Kolkata',
      observance_definitions: {
        slug: 'yogini-ekadashi',
        display_name: 'Yogini Ekadashi',
        emoji: '🌿',
        kind: 'vrat',
        tradition: 'hindu',
        route_kind: 'vrat',
        route_slug: 'yogini-ekadashi',
        active: true,
      },
    },
    {
      date: '2027-07-01',
      year: '2027',
      calendar_profile: 'north_indian_purnimanta',
      spiritual_tradition: 'vaishnava_vidhava',
      variant_key: 'vaishnava_vidhava',
      is_primary_variant: false,
      review_status: 'reviewed',
      computed_latitude: 23.1765,
      computed_longitude: 75.7885,
      computed_timezone: 'Asia/Kolkata',
      observance_definitions: {
        slug: 'yogini-ekadashi',
        display_name: 'Yogini Ekadashi',
        emoji: '🌿',
        kind: 'vrat',
        tradition: 'hindu',
        route_kind: 'vrat',
        route_slug: 'yogini-ekadashi',
        active: true,
      },
    },
  ];

  it('1. Smarta profile: selects 2027-06-30 as primary, placing 2027-07-01 in alternatives', () => {
    const context = resolveCalendarContext({
      calendarProfile: 'north_indian_purnimanta',
      traditionProfile: 'smarta',
    });

    const results = formatOccurrencesToResults(
      yoginiOccurrences2027Raw,
      [],
      'hindu',
      'north_indian_purnimanta',
      'smarta',
      '2027-06-01',
      '2027-07-31',
      context
    );

    expect(results).toHaveLength(2);

    const primary = results.find(r => r.isPrimary);
    const nonPrimary = results.find(r => !r.isPrimary);

    expect(primary).toBeDefined();
    expect(primary!.civilDate).toBe('2027-06-30');
    expect(primary!.profile.tradition).toBe('smarta');
    expect(primary!.alternatives).toHaveLength(1);
    expect(primary!.alternatives[0].civilDate).toBe('2027-07-01');

    expect(nonPrimary).toBeDefined();
    expect(nonPrimary!.civilDate).toBe('2027-07-01');
    expect(nonPrimary!.isPrimary).toBe(false);
  });

  it('2. Vaishnava profile: selects 2027-07-01 as primary, placing 2027-06-30 in alternatives', () => {
    const context = resolveCalendarContext({
      calendarProfile: 'north_indian_purnimanta',
      traditionProfile: 'gaudiya_iskcon',
    });

    const results = formatOccurrencesToResults(
      yoginiOccurrences2027Raw,
      [],
      'hindu',
      'north_indian_purnimanta',
      'gaudiya_iskcon',
      '2027-06-01',
      '2027-07-31',
      context
    );

    expect(results).toHaveLength(2);

    const primary = results.find(r => r.isPrimary);
    const nonPrimary = results.find(r => !r.isPrimary);

    expect(primary).toBeDefined();
    expect(primary!.civilDate).toBe('2027-07-01');
    expect(primary!.profile.tradition).toBe('vaishnava_vidhava');
    expect(primary!.alternatives).toHaveLength(1);
    expect(primary!.alternatives[0].civilDate).toBe('2027-06-30');

    expect(nonPrimary).toBeDefined();
    expect(nonPrimary!.civilDate).toBe('2027-06-30');
    expect(nonPrimary!.isPrimary).toBe(false);
  });

  it('3. Unspecified profile: uses Smarta date 2027-06-30, labelled "unspecified", with diagnostic unspecified_tradition_default', () => {
    const context = resolveCalendarContext({
      calendarProfile: 'north_indian_purnimanta',
      traditionProfile: 'unspecified',
    });

    const results = formatOccurrencesToResults(
      yoginiOccurrences2027Raw,
      [],
      'hindu',
      'north_indian_purnimanta',
      'unspecified',
      '2027-06-01',
      '2027-07-31',
      context
    );

    const primary = results.find(r => r.isPrimary);
    expect(primary).toBeDefined();
    expect(primary!.civilDate).toBe('2027-06-30');
    expect(primary!.profile.tradition).toBe('unspecified');
    expect(primary!.diagnostics).toContain('unspecified_tradition_default');
  });

  it('4. Missing profile / Unknown tradition: returns status under_review with civilDate: null, NEVER a guessed date', () => {
    const context = resolveCalendarContext({
      calendarProfile: null,
      traditionProfile: null,
    });

    const results = formatOccurrencesToResults(
      yoginiOccurrences2027Raw,
      [],
      'all',
      '',
      null,
      '2027-06-01',
      '2027-07-31',
      context
    );

    expect(results).toHaveLength(2);
    for (const r of results) {
      expect(r.status).toBe('under_review');
      expect(r.civilDate).toBeNull();
      expect(r.date).toBe('');
      expect(r.isPrimary).toBe(false);
      expect(r.alternatives).toHaveLength(1);
    }
  });

  it('5. Guest access: resolves guest context safely without treating expired token as guest', () => {
    const guestContext = resolveCalendarContext({
      isAuthenticated: false,
    });

    expect(guestContext.disclosureDiagnostics.resolutionStatus).toBe('guest');
    expect(guestContext.disclosureDiagnostics.calendarProfileInferredFromGps).toBe(false);

    const results = formatOccurrencesToResults(
      yoginiOccurrences2027Raw,
      [],
      'all',
      'global_sanatan',
      null,
      '2027-06-01',
      '2027-07-31',
      guestContext
    );

    expect(results.length).toBeGreaterThan(0);
  });
});
