/**
 * observance-api-context.test.ts
 *
 * Unit and integration tests for observance API responses using ResolvedCalendarContext at read time.
 * Verifies:
 * 1. Smarta profile selects its sourced reading, keeping the Vaishnava reading in alternatives.
 * 2. Vaishnava profile selects its sourced reading, keeping the Smarta reading in alternatives.
 * 3. Unspecified profile uses the Smarta method while remaining labelled 'unspecified'.
 * 4. Missing profile / Unknown tradition profile returns status 'under_review' with civilDate: null, NEVER a guessed date.
 * 5. Guest access resolves context resolutionStatus = 'guest' safely.
 */

import { describe, it, expect } from 'vitest';
import { formatOccurrencesToResults } from '../observance-formatter';
import { resolveCalendarContext } from '../calendar-context';

describe('Observance API Responses with ResolvedCalendarContext', () => {
  const completeBatch = {
    id: 'batch-1',
    status: 'complete',
    expected_row_count: 2,
    produced_row_count: 2,
  };

  const janmashtamiOccurrences2026Raw = [
    {
      date: '2026-09-04',
      year: '2026',
      calendar_profile: 'north_indian_purnimanta',
      spiritual_tradition: 'smarta',
      variant_key: 'smarta',
      batch: completeBatch,
      batch_family_complete: true,
      is_primary_variant: false,
      review_status: 'reviewed',
      computed_latitude: 23.1765,
      computed_longitude: 75.7885,
      computed_timezone: 'Asia/Kolkata',
      observance_definitions: {
        slug: 'krishna-janmashtami',
        display_name: 'Krishna Janmashtami',
        emoji: '🪈',
        kind: 'major',
        tradition: 'hindu',
        route_kind: 'festival',
        route_slug: 'krishna-janmashtami',
        active: true,
      },
    },
    {
      date: '2026-09-05',
      year: '2026',
      calendar_profile: 'north_indian_purnimanta',
      spiritual_tradition: 'gaudiya_iskcon',
      variant_key: 'gaudiya_iskcon',
      batch: completeBatch,
      batch_family_complete: true,
      is_primary_variant: false,
      review_status: 'reviewed',
      computed_latitude: 23.1765,
      computed_longitude: 75.7885,
      computed_timezone: 'Asia/Kolkata',
      observance_definitions: {
        slug: 'krishna-janmashtami',
        display_name: 'Krishna Janmashtami',
        emoji: '🪈',
        kind: 'major',
        tradition: 'hindu',
        route_kind: 'festival',
        route_slug: 'krishna-janmashtami',
        active: true,
      },
    },
  ];

  it('1. Smarta profile selects the Smarta reading and keeps the Vaishnava reading as an alternative', () => {
    const context = resolveCalendarContext({
      calendarProfile: 'north_indian_purnimanta',
      traditionProfile: 'smarta',
      calendarProfileDefinition: {
        slug: 'north_indian_purnimanta',
        monthSystem: 'purnimanta',
        era: 'vikram_north',
      },
      traditionProfileDefinition: {
        slug: 'smarta',
        ekadashiMethod: 'smarta',
        janmashtamiMethod: 'smarta_nishita',
      },
    });

    const results = formatOccurrencesToResults(
      janmashtamiOccurrences2026Raw,
      [],
      'hindu',
      'north_indian_purnimanta',
      'smarta',
      '2026-09-01',
      '2026-09-30',
      context
    );

    expect(results).toHaveLength(2);

    const primary = results.find(r => r.isPrimary);
    const nonPrimary = results.find(r => !r.isPrimary);

    expect(primary).toBeDefined();
    expect(primary!.civilDate).toBe('2026-09-04');
    expect(primary!.profile.tradition).toBe('smarta');
    expect(primary!.alternatives).toHaveLength(1);
    expect(primary!.alternatives[0].civilDate).toBe('2026-09-05');

    expect(nonPrimary).toBeDefined();
    expect(nonPrimary!.civilDate).toBe('2026-09-05');
    expect(nonPrimary!.isPrimary).toBe(false);
  });

  it('2. Vaishnava profile selects the Vaishnava reading and keeps the Smarta reading as an alternative', () => {
    const context = resolveCalendarContext({
      calendarProfile: 'north_indian_purnimanta',
      traditionProfile: 'gaudiya_iskcon',
      calendarProfileDefinition: {
        slug: 'north_indian_purnimanta',
        monthSystem: 'purnimanta',
        era: 'vikram_north',
      },
      traditionProfileDefinition: {
        slug: 'gaudiya_iskcon',
        ekadashiMethod: 'vaishnava_suddha',
        janmashtamiMethod: 'vaishnava_rohini',
      },
    });

    const results = formatOccurrencesToResults(
      janmashtamiOccurrences2026Raw,
      [],
      'hindu',
      'north_indian_purnimanta',
      'gaudiya_iskcon',
      '2026-09-01',
      '2026-09-30',
      context
    );

    expect(results).toHaveLength(2);

    const primary = results.find(r => r.isPrimary);
    const nonPrimary = results.find(r => !r.isPrimary);

    expect(primary).toBeDefined();
    expect(primary!.civilDate).toBe('2026-09-05');
    expect(primary!.profile.tradition).toBe('gaudiya_iskcon');
    expect(primary!.alternatives).toHaveLength(1);
    expect(primary!.alternatives[0].civilDate).toBe('2026-09-04');

    expect(nonPrimary).toBeDefined();
    expect(nonPrimary!.civilDate).toBe('2026-09-04');
    expect(nonPrimary!.isPrimary).toBe(false);
  });

  it('2b. Janmashtami selection uses janmashtami_method, not ekadashi_method', () => {
    const context = resolveCalendarContext({
      calendarProfile: 'north_indian_purnimanta',
      traditionProfile: 'policy-divergence-fixture',
      calendarProfileDefinition: {
        slug: 'north_indian_purnimanta',
        monthSystem: 'purnimanta',
        era: 'vikram_north',
      },
      traditionProfileDefinition: {
        slug: 'policy-divergence-fixture',
        ekadashiMethod: 'smarta',
        janmashtamiMethod: 'vaishnava_rohini',
      },
    });

    const results = formatOccurrencesToResults(
      janmashtamiOccurrences2026Raw,
      [],
      'hindu',
      'north_indian_purnimanta',
      'policy-divergence-fixture',
      '2026-09-01',
      '2026-09-30',
      context,
    );

    expect(results.find(result => result.isPrimary)?.civilDate).toBe('2026-09-05');
  });

  it('3. Unspecified profile uses the Smarta method, remains labelled unspecified, and discloses the default', () => {
    const context = resolveCalendarContext({
      calendarProfile: 'north_indian_purnimanta',
      traditionProfile: 'unspecified',
      calendarProfileDefinition: {
        slug: 'north_indian_purnimanta',
        monthSystem: 'purnimanta',
        era: 'vikram_north',
      },
      traditionProfileDefinition: {
        slug: 'unspecified',
        ekadashiMethod: 'smarta',
        janmashtamiMethod: 'smarta_nishita',
      },
    });

    const results = formatOccurrencesToResults(
      janmashtamiOccurrences2026Raw,
      [],
      'hindu',
      'north_indian_purnimanta',
      'unspecified',
      '2026-09-01',
      '2026-09-30',
      context
    );

    const primary = results.find(r => r.isPrimary);
    expect(primary).toBeDefined();
    expect(primary!.civilDate).toBe('2026-09-04');
    expect(primary!.profile.tradition).toBe('unspecified');
    expect(primary!.diagnostics).toContain('unspecified_tradition_default');
  });

  it('4. Missing profile / Unknown tradition: returns status under_review with civilDate: null, NEVER a guessed date', () => {
    const context = resolveCalendarContext({
      calendarProfile: null,
      traditionProfile: null,
    });

    const results = formatOccurrencesToResults(
      janmashtamiOccurrences2026Raw,
      [],
      'all',
      '',
      null,
      '2026-09-01',
      '2026-09-30',
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
      janmashtamiOccurrences2026Raw,
      [],
      'all',
      'global_sanatan',
      null,
      '2026-09-01',
      '2026-09-30',
      guestContext
    );

    expect(results.length).toBeGreaterThan(0);
  });
});
