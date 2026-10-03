import { describe, expect, it } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';

import { buildDeletionPreview } from './account-deletion-preview';
import { DELETION_REASONS } from './account-deletion-reasons';
import { getUnlockedRelics } from './relics';

type TableResult = { data?: unknown; count?: number | null; error?: { message: string } | null };

function fakeClient(tables: Record<string, TableResult>) {
  return {
    from(table: string) {
      const result = tables[table] ?? { data: null, error: null };
      const builder: Record<string, unknown> = {};
      for (const method of ['select', 'eq', 'order', 'limit']) builder[method] = () => builder;
      builder.maybeSingle = async () => ({ data: result.data ?? null, error: result.error ?? null });
      builder.then = (resolve: (value: unknown) => unknown) =>
        Promise.resolve({ data: result.data ?? null, count: result.count ?? null, error: result.error ?? null }).then(resolve);
      return builder;
    },
  } as unknown as SupabaseClient;
}

const PROFILE = {
  full_name: 'Asha', username: 'asha', tradition: 'sikh', active_symbol_id: 'khanda',
  karma_points: 420, seva_score: 35, shloka_streak: 3,
};

function healthy(overrides: Record<string, TableResult> = {}) {
  return fakeClient({
    profiles: { data: PROFILE },
    daily_sadhana: { data: { streak_count: 21 } },
    journal_entries: { count: 7 },
    sankalpas: { count: 2 },
    ...overrides,
  });
}

describe('buildDeletionPreview', () => {
  it('returns exactly the stored values, with relics computed by getUnlockedRelics', async () => {
    const result = await buildDeletionPreview(healthy(), fakeClient({ kuls: { data: [{ id: 'k1', name: 'Kaur Parivar', extra: 1 }] } }), 'user-1');
    expect(result).toEqual({
      ok: true,
      preview: {
        userName: 'Asha', tradition: 'sikh', activeSymbolId: 'khanda',
        streak: 21, karmaPoints: 420, sevaScore: 35,
        relicsCount: getUnlockedRelics(21, 35, 'sikh').length,
        journalCount: 7, activeSankalpas: 2,
        ownedKuls: [{ id: 'k1', name: 'Kaur Parivar' }],
        reasons: DELETION_REASONS,
      },
    });
  });

  it('falls back to shloka_streak only when there is no sadhana row', async () => {
    const result = await buildDeletionPreview(healthy({ daily_sadhana: { data: null } }), fakeClient({ kuls: { data: [] } }), 'user-1');
    expect(result.ok && result.preview.streak).toBe(3);
  });

  it.each(['profiles', 'daily_sadhana', 'journal_entries', 'sankalpas'])('fails instead of returning zeros when %s errors', async (table) => {
    const result = await buildDeletionPreview(healthy({ [table]: { error: { message: 'boom' } } }), fakeClient({ kuls: { data: [] } }), 'user-1');
    expect(result.ok).toBe(false);
  });

  it('fails when the kuls lookup errors', async () => {
    const result = await buildDeletionPreview(healthy(), fakeClient({ kuls: { error: { message: 'boom' } } }), 'user-1');
    expect(result).toEqual({ ok: false, error: 'Could not load kuls summary' });
  });

  it('fails when the profile row is missing or a count is unavailable', async () => {
    expect((await buildDeletionPreview(healthy({ profiles: { data: null } }), fakeClient({ kuls: { data: [] } }), 'u')).ok).toBe(false);
    expect((await buildDeletionPreview(healthy({ journal_entries: { count: null } }), fakeClient({ kuls: { data: [] } }), 'u')).ok).toBe(false);
  });
});
