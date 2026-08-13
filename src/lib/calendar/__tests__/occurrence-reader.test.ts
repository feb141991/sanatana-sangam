import { describe, expect, it } from 'vitest';

import { attachMaterialisationBatches, type BatchLookupClient } from '../occurrence-reader';
import type { BatchRow } from '../materialisation-batch';
import { formatOccurrencesToResults } from '../observance-formatter';

function batchClient(result: { data: BatchRow[] | null; error: { message: string } | null }) {
  const calls: Array<{ column: string; values: Array<string | number> }> = [];
  const query = {
    in(column: string, values: Array<string | number>) {
      calls.push({ column, values });
      return query;
    },
    then(resolve: (value: typeof result) => unknown) {
      return Promise.resolve(result).then(resolve);
    },
  };
  const builder = {
    select(_columns: string) {
      return query;
    },
  };
  const client = {
    from(table: 'observance_materialisation_batches') {
      expect(table).toBe('observance_materialisation_batches');
      return builder;
    },
  } as unknown as BatchLookupClient;
  return { client, calls };
}

const completeBatch = (id: string): BatchRow => ({
  id,
  expected_row_count: 2,
  produced_row_count: 2,
  status: 'complete',
  definition_id: 'definition-test',
  year: 2026,
  calendar_profile: 'gujarati-amanta',
  spiritual_tradition: null,
  variant_key: 'default',
  computed_latitude: 23.1765,
  computed_longitude: 75.7885,
  computed_timezone: 'Asia/Kolkata',
} as BatchRow);

const occurrence = (date: string, calendarProfile: string, batchId: string | null) => ({
  date,
  occurrence_date: date,
  year: Number(date.slice(0, 4)),
  definition_id: 'definition-test',
  batch_id: batchId,
  calendar_profile: calendarProfile,
  review_status: 'reviewed',
  verification_status: 'verified',
  audit_status: 'completed',
  spiritual_tradition: null,
  variant_key: 'default',
  is_primary_variant: true,
  reasons: [],
  diagnostics: [],
  source_refs: [],
  computed_latitude: 23.1765,
  computed_longitude: 75.7885,
  computed_timezone: 'Asia/Kolkata',
  observance_definitions: {
    slug: 'test-festival',
    display_name: 'Test Festival',
    emoji: '',
    description: '',
    kind: 'major',
    tradition: 'hindu',
    route_kind: null,
    route_slug: null,
    active: true,
  },
});

const lookupOccurrence = (id: string, batchId: string | null) => ({
  id,
  definition_id: 'definition-test',
  year: 2026,
  calendar_profile: 'gujarati-amanta',
  batch_id: batchId,
  computed_latitude: 23.1765,
  computed_longitude: 75.7885,
  computed_timezone: 'Asia/Kolkata',
});

describe('attachMaterialisationBatches', () => {
  it('does not use the service-role client for legacy rows', async () => {
    const { client, calls } = batchClient({ data: [], error: null });
    const out = await attachMaterialisationBatches([{ id: 'legacy', batch_id: null }], client);

    expect(calls).toHaveLength(0);
    expect(out).toEqual([{
      id: 'legacy',
      batch_id: null,
      batch: null,
      batch_family_complete: true,
      requested_profile_family_incomplete: false,
    }]);
  });

  it('deduplicates IDs and maps each occurrence to its batch', async () => {
    const batch = completeBatch('batch-1');
    const { client, calls } = batchClient({ data: [batch], error: null });
    const out = await attachMaterialisationBatches([
      lookupOccurrence('a', 'batch-1'),
      lookupOccurrence('b', 'batch-1'),
      { id: 'legacy', batch_id: null },
    ], client);

    expect(calls).toEqual([
      { column: 'definition_id', values: ['definition-test'] },
      { column: 'year', values: [2026] },
      { column: 'calendar_profile', values: ['gujarati-amanta'] },
    ]);
    expect(out[0].batch).toMatchObject({ id: 'batch-1', status: 'complete' });
    expect(out[1].batch).toMatchObject({ id: 'batch-1', expected_row_count: 2 });
    expect(out[2].batch).toBeNull();
    expect(out[0].batch_family_complete).toBe(true);
  });

  it('fails closed when a referenced batch is absent', async () => {
    const { client } = batchClient({ data: [], error: null });
    const out = await attachMaterialisationBatches([lookupOccurrence('a', 'missing')], client);

    expect(out[0].batch).toBeNull();
    expect(out[0].batch_family_complete).toBe(false);
  });

  it('surfaces a server-side batch lookup failure', async () => {
    const { client } = batchClient({ data: null, error: { message: 'permission denied' } });

    await expect(
      attachMaterialisationBatches([lookupOccurrence('a', 'batch-1')], client),
    ).rejects.toThrow('Materialisation batch lookup failed: permission denied');
  });

  it('rejects a profile family when an unreferenced sibling batch is partial', async () => {
    const smarta = {
      ...completeBatch('batch-smarta'),
      spiritual_tradition: 'smarta',
      variant_key: 'smarta',
      expected_row_count: 1,
      produced_row_count: 1,
    };
    const missingGaudiya = {
      ...completeBatch('batch-gaudiya'),
      spiritual_tradition: 'gaudiya_iskcon',
      variant_key: 'gaudiya_iskcon',
      status: 'partial' as const,
      expected_row_count: 1,
      produced_row_count: 0,
    };
    const { client } = batchClient({ data: [smarta, missingGaudiya], error: null });
    const rows = await attachMaterialisationBatches([
      occurrence('2026-09-04', 'gujarati-amanta', 'batch-smarta'),
      occurrence('2026-09-03', 'legacy-ujjain', null),
    ], client);

    expect(rows[0].batch).toMatchObject({ id: 'batch-smarta', status: 'complete' });
    expect(rows[0].batch_family_complete).toBe(false);

    const out = formatOccurrencesToResults(
      rows,
      [],
      'hindu',
      'gujarati-amanta',
      null,
      '2026-09-01',
      '2026-09-30',
    );

    expect(out).toHaveLength(1);
    expect(out[0].civilDate).toBe('2026-09-03');
    expect(out[0].profile.calendar).toBe('legacy-ujjain');
    expect(out[0].diagnostics).toContain('incomplete_profile_materialisation');
  });

  it('discloses a failed requested profile even when every occurrence insert is absent', async () => {
    const failedSmarta = {
      ...completeBatch('batch-smarta'),
      spiritual_tradition: 'smarta',
      variant_key: 'smarta',
      status: 'failed' as const,
      expected_row_count: 1,
      produced_row_count: 0,
    };
    const partialGaudiya = {
      ...completeBatch('batch-gaudiya'),
      spiritual_tradition: 'gaudiya_iskcon',
      variant_key: 'gaudiya_iskcon',
      status: 'partial' as const,
      expected_row_count: 1,
      produced_row_count: 0,
    };
    const { client } = batchClient({ data: [failedSmarta, partialGaudiya], error: null });
    const rows = await attachMaterialisationBatches(
      [occurrence('2026-09-03', 'legacy-ujjain', null)],
      client,
      'gujarati-amanta',
      { latitude: 23.1765, longitude: 75.7885, timezone: 'Asia/Kolkata' },
    );

    expect(rows[0].requested_profile_family_incomplete).toBe(true);

    const out = formatOccurrencesToResults(
      rows,
      [],
      'hindu',
      'gujarati-amanta',
      null,
      '2026-09-01',
      '2026-09-30',
    );
    expect(out).toHaveLength(1);
    expect(out[0].profile.calendar).toBe('legacy-ujjain');
    expect(out[0].diagnostics).toContain('incomplete_profile_materialisation');
  });

  it('uses the requested calculation location, not legacy Ujjain, for all-absent detection', async () => {
    const bedfordFailure = {
      ...completeBatch('batch-bedford'),
      computed_latitude: 52.136,
      computed_longitude: -0.4667,
      computed_timezone: 'Europe/London',
      status: 'failed' as const,
      expected_row_count: 1,
      produced_row_count: 0,
    };
    const { client } = batchClient({ data: [bedfordFailure], error: null });
    const rows = await attachMaterialisationBatches(
      [occurrence('2026-09-03', 'legacy-ujjain', null)],
      client,
      'gujarati-amanta',
      { latitude: 52.136, longitude: -0.4667, timezone: 'Europe/London' },
    );

    expect(rows[0].requested_profile_family_incomplete).toBe(true);
  });

  it('lets a complete hydrated profile replace its legacy fallback', async () => {
    const { client } = batchClient({ data: [completeBatch('batch-1')], error: null });
    const rows = await attachMaterialisationBatches([
      occurrence('2026-09-04', 'gujarati-amanta', 'batch-1'),
      occurrence('2026-09-03', 'legacy-ujjain', null),
    ], client);

    const out = formatOccurrencesToResults(
      rows,
      [],
      'hindu',
      'gujarati-amanta',
      null,
      '2026-09-01',
      '2026-09-30',
    );

    expect(out).toHaveLength(1);
    expect(out[0].civilDate).toBe('2026-09-04');
    expect(out[0].profile.calendar).toBe('gujarati-amanta');
  });

  it('keeps and discloses the legacy fallback when hydration cannot prove completeness', async () => {
    const { client } = batchClient({ data: [], error: null });
    const rows = await attachMaterialisationBatches([
      occurrence('2026-09-04', 'gujarati-amanta', 'missing'),
      occurrence('2026-09-03', 'legacy-ujjain', null),
    ], client);

    const out = formatOccurrencesToResults(
      rows,
      [],
      'hindu',
      'gujarati-amanta',
      null,
      '2026-09-01',
      '2026-09-30',
    );

    expect(out).toHaveLength(1);
    expect(out[0].civilDate).toBe('2026-09-03');
    expect(out[0].profile.calendar).toBe('legacy-ujjain');
    expect(out[0].diagnostics).toContain('incomplete_profile_materialisation');
  });
});
