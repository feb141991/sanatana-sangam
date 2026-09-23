import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { fetchIncompleteSeriesOccurrenceIds } from './observance-series-eligibility';
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
