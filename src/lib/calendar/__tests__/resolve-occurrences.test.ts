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
  definitions: Array<{ id: string; slug: string; display_name: string; kind: string }>;
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
