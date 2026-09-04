/**
 * ensureYearMaterialized hardening: a real production incident (2026-09-04,
 * backfilling legacy-ujjain after the corrected_2026_festival_migration
 * cleanup) hit two failures this file's changes are meant to prevent from
 * ever reaching production silently again:
 *
 * 1. Krishna Janmashtami's two variant definitions (Smarta, Gaudiya/ISKCON)
 *    share one observance_definitions.display_name. trg_sync_occurrence_to_
 *    festival mirrors every legacy-ujjain row into a legacy `festivals`
 *    table unique on (name, year) with no variant concept -- writing both
 *    variants in the same batch violates that constraint and rolls back the
 *    ENTIRE multi-row upsert, including every unrelated slug.
 * 2. rules.json's own variant vocabulary ('smarta_nishita') doesn't always
 *    match a tradition_profiles.slug FK target ('smarta') -- writing it
 *    verbatim fails the same way.
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('../engine', () => ({
  calculateObservancesForYear: vi.fn(),
}));

const { calculateObservancesForYear } = await import('../engine') as unknown as {
  calculateObservancesForYear: ReturnType<typeof vi.fn>;
};
const { ensureYearMaterialized } = await import('../resolve-occurrences');

function makeSupabase({
  definitions,
  traditionSlugs,
}: {
  definitions: Array<{ id: string; slug: string; display_name: string }>;
  traditionSlugs: string[];
}) {
  const upserted: any[] = [];
  return {
    upserted,
    from(table: string) {
      if (table === 'observance_occurrences') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                eq: () => ({
                  eq: () => ({
                    eq: () => ({ limit: async () => ({ data: [], error: null }) }),
                  }),
                }),
              }),
            }),
          }),
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
      throw new Error(`unexpected table ${table}`);
    },
  };
}

const location = { lat: 23.1765, lon: 75.7885, tz: 'Asia/Kolkata' };
const definitions = [
  { id: 'def-smarta', slug: 'krishna-janmashtami', display_name: 'Krishna Janmashtami' },
  { id: 'def-gaudiya', slug: 'krishna-janmashtami-gaudiya', display_name: 'Krishna Janmashtami' },
  { id: 'def-shivaratri', slug: 'maha-shivaratri', display_name: 'Maha Shivaratri' },
];
const traditionSlugs = ['smarta', 'gaudiya_iskcon', 'unspecified'];

describe('ensureYearMaterialized — festival-mirror name collisions', () => {
  it('keeps exactly one row when two variant definitions share a display_name, preferring Smarta', async () => {
    calculateObservancesForYear.mockReturnValue([
      { slug: 'krishna-janmashtami', date: '2026-09-04', ruleKey: 'krishna-janmashtami::smarta_nishita' },
      { slug: 'krishna-janmashtami-gaudiya', date: '2026-09-04', ruleKey: 'krishna-janmashtami-gaudiya::gaudiya_iskcon' },
      { slug: 'maha-shivaratri', date: '2026-02-15', ruleKey: 'maha-shivaratri::smarta' },
    ]);
    const supabase = makeSupabase({ definitions, traditionSlugs });

    await ensureYearMaterialized({ supabase, year: 2026, calendarProfile: 'legacy-ujjain', location });

    const janmashtamiRows = supabase.upserted.filter((r) => r.date === '2026-09-04');
    expect(janmashtamiRows).toHaveLength(1);
    expect(janmashtamiRows[0].definition_id).toBe('def-smarta');
    expect(janmashtamiRows[0].variant_key).toBe('smarta_nishita');
    // The FK-unsafe value ('smarta_nishita') must not be written verbatim.
    expect(janmashtamiRows[0].spiritual_tradition).toBe('smarta');
    // An unrelated slug in the same batch must be unaffected.
    expect(supabase.upserted.some((r) => r.definition_id === 'def-shivaratri')).toBe(true);
  });

  it('does not collapse same-name variants for a calendar_profile the festival mirror never touches', async () => {
    calculateObservancesForYear.mockReturnValue([
      { slug: 'krishna-janmashtami', date: '2026-09-04', ruleKey: 'krishna-janmashtami::smarta_nishita' },
      { slug: 'krishna-janmashtami-gaudiya', date: '2026-09-04', ruleKey: 'krishna-janmashtami-gaudiya::gaudiya_iskcon' },
    ]);
    const supabase = makeSupabase({ definitions, traditionSlugs });

    await ensureYearMaterialized({
      supabase,
      year: 2026,
      calendarProfile: 'north_indian_purnimanta',
      location,
    });

    expect(supabase.upserted).toHaveLength(2);
  });

  it('resolves a rules.json qualifier that is not itself a tradition_profiles slug via the evaluator crosswalk', async () => {
    calculateObservancesForYear.mockReturnValue([
      { slug: 'krishna-janmashtami', date: '2026-09-04', ruleKey: 'krishna-janmashtami::smarta_nishita' },
    ]);
    const supabase = makeSupabase({
      definitions: [definitions[0]],
      traditionSlugs,
    });

    await ensureYearMaterialized({ supabase, year: 2026, calendarProfile: 'legacy-ujjain', location });

    expect(supabase.upserted).toHaveLength(1);
    expect(supabase.upserted[0].spiritual_tradition).toBe('smarta');
  });

  it('writes null rather than an unresolvable spiritual_tradition value', async () => {
    calculateObservancesForYear.mockReturnValue([
      { slug: 'maha-shivaratri', date: '2026-02-15', ruleKey: 'maha-shivaratri::some_unknown_variant' },
    ]);
    const supabase = makeSupabase({ definitions: [definitions[2]], traditionSlugs });

    await ensureYearMaterialized({ supabase, year: 2026, calendarProfile: 'legacy-ujjain', location });

    expect(supabase.upserted).toHaveLength(1);
    expect(supabase.upserted[0].spiritual_tradition).toBeNull();
  });
});
