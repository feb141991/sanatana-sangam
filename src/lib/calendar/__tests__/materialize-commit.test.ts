/**
 * Commit-mode tests for materializeOccurrencesForYears.
 *
 * WHY THESE EXIST
 * ---------------
 * Commit mode had never been exercised by a test. It writes to
 * `observance_occurrences`, whose D15 schema carries constraints the code was
 * silently violating:
 *
 *   - `occurrence_date` is NOT NULL (migration 20260804030000 line 93), but both
 *     LEGACY-path inserts omitted it -- and the legacy path is the ACTIVE one
 *     while USE_CONDITION_EVALUATOR is false. A real commit would have failed.
 *   - `occurrence_date` is part of the uniqueness key
 *     (definition_id, calendar_profile, occurrence_date, variant_key), so an
 *     UPDATE that moves `date` without moving `occurrence_date` leaves the row
 *     keyed on one date while claiming another.
 *
 * Neither is catchable in dry-run, which returns a plan and writes nothing. So
 * the fake client below does not merely record calls -- it ENFORCES the schema:
 * NOT NULL and the composite unique key are asserted on every write, exactly as
 * Postgres would. A test that only counted rows would have passed throughout the
 * period the bug existed.
 *
 * The client is deliberately dumb about everything else. It is a constraint
 * oracle, not a database.
 */
import { describe, it, expect } from 'vitest';
import { materializeOccurrencesForYears } from '../materialize';

// ---------------------------------------------------------------------------
// Fake Supabase client
// ---------------------------------------------------------------------------

interface Row { [k: string]: any }

/** Columns the D15 migration declares NOT NULL on observance_occurrences. */
const NOT_NULL = ['definition_id', 'year', 'date', 'occurrence_date'];

/** The D15 composite uniqueness key, verbatim from migration line 159:
 *  UNIQUE (definition_id, year, calendar_profile, occurrence_date, variant_key) */
const uniqueKey = (r: Row) =>
  `${r.definition_id}|${r.year}|${r.calendar_profile ?? 'legacy-ujjain'}|${r.occurrence_date}|${r.variant_key ?? 'legacy-default'}`;

function makeClient(opts: { definitions: Array<{ id: string; slug: string }>; existing?: Row[] }) {
  const existing = (opts.existing ?? []).map((r, i) => ({ id: r.id ?? `existing-${i}`, ...r }));
  const inserted: Row[] = [];
  const updated: Array<{ id: string; patch: Row }> = [];
  const queueUpserts: Row[] = [];

  /** Stands in for Postgres. Throws the way the real constraints would. */
  const enforce = (row: Row) => {
    for (const col of NOT_NULL) {
      if (row[col] === undefined || row[col] === null) {
        throw new Error(`null value in column "${col}" violates not-null constraint`);
      }
    }
    const key = uniqueKey(row);
    const live = ([...existing, ...inserted] as Row[]).filter(r => r !== row);
    if (live.some(r => uniqueKey(r) === key)) {
      throw new Error(`duplicate key value violates unique constraint: ${key}`);
    }
  };

  // Batch rows, keyed by the migration's unique identity index. Modelled here
  // rather than stubbed away because the batch CHECK constraint is the single
  // fact the read path trusts, and a fake that accepts an impossible batch would
  // let a broken materialiser pass.
  const batches = new Map<string, Row>();
  const batchIdentity = (r: Row) => [
    r.definition_id, r.year, r.calendar_profile,
    r.spiritual_tradition ?? '', r.variant_key ?? '',
    r.computed_latitude, r.computed_longitude, r.computed_timezone,
  ].join('|');

  const client = {
    from(table: string) {
      if (table === 'observance_materialisation_batches') {
        return {
          upsert: (row: Row) => ({
            select: () => ({
              single: async () => {
                const key = batchIdentity(row);
                const prior = batches.get(key);
                // Re-opening must RESET, or a failed re-run inherits the previous
                // run's 'complete' over an incomplete set of rows.
                const id = prior?.id ?? `batch-${batches.size}`;
                batches.set(key, { ...row, id, status: 'partial', produced_row_count: 0 });
                return { data: { id }, error: null };
              },
            }),
          }),
          update: (patch: Row) => ({
            eq: async (_col: string, id: string) => {
              for (const [k, b] of batches) {
                if (b.id !== id) continue;
                const merged = { ...b, ...patch };
                // Mirrors observance_materialisation_batches_complete_means_complete.
                if (merged.status === 'complete' && merged.produced_row_count !== merged.expected_row_count) {
                  throw new Error(
                    `batch ${id} claims complete with ${merged.produced_row_count}/${merged.expected_row_count} rows`
                  );
                }
                batches.set(k, merged);
              }
              return { error: null };
            },
          }),
        };
      }
      return {
        select() {
          return {
            eq: async () => ({ data: opts.definitions, error: null }),
            in: async () => ({ data: table === 'observance_occurrences' ? existing : [], error: null }),
            // insert().select('id') resolves here
            then: undefined,
          };
        },
        insert(rows: Row[]) {
          const arr = Array.isArray(rows) ? rows : [rows];
          return {
            select: async () => {
              for (const r of arr) {
                enforce(r);
                inserted.push({ id: `new-${inserted.length}`, ...r });
              }
              return { data: arr.map((_, i) => ({ id: `new-${i}` })), error: null };
            },
          };
        },
        update(patch: Row) {
          return {
            eq: async (_col: string, id: string) => {
              const target: Row | undefined = ([...existing, ...inserted] as Row[]).find(r => r.id === id);
              if (target) {
                const merged = { ...target, ...patch };
                for (const col of NOT_NULL) {
                  if (merged[col] === undefined || merged[col] === null) {
                    throw new Error(`null value in column "${col}" violates not-null constraint`);
                  }
                }
                // The whole point: if `date` moved, `occurrence_date` must move
                // with it, or the row is keyed on a date it no longer claims.
                if (patch.date !== undefined && merged.date !== merged.occurrence_date) {
                  throw new Error(
                    `row ${id} claims date ${merged.date} but is keyed on occurrence_date ${merged.occurrence_date}`
                  );
                }
                Object.assign(target, patch);
              }
              updated.push({ id, patch });
              return { error: null };
            },
          };
        },
        upsert(rows: Row[]) {
          queueUpserts.push(...(Array.isArray(rows) ? rows : [rows]));
          return Promise.resolve({ error: null });
        },
      };
    },
  };

  return { client, inserted, updated, queueUpserts, existing, batches };
}

const DEFS = [
  { id: 'def-diwali', slug: 'diwali' },
  { id: 'def-holi', slug: 'holi' },
];

// ---------------------------------------------------------------------------

describe('materializeOccurrencesForYears — commit mode', () => {
  it('every inserted row satisfies the NOT NULL columns, including occurrence_date', async () => {
    const { client, inserted } = makeClient({ definitions: DEFS });

    await materializeOccurrencesForYears({
      supabase: client as any,
      targetYears: [2026],
      calculatedBy: 'commit-mode-test',
      commit: true,
    });

    expect(inserted.length, 'expected at least one insert to exercise the path').toBeGreaterThan(0);
    for (const row of inserted) {
      for (const col of NOT_NULL) {
        expect(row[col], `${row.definition_id}: ${col} must not be null`).toBeDefined();
        expect(row[col], `${row.definition_id}: ${col} must not be null`).not.toBeNull();
      }
    }
  });

  it('occurrence_date equals date on insert', async () => {
    const { client, inserted } = makeClient({ definitions: DEFS });
    await materializeOccurrencesForYears({
      supabase: client as any, targetYears: [2026], calculatedBy: 't', commit: true,
    });
    for (const row of inserted) {
      expect(row.occurrence_date, `${row.definition_id} @ ${row.date}`).toBe(row.date);
    }
  });

  it('an update that moves date also moves occurrence_date', async () => {
    // A stored row whose date is deliberately stale, forcing the update branch.
    const { client, updated } = makeClient({
      definitions: DEFS,
      existing: [{
        id: 'row-1', definition_id: 'def-diwali', year: 2026,
        date: '1999-01-01', occurrence_date: '1999-01-01',
        calendar_profile: 'legacy-ujjain', variant_key: 'legacy-default',
        manual_date_override: null, locked_for_regeneration: false,
        final_date_source: 'calculation_engine',
      }],
    });

    // The fake client throws if date and occurrence_date diverge, so reaching
    // here without throwing IS the assertion.
    await materializeOccurrencesForYears({
      supabase: client as any, targetYears: [2026], calculatedBy: 't', commit: true,
    });

    const moved = updated.find(u => u.id === 'row-1');
    if (moved && moved.patch.date !== undefined) {
      expect(moved.patch.occurrence_date, 'patch moved date without occurrence_date').toBe(moved.patch.date);
    }
  });

  it('rows for different profiles are not collapsed into one identity', async () => {
    // Two stored rows, same definition and year, DIFFERENT profile. Before the
    // repair the existing-row map keyed on definition_id:year, so the second
    // overwrote the first and one of them looked absent — inviting a duplicate
    // insert that the D15 unique constraint would then reject.
    const { client, inserted } = makeClient({
      definitions: DEFS,
      existing: [
        { id: 'p1', definition_id: 'def-diwali', year: 2026, date: '2026-11-08',
          occurrence_date: '2026-11-08', calendar_profile: 'legacy-ujjain',
          variant_key: 'legacy-default', manual_date_override: null,
          locked_for_regeneration: false, final_date_source: 'calculation_engine' },
        { id: 'p2', definition_id: 'def-diwali', year: 2026, date: '2026-11-08',
          occurrence_date: '2026-11-08', calendar_profile: 'north_indian_purnimanta',
          variant_key: 'legacy-default', manual_date_override: null,
          locked_for_regeneration: false, final_date_source: 'calculation_engine' },
      ],
    });

    await materializeOccurrencesForYears({
      supabase: client as any, targetYears: [2026], calculatedBy: 't', commit: true,
    });

    // The legacy-ujjain row must be recognised as existing, so diwali is not
    // re-inserted for that profile.
    const dupeDiwali = inserted.filter(
      r => r.definition_id === 'def-diwali' && (r.calendar_profile ?? 'legacy-ujjain') === 'legacy-ujjain'
    );
    expect(dupeDiwali, 'diwali re-inserted for a profile that already has a row').toHaveLength(0);
  });

  it('dry run writes nothing', async () => {
    const { client, inserted, updated } = makeClient({ definitions: DEFS });
    const res = await materializeOccurrencesForYears({
      supabase: client as any, targetYears: [2026], calculatedBy: 't', commit: false,
    });
    expect(inserted).toHaveLength(0);
    expect(updated).toHaveLength(0);
    expect(res.mode).toBe('dry_run');
  });

  it('a locked row is never rewritten', async () => {
    const { client, updated } = makeClient({
      definitions: DEFS,
      existing: [{
        id: 'locked-1', definition_id: 'def-diwali', year: 2026,
        date: '1999-01-01', occurrence_date: '1999-01-01',
        calendar_profile: 'legacy-ujjain', variant_key: 'legacy-default',
        manual_date_override: null, locked_for_regeneration: true,
        final_date_source: 'manual_override',
      }],
    });
    await materializeOccurrencesForYears({
      supabase: client as any, targetYears: [2026], calculatedBy: 't', commit: true,
    });
    expect(updated.find(u => u.id === 'locked-1'), 'locked_for_regeneration row was modified').toBeUndefined();
  });

  it('re-running commit twice is idempotent — the second run inserts nothing', async () => {
    const first = makeClient({ definitions: DEFS });
    await materializeOccurrencesForYears({
      supabase: first.client as any, targetYears: [2026], calculatedBy: 't', commit: true,
    });
    const firstCount = first.inserted.length;
    expect(firstCount).toBeGreaterThan(0);

    // Feed the first run's output back in as existing rows.
    const second = makeClient({ definitions: DEFS, existing: first.inserted });
    await materializeOccurrencesForYears({
      supabase: second.client as any, targetYears: [2026], calculatedBy: 't', commit: true,
    });

    expect(
      second.inserted.length,
      'second commit re-inserted rows that already exist — the existing-row lookup is not finding them'
    ).toBe(0);
  });

  it('stamps every inserted row with a batch and a series-instance key', async () => {
    // The read path may only trust rows it can tie to a completed batch. A row
    // with neither is indistinguishable from the 557 pre-contract legacy rows,
    // so an unstamped insert would quietly opt out of the whole contract.
    const c = makeClient({ definitions: DEFS });
    await materializeOccurrencesForYears({
      supabase: c.client as any, targetYears: [2026], calculatedBy: 't', commit: true,
    });
    expect(c.inserted.length).toBeGreaterThan(0);
    expect(c.inserted.every(r => !!r.batch_id)).toBe(true);
    expect(c.inserted.every(r => typeof r.series_instance_key === 'string' && r.series_instance_key.length === 32)).toBe(true);
  });

  it('never leaks the internal __slug / __anchor fields into the insert payload', async () => {
    // They exist only to carry write-time facts to the batch helper. Postgres
    // would reject them as unknown columns, so this fails loudly in tests rather
    // than at the first real commit.
    const c = makeClient({ definitions: DEFS });
    await materializeOccurrencesForYears({
      supabase: c.client as any, targetYears: [2026], calculatedBy: 't', commit: true,
    });
    expect(c.inserted.some(r => '__slug' in r || '__anchor' in r)).toBe(false);
  });

  it('closes each batch as complete only when every expected row landed', async () => {
    // The fake enforces the same CHECK as the database, so a batch that claimed
    // completeness without the rows would throw rather than pass.
    const c = makeClient({ definitions: DEFS });
    await materializeOccurrencesForYears({
      supabase: c.client as any, targetYears: [2026], calculatedBy: 't', commit: true,
    });
    const all = [...c.batches.values()];
    expect(all.length).toBeGreaterThan(0);
    expect(all.every(b => b.status === 'complete')).toBe(true);
    expect(all.every(b => b.produced_row_count === b.expected_row_count)).toBe(true);
    // Every produced row is accounted for by exactly the batches' totals.
    const produced = all.reduce((n, b) => n + (b.produced_row_count as number), 0);
    expect(produced).toBe(c.inserted.length);
  });

  it('gives one instance ONE key across its variants, and distinct keys across a series', async () => {
    // The property the whole identity change exists for. Rows sharing an
    // instance anchor must share a key even though their dates differ, and
    // separate instances of a recurring series must not collide.
    const c = makeClient({ definitions: DEFS });
    await materializeOccurrencesForYears({
      supabase: c.client as any, targetYears: [2026], calculatedBy: 't', commit: true,
    });
    const byKey = new Map<string, Set<string>>();
    for (const r of c.inserted) {
      const k = r.series_instance_key as string;
      if (!byKey.has(k)) byKey.set(k, new Set());
      byKey.get(k)!.add(r.date as string);
    }
    // Distinct dates of one slug-year must not all collapse onto one key.
    const diwali = c.inserted.filter(r => r.definition_id === 'def-diwali');
    if (diwali.length > 1) {
      expect(new Set(diwali.map(r => r.series_instance_key)).size).toBe(diwali.length);
    }
    expect(byKey.size).toBe(new Set(c.inserted.map(r => `${r.definition_id}|${r.date}`)).size);
  });
});
