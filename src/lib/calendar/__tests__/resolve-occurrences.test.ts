/**
 * ensureYearMaterialized hardening: a real production incident (2026-09-04,
 * backfilling legacy-ujjain after the corrected_2026_festival_migration
 * cleanup) hit two failures this file's changes are meant to prevent from
 * ever reaching production silently again:
 *
 * 1. Krishna Janmashtami is a SINGLE observance_definitions row (kind:
 *    'major') that legitimately produces two variant_key occurrence rows
 *    for the same year -- smarta_nishita, gaudiya_iskcon. trg_sync_
 *    occurrence_to_festival mirrors every legacy-ujjain row into a legacy
 *    `festivals` table unique on (name, year) with no variant_key column at
 *    all, keyed per occurrence row id -- so BOTH variant rows try to insert
 *    their own festivals row under the same (name, year) and the second one
 *    violates the constraint, aborting the write.
 * 2. rules.json's own variant vocabulary ('smarta_nishita') doesn't always
 *    match a tradition_profiles.slug FK target ('smarta') -- writing it
 *    verbatim fails the same way.
 *
 * The fix (collapseFestivalMirrorNameCollisions) must also NOT collapse a
 * recurring vrat definition's many real dates in a year (e.g. the generic
 * 'ekadashi' rule, ~24/year, one definition/display_name) -- the trigger
 * itself already exempts kind: 'vrat' definitions (DELETEs rather than
 * INSERTs for those), so none of their rows ever reach the constraint this
 * function protects against.
 *
 * ADDED AFTER REVIEW (native Home "second hero pill" reliability fix): the
 * original existence-check here ("does any occurrence row exist for this
 * combo/year") was replaced with `isYearMaterialized`, which trusts a
 * materialisation MANIFEST (expected identity count + hash + full
 * provenance) rather than inferring completeness from whichever batch rows
 * happen to exist. The tests below (`isYearMaterialized`) cover the specific
 * failure modes a batch-only design could not: a missing batch despite a
 * manifest expecting it, a stale provenance version, and a matching count
 * with a mismatched identity set.
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('../engine', () => ({
  calculateObservancesForYear: vi.fn(),
  RULE_ENGINE_VERSION: '2.0.0',
}));

const { calculateObservancesForYear } = await import('../engine') as unknown as {
  calculateObservancesForYear: ReturnType<typeof vi.fn>;
};
const { ensureYearMaterialized, isYearMaterialized } = await import('../resolve-occurrences');
const { currentMaterializationProvenance } = await import('../materialisation-batch');

const CURRENT_PROVENANCE = currentMaterializationProvenance('2.0.0');

/**
 * A minimal, in-memory fake covering exactly the tables/methods
 * ensureYearMaterialized and isYearMaterialized use: observance_definitions,
 * tradition_profiles, observance_occurrences (upsert only), and the two
 * materialisation tables (manifest + batches), each keyed by their real
 * unique identity so a re-run behaves like a real upsert would.
 */
function makeSupabase({
  definitions,
  traditionSlugs,
  manifests = [],
  batches = [],
}: {
  definitions: Array<{ id: string; slug: string; display_name: string; kind: string }>;
  traditionSlugs: string[];
  manifests?: any[];
  batches?: any[];
}) {
  const upserted: any[] = [];
  const manifestStore = new Map<string, any>(
    manifests.map((m) => [`${m.year}|${m.calendar_profile}|${m.computed_latitude}|${m.computed_longitude}|${m.computed_timezone}`, { ...m }]),
  );
  const batchStore = new Map<string, any>(
    batches.map((b, i) => [
      b.id ?? `seed-batch-${i}`,
      { id: b.id ?? `seed-batch-${i}`, ...b },
    ]),
  );
  let batchCounter = batchStore.size;

  const manifestKey = (r: any) => `${r.year}|${r.calendar_profile}|${r.computed_latitude}|${r.computed_longitude}|${r.computed_timezone}`;

  return {
    upserted,
    manifestStore,
    batchStore,
    from(table: string) {
      if (table === 'observance_occurrences') {
        return {
          upsert: async (rows: any[]) => {
            upserted.push(...rows);
            return { error: null };
          },
        };
      }
      if (table === 'observance_definitions') {
        return { select: () => ({ eq: async () => ({ data: definitions, error: null }) }) };
      }
      if (table === 'tradition_profiles') {
        return { select: async () => ({ data: traditionSlugs.map((slug) => ({ slug })), error: null }) };
      }
      if (table === 'observance_materialisation_manifests') {
        return {
          select: () => {
            const filters: Record<string, unknown> = {};
            const chain: any = {
              eq(col: string, val: unknown) {
                filters[col] = val;
                return chain;
              },
              maybeSingle: async () => {
                const key = `${filters.year}|${filters.calendar_profile}|${filters.computed_latitude}|${filters.computed_longitude}|${filters.computed_timezone}`;
                return { data: manifestStore.get(key) ?? null, error: null };
              },
            };
            return chain;
          },
          upsert: async (row: any) => {
            manifestStore.set(manifestKey(row), { ...row });
            return { error: null };
          },
          update: (patch: any) => {
            const filters: Record<string, unknown> = {};
            const chain: any = {
              eq(col: string, val: unknown) {
                filters[col] = val;
                if (Object.keys(filters).length === 5) {
                  const key = `${filters.year}|${filters.calendar_profile}|${filters.computed_latitude}|${filters.computed_longitude}|${filters.computed_timezone}`;
                  const existing = manifestStore.get(key);
                  if (existing) manifestStore.set(key, { ...existing, ...patch });
                  return Promise.resolve({ error: null });
                }
                return chain;
              },
            };
            return chain;
          },
        };
      }
      if (table === 'observance_materialisation_batches') {
        return {
          select: () => {
            const filters: Record<string, unknown> = {};
            const chain: any = {
              eq(col: string, val: unknown) {
                filters[col] = val;
                return chain;
              },
              then: (resolve: (v: { data: any[]; error: null }) => void) => {
                const rows = [...batchStore.values()].filter((b) =>
                  Object.entries(filters).every(([k, v]) => b[k] === v),
                );
                resolve({ data: rows, error: null });
              },
            };
            return chain;
          },
          upsert: (row: any) => ({
            select: () => ({
              single: async () => {
                const identityKey = `${row.definition_id}|${row.year}|${row.calendar_profile}|${row.spiritual_tradition ?? ''}|${row.variant_key ?? ''}|${row.computed_latitude}|${row.computed_longitude}|${row.computed_timezone}`;
                const existing = [...batchStore.entries()].find(([, b]) => `${b.definition_id}|${b.year}|${b.calendar_profile}|${b.spiritual_tradition ?? ''}|${b.variant_key ?? ''}|${b.computed_latitude}|${b.computed_longitude}|${b.computed_timezone}` === identityKey);
                const id = existing?.[0] ?? `batch-${batchCounter++}`;
                batchStore.set(id, { ...row, id });
                return { data: { id }, error: null };
              },
            }),
          }),
          update: (patch: any) => ({
            eq: async (_col: string, id: string) => {
              const existing = batchStore.get(id);
              if (existing) batchStore.set(id, { ...existing, ...patch });
              return { error: null };
            },
          }),
        };
      }
      throw new Error(`unexpected table ${table}`);
    },
  };
}

const location = { lat: 23.1765, lon: 75.7885, tz: 'Asia/Kolkata' };
const janmashtami = { id: 'def-janmashtami', slug: 'krishna-janmashtami', display_name: 'Krishna Janmashtami', kind: 'major' };
const shivaratri = { id: 'def-shivaratri', slug: 'maha-shivaratri', display_name: 'Maha Shivaratri', kind: 'major' };
const genericEkadashi = { id: 'def-ekadashi', slug: 'ekadashi', display_name: 'Ekadashi', kind: 'vrat' };
const traditionSlugs = ['smarta', 'gaudiya_iskcon', 'unspecified'];

describe('ensureYearMaterialized — festival-mirror name collisions', () => {
  it('keeps exactly one row when one definition produces two same-year variant rows on different dates, preferring Smarta', async () => {
    calculateObservancesForYear.mockReturnValue([
      { slug: 'krishna-janmashtami', date: '2026-09-04', ruleKey: 'krishna-janmashtami::smarta_nishita' },
      { slug: 'krishna-janmashtami', date: '2026-09-05', ruleKey: 'krishna-janmashtami::gaudiya_iskcon' },
      { slug: 'maha-shivaratri', date: '2026-02-15', ruleKey: 'maha-shivaratri::smarta' },
    ]);
    const supabase = makeSupabase({ definitions: [janmashtami, shivaratri], traditionSlugs });

    await ensureYearMaterialized({ supabase, year: 2026, calendarProfile: 'legacy-ujjain', location });

    const janmashtamiRows = supabase.upserted.filter((r) => r.definition_id === 'def-janmashtami');
    expect(janmashtamiRows).toHaveLength(1);
    expect(janmashtamiRows[0].variant_key).toBe('smarta_nishita');
    // The FK-unsafe value ('smarta_nishita') must not be written verbatim.
    expect(janmashtamiRows[0].spiritual_tradition).toBe('smarta');
    // An unrelated slug in the same batch must be unaffected.
    expect(supabase.upserted.some((r) => r.definition_id === 'def-shivaratri')).toBe(true);
  });

  it('does not collapse same-name variants for a calendar_profile the festival mirror never touches', async () => {
    calculateObservancesForYear.mockReturnValue([
      { slug: 'krishna-janmashtami', date: '2026-09-04', ruleKey: 'krishna-janmashtami::smarta_nishita' },
      { slug: 'krishna-janmashtami', date: '2026-09-04', ruleKey: 'krishna-janmashtami::gaudiya_iskcon' },
    ]);
    const supabase = makeSupabase({ definitions: [janmashtami], traditionSlugs });

    await ensureYearMaterialized({
      supabase,
      year: 2026,
      calendarProfile: 'north_indian_purnimanta',
      location,
    });

    expect(supabase.upserted).toHaveLength(2);
  });

  it('never collapses a recurring vrat definition\'s many real dates in a year', async () => {
    const ekadashiDates = ['2026-01-10', '2026-01-25', '2026-02-08', '2026-02-24'];
    calculateObservancesForYear.mockReturnValue(
      ekadashiDates.map((date) => ({ slug: 'ekadashi', date, ruleKey: 'ekadashi::legacy-default' })),
    );
    const supabase = makeSupabase({ definitions: [genericEkadashi], traditionSlugs });

    await ensureYearMaterialized({ supabase, year: 2026, calendarProfile: 'legacy-ujjain', location });

    expect(supabase.upserted).toHaveLength(ekadashiDates.length);
    expect(new Set(supabase.upserted.map((r) => r.date)).size).toBe(ekadashiDates.length);
  });

  it('sets final_date_source so the DB trigger\'s own vrat exemption actually applies', async () => {
    // The column defaults to 'legacy_seed' (confirmed via schema read,
    // 2026-09-04) when not set explicitly -- NOT one of the two values
    // sync_occurrence_to_festival() checks for its kind:'vrat' exemption.
    // Without this, a lazily-materialized vrat's second date in a year would
    // still hit the festivals(name,year) collision this file exists to
    // prevent, regardless of the app-level kind:'vrat' skip above.
    calculateObservancesForYear.mockReturnValue([
      { slug: 'ekadashi', date: '2026-01-10', ruleKey: 'ekadashi::legacy-default' },
      { slug: 'krishna-janmashtami', date: '2026-09-04', ruleKey: 'krishna-janmashtami::smarta_nishita' },
    ]);
    const supabase = makeSupabase({ definitions: [genericEkadashi, janmashtami], traditionSlugs });

    await ensureYearMaterialized({ supabase, year: 2026, calendarProfile: 'legacy-ujjain', location });

    expect(supabase.upserted.length).toBeGreaterThan(0);
    for (const row of supabase.upserted) {
      expect(row.final_date_source).toBe('calculation_engine');
    }
  });

  it('resolves a rules.json qualifier that is not itself a tradition_profiles slug via the evaluator crosswalk', async () => {
    calculateObservancesForYear.mockReturnValue([
      { slug: 'krishna-janmashtami', date: '2026-09-04', ruleKey: 'krishna-janmashtami::smarta_nishita' },
    ]);
    const supabase = makeSupabase({ definitions: [janmashtami], traditionSlugs });

    await ensureYearMaterialized({ supabase, year: 2026, calendarProfile: 'legacy-ujjain', location });

    expect(supabase.upserted).toHaveLength(1);
    expect(supabase.upserted[0].spiritual_tradition).toBe('smarta');
  });

  it('writes null rather than an unresolvable spiritual_tradition value', async () => {
    calculateObservancesForYear.mockReturnValue([
      { slug: 'maha-shivaratri', date: '2026-02-15', ruleKey: 'maha-shivaratri::some_unknown_variant' },
    ]);
    const supabase = makeSupabase({ definitions: [shivaratri], traditionSlugs });

    await ensureYearMaterialized({ supabase, year: 2026, calendarProfile: 'legacy-ujjain', location });

    expect(supabase.upserted).toHaveLength(1);
    expect(supabase.upserted[0].spiritual_tradition).toBeNull();
  });
});

describe('ensureYearMaterialized — manifest + batch ledger (round-trip)', () => {
  it('opens a batch and records a matching manifest on a successful run', async () => {
    calculateObservancesForYear.mockReturnValue([
      { slug: 'maha-shivaratri', date: '2026-02-15', ruleKey: 'maha-shivaratri::smarta' },
    ]);
    const supabase = makeSupabase({ definitions: [shivaratri], traditionSlugs });

    await ensureYearMaterialized({ supabase, year: 2026, calendarProfile: 'legacy-ujjain', location });

    const manifest = [...supabase.manifestStore.values()][0];
    expect(manifest.status).toBe('complete');
    expect(manifest.expected_identity_count).toBe(1);
    expect(manifest.engine_version).toBe(CURRENT_PROVENANCE.engineVersion);
    expect(manifest.day_boundary_version).toBe(CURRENT_PROVENANCE.dayBoundaryVersion);

    const batch = [...supabase.batchStore.values()][0];
    expect(batch.status).toBe('complete');
    expect(batch.produced_row_count).toBe(1);
    expect(batch.expected_row_count).toBe(1);
    expect(batch.day_boundary_version).toBe(CURRENT_PROVENANCE.dayBoundaryVersion);
  });

  it('closes the batch and marks the manifest failed when the occurrence write throws', async () => {
    calculateObservancesForYear.mockReturnValue([
      { slug: 'maha-shivaratri', date: '2026-02-15', ruleKey: 'maha-shivaratri::smarta' },
    ]);
    const supabase = makeSupabase({ definitions: [shivaratri], traditionSlugs });
    const originalFrom = supabase.from.bind(supabase);
    (supabase as any).from = (table: string): any => {
      if (table === 'observance_occurrences') {
        return { upsert: async () => ({ error: { message: 'forced failure' } }) };
      }
      return originalFrom(table);
    };

    await expect(
      ensureYearMaterialized({ supabase, year: 2026, calendarProfile: 'legacy-ujjain', location }),
    ).rejects.toBeTruthy();

    const manifest = [...supabase.manifestStore.values()][0];
    expect(manifest.status).toBe('failed');
    const batch = [...supabase.batchStore.values()][0];
    expect(batch.status).toBe('failed');
  });

  it('does not recompute when isYearMaterialized already reports complete', async () => {
    // Shared mock across the whole file -- clear the call count accumulated
    // by earlier tests so this assertion reflects only THIS test's call.
    calculateObservancesForYear.mockClear();
    const expectedIdentity = {
      definitionId: 'def-shivaratri',
      slug: 'maha-shivaratri',
      year: 2026,
      calendarProfile: 'legacy-ujjain',
      spiritualTradition: 'smarta',
      variantKey: 'smarta',
      lat: location.lat,
      lon: location.lon,
      tz: location.tz,
    };
    const { canonicalMaterializationIdentitySetHash } = await import('../materialisation-batch');
    const supabase = makeSupabase({
      definitions: [shivaratri],
      traditionSlugs,
      manifests: [{
        year: 2026, calendar_profile: 'legacy-ujjain',
        computed_latitude: location.lat, computed_longitude: location.lon, computed_timezone: location.tz,
        expected_identity_count: 1,
        expected_identity_hash: canonicalMaterializationIdentitySetHash([expectedIdentity]),
        ...CURRENT_PROVENANCE_COLUMNS(),
        status: 'complete',
      }],
      batches: [{
        definition_id: 'def-shivaratri', year: 2026, calendar_profile: 'legacy-ujjain',
        spiritual_tradition: 'smarta', variant_key: 'smarta',
        computed_latitude: location.lat, computed_longitude: location.lon, computed_timezone: location.tz,
        status: 'complete', expected_row_count: 1, produced_row_count: 1,
      }],
    });

    await ensureYearMaterialized({ supabase, year: 2026, calendarProfile: 'legacy-ujjain', location });

    expect(calculateObservancesForYear).not.toHaveBeenCalled();
    expect(supabase.upserted).toHaveLength(0);
  });
});

function CURRENT_PROVENANCE_COLUMNS() {
  return {
    engine_version: CURRENT_PROVENANCE.engineVersion,
    rule_version: CURRENT_PROVENANCE.ruleVersion,
    astronomy_version: CURRENT_PROVENANCE.astronomyVersion,
    day_boundary_version: CURRENT_PROVENANCE.dayBoundaryVersion,
  };
}

describe('isYearMaterialized — completeness against the manifest, not batch existence alone', () => {
  const baseManifest = {
    year: 2026, calendar_profile: 'legacy-ujjain',
    computed_latitude: location.lat, computed_longitude: location.lon, computed_timezone: location.tz,
    status: 'complete',
    ...CURRENT_PROVENANCE_COLUMNS(),
  };

  it('reports false when no manifest exists at all', async () => {
    const supabase = makeSupabase({ definitions: [], traditionSlugs });
    expect(await isYearMaterialized({ supabase, year: 2026, calendarProfile: 'legacy-ujjain', location })).toBe(false);
  });

  it('reports false — a batch is missing entirely despite the manifest expecting it (the case a batch-only design could not detect)', async () => {
    const { canonicalMaterializationIdentitySetHash } = await import('../materialisation-batch');
    const identityA = { definitionId: 'def-a', slug: 'a', year: 2026, calendarProfile: 'legacy-ujjain', spiritualTradition: null, variantKey: null, lat: location.lat, lon: location.lon, tz: location.tz };
    const identityB = { definitionId: 'def-b', slug: 'b', year: 2026, calendarProfile: 'legacy-ujjain', spiritualTradition: null, variantKey: null, lat: location.lat, lon: location.lon, tz: location.tz };
    const supabase = makeSupabase({
      definitions: [], traditionSlugs,
      manifests: [{ ...baseManifest, expected_identity_count: 2, expected_identity_hash: canonicalMaterializationIdentitySetHash([identityA, identityB]) }],
      // Only ONE of the two expected identities has a batch row -- the other was never opened.
      batches: [{ definition_id: 'def-a', year: 2026, calendar_profile: 'legacy-ujjain', spiritual_tradition: null, variant_key: null, computed_latitude: location.lat, computed_longitude: location.lon, computed_timezone: location.tz, status: 'complete' }],
    });
    expect(await isYearMaterialized({ supabase, year: 2026, calendarProfile: 'legacy-ujjain', location })).toBe(false);
  });

  it('reports false when the manifest was recorded under a stale provenance version (tested for each of the four fields)', async () => {
    for (const field of ['engine_version', 'rule_version', 'astronomy_version', 'day_boundary_version'] as const) {
      const supabase = makeSupabase({
        definitions: [], traditionSlugs,
        manifests: [{ ...baseManifest, expected_identity_count: 0, expected_identity_hash: 'irrelevant-for-this-check', [field]: 'stale-version' }],
        batches: [],
      });
      expect(await isYearMaterialized({ supabase, year: 2026, calendarProfile: 'legacy-ujjain', location })).toBe(false);
    }
  });

  it('reports false when the count matches but the identity hash does not (a rule change swapped one identity for another, count unchanged)', async () => {
    const { canonicalMaterializationIdentitySetHash } = await import('../materialisation-batch');
    const identityA = { definitionId: 'def-a', slug: 'a', year: 2026, calendarProfile: 'legacy-ujjain', spiritualTradition: null, variantKey: null, lat: location.lat, lon: location.lon, tz: location.tz };
    const identityC = { definitionId: 'def-c', slug: 'c', year: 2026, calendarProfile: 'legacy-ujjain', spiritualTradition: null, variantKey: null, lat: location.lat, lon: location.lon, tz: location.tz };
    const supabase = makeSupabase({
      definitions: [], traditionSlugs,
      // Manifest recorded expecting identity A, but the live complete batch is for a DIFFERENT identity, C -- same count (1).
      manifests: [{ ...baseManifest, expected_identity_count: 1, expected_identity_hash: canonicalMaterializationIdentitySetHash([identityA]) }],
      batches: [{ definition_id: identityC.definitionId, year: 2026, calendar_profile: 'legacy-ujjain', spiritual_tradition: null, variant_key: null, computed_latitude: location.lat, computed_longitude: location.lon, computed_timezone: location.tz, status: 'complete' }],
    });
    expect(await isYearMaterialized({ supabase, year: 2026, calendarProfile: 'legacy-ujjain', location })).toBe(false);
  });

  it('reports true when the manifest is complete, provenance matches, and the live complete-batch set matches both count and hash', async () => {
    const { canonicalMaterializationIdentitySetHash } = await import('../materialisation-batch');
    const identityA = { definitionId: 'def-a', slug: 'a', year: 2026, calendarProfile: 'legacy-ujjain', spiritualTradition: null, variantKey: null, lat: location.lat, lon: location.lon, tz: location.tz };
    const supabase = makeSupabase({
      definitions: [], traditionSlugs,
      manifests: [{ ...baseManifest, expected_identity_count: 1, expected_identity_hash: canonicalMaterializationIdentitySetHash([identityA]) }],
      batches: [{ definition_id: identityA.definitionId, year: 2026, calendar_profile: 'legacy-ujjain', spiritual_tradition: null, variant_key: null, computed_latitude: location.lat, computed_longitude: location.lon, computed_timezone: location.tz, status: 'complete' }],
    });
    expect(await isYearMaterialized({ supabase, year: 2026, calendarProfile: 'legacy-ujjain', location })).toBe(true);
  });
});
