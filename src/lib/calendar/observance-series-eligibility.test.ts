import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { fetchIncompleteSeriesOccurrenceIds, getSeriesSiblingSlugs } from './observance-series-eligibility';
import { SERIES_DEFINITIONS } from './observance-series';

describe('fetchIncompleteSeriesOccurrenceIds', () => {
  it('fails closed when the sibling-completeness query fails', async () => {
    const builder = {
      select: vi.fn(() => builder),
      in: vi.fn(() => builder),
      eq: vi.fn(() => builder),
      gte: vi.fn(() => builder),
      lte: vi.fn(() => builder),
      then: (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) =>
        Promise.resolve({ data: null, error: { message: 'database unavailable' } }).then(resolve, reject),
    };
    const supabase = { from: vi.fn(() => builder) } as unknown as SupabaseClient;
    const slug = SERIES_DEFINITIONS[0].children[0].slug;

    await expect(fetchIncompleteSeriesOccurrenceIds(supabase, [slug], ['2026-10-11']))
      .rejects.toThrow('Failed to load observance series siblings: database unavailable');
  });
});


describe('canonical sibling query scope', () => {
  it('loads all fourteen Pitru siblings from a single current-day candidate', async () => {
    const slugs = getSeriesSiblingSlugs(['pitru-paksha-day-4']);
    expect(slugs).toHaveLength(14);
    expect(slugs).toEqual([...Array.from({ length: 13 }, (_, i) => `pitru-paksha-day-${i+1}`), 'mahalaya-amavasya']);
    const builder = {
      select: vi.fn(() => builder), in: vi.fn(() => builder), eq: vi.fn(() => builder),
      gte: vi.fn(() => builder), lte: vi.fn(() => builder),
      then: (resolve: (value: unknown) => unknown) => Promise.resolve({ data: [], error: null }).then(resolve),
    };
    const db = { from: () => builder } as unknown as SupabaseClient;
    await fetchIncompleteSeriesOccurrenceIds(db, ['pitru-paksha-day-4'], ['2026-09-30']);
    expect(builder.in).toHaveBeenCalledWith('observance_definitions.slug', slugs);
    expect(builder.gte).toHaveBeenCalledWith('date', '2026-09-15');
    expect(builder.lte).toHaveBeenCalledWith('date', '2026-10-15');
    expect(slugs).not.toContain('diwali');
  });
});
