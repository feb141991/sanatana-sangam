/**
 * Regression coverage: the nightly materialize-occurrences cron must never
 * delete or unlink an existing occurrence row that was never enrolled in one
 * of its own batches.
 *
 * This matters concretely for the 7 "manual seed" observance_occurrences
 * rows found during the 2026-09-04 catalogue audit (das-lakshana-dharma,
 * gudi-padwa-ugadi, paryushana-parva, pavarana, samvatsari, sangha-day,
 * vassa-begins) -- calculated_by: 'legacy_sync', published, with real
 * external source citations, but with NO rules.json entry and therefore
 * zero observance_materialisation_batches rows (see
 * docs/PRD_CALENDAR_MATERIALIZATION_INTEGRITY.md §9). commitOccurrencesWithBatches'
 * retirement/cleanup pass only ever reads rows via
 * `.eq('batch_id', batchId)` for a batch it itself opened this run -- a row
 * whose batch_id is null can never match that query, so it can never reach
 * the unlink-or-delete branch below it. This test proves that structurally,
 * not by inspecting the source.
 */
import { describe, it, expect } from 'vitest';
import { batchIdentityKey, commitOccurrencesWithBatches } from '../materialize';

interface Row { [k: string]: any }

function makeMinimalClient(existingRows: Row[]) {
  const rows: Row[] = existingRows.map((r, i) => ({ id: r.id ?? `existing-${i}`, batch_id: null, ...r }));
  const batches = new Map<string, Row>();
  const deletedIds: string[] = [];
  const unlinkedIds: string[] = [];

  // The obsolete-batch retirement pass (materialize.ts's RETIRE block) chains
  // an arbitrary number of .eq() calls after .select() before awaiting the
  // result. A real Supabase query builder is thenable AND chainable at every
  // step; this mimics that with one object that resolves to "nothing
  // obsolete" no matter how many .eq()/.in() calls precede the await.
  const emptySelectChain: any = {
    eq: () => emptySelectChain,
    in: () => emptySelectChain,
    then: (resolve: (v: { data: any[]; error: null }) => void) => resolve({ data: [], error: null }),
  };

  const client = {
    from(table: string) {
      if (table === 'observance_materialisation_batches') {
        return {
          select: () => emptySelectChain,
          upsert: (row: Row) => ({
            select: () => ({
              single: async () => {
                const id = `batch-${batches.size}`;
                batches.set(id, { ...row, id, status: 'partial', produced_row_count: 0 });
                return { data: { id }, error: null };
              },
            }),
          }),
          update: (patch: Row) => ({
            eq: async (_col: string, id: string) => {
              const b = batches.get(id);
              if (b) batches.set(id, { ...b, ...patch });
              return { error: null };
            },
          }),
        };
      }
      // table === 'observance_occurrences'
      return {
        select(_columns?: string) {
          return {
            // The exact query commitOccurrencesWithBatches' cleanup pass uses:
            // rows are found ONLY by an exact batch_id match. A row seeded
            // with batch_id: null (every manual-seed row) can never satisfy
            // `.eq('batch_id', <some real batch id>)`.
            eq: async (col: string, val: unknown) => {
              if (col === 'batch_id') {
                return { data: rows.filter(r => r.batch_id === val), error: null };
              }
              return { data: [], error: null };
            },
          };
        },
        insert(newRows: Row[]) {
          const arr = Array.isArray(newRows) ? newRows : [newRows];
          return {
            select: async () => {
              for (const r of arr) rows.push({ id: `new-${rows.length}`, ...r });
              return { data: arr.map((_, i) => ({ id: `new-${i}` })), error: null };
            },
          };
        },
        update(_patch: Row) {
          return {
            eq: async (_col: string, id: string) => {
              unlinkedIds.push(id);
              return { error: null };
            },
          };
        },
        delete() {
          return {
            eq: async (_col: string, id: string) => {
              deletedIds.push(id);
              return { error: null };
            },
          };
        },
      };
    },
  };

  return { client, rows, deletedIds, unlinkedIds };
}

describe('commitOccurrencesWithBatches — unbatched rows are structurally untouchable', () => {
  it('never deletes or unlinks a manual-seed row with batch_id: null, even when the engine writes an unrelated identity', async () => {
    const manualSeedRow = {
      id: 'manual-seed-samvatsari-2026',
      definition_id: 'def-samvatsari',
      year: 2026,
      date: '2026-09-06',
      occurrence_date: '2026-09-06',
      calendar_profile: 'legacy-ujjain',
      calculated_by: 'legacy_sync',
      final_date_source: 'legacy_seed',
      batch_id: null,
    };
    const { client, rows, deletedIds, unlinkedIds } = makeMinimalClient([manualSeedRow]);

    // The engine writes an entirely unrelated identity (a different
    // definition) in this run -- exactly the real-world shape, since
    // samvatsari has no rules.json entry and never enters `toInsert` at all.
    const unrelatedRow = {
      definition_id: 'def-diwali',
      year: 2026,
      date: '2026-11-08',
      occurrence_date: '2026-11-08',
      calendar_profile: 'legacy-ujjain',
      spiritual_tradition: null,
      variant_key: 'legacy-default',
      computed_latitude: 23.1765,
      computed_longitude: 75.7885,
      computed_timezone: 'Asia/Kolkata',
    };
    const key = batchIdentityKey(unrelatedRow);

    await commitOccurrencesWithBatches(client, {
      toInsert: [unrelatedRow],
      toUpdate: [],
      toStamp: [],
      expectedByIdentity: new Map([[key, 1]]),
      identityMeta: new Map([[key, { ...unrelatedRow, __slug: 'diwali' }]]),
      versions: { engine: 'test', rule: 'test' },
    });

    expect(deletedIds).not.toContain(manualSeedRow.id);
    expect(unlinkedIds).not.toContain(manualSeedRow.id);
    expect(rows.some(r => r.id === manualSeedRow.id)).toBe(true);
  });
});
