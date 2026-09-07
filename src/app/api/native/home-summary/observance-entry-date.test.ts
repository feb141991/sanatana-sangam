import { describe, it, expect } from 'vitest';
import { buildObservanceEntry } from './route';

describe('buildObservanceEntry date field', () => {
  it('attaches the occurrence row\'s absolute date, distinct from daysLeft', () => {
    const entry = buildObservanceEntry(
      { date: '2026-09-09', observance_definitions: null },
      {
        slug: 'kamada-ekadashi',
        display_name: 'Kamada Ekadashi',
        emoji: '🪔',
        description: 'A vrat observance.',
        kind: 'vrat',
        tradition: 'hindu',
        route_kind: 'vrat',
        route_slug: 'kamada-ekadashi',
        active: true,
      },
      '2026-09-07',
      null
    );

    expect(entry.date).toBe('2026-09-09');
    expect(entry.daysLeft).toBe(2);
    expect(entry.name).toBe('Kamada Ekadashi');
    expect(entry.label).toBe('Kamada Ekadashi in 2 days');
  });

  it('sets date === today for a same-day occurrence', () => {
    const entry = buildObservanceEntry(
      { date: '2026-09-07', observance_definitions: null },
      {
        slug: 'kamada-ekadashi',
        display_name: 'Kamada Ekadashi',
        emoji: '🪔',
        description: null,
        kind: 'vrat',
        tradition: 'hindu',
        route_kind: 'vrat',
        route_slug: 'kamada-ekadashi',
        active: true,
      },
      '2026-09-07',
      null
    );

    expect(entry.date).toBe('2026-09-07');
    expect(entry.daysLeft).toBe(0);
    expect(entry.label).toBe('Today is Kamada Ekadashi');
  });
});
