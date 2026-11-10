import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { DISCREET_EXEMPT_TYPES, DISCREET_PUSH_COPY, findDiscreetUserIds, shouldShowDiscreetCopy } from './discreet-recipients';

function client(respond: (ids: string[]) => { data: Array<{ id: string }> | null; error: { code?: string; message: string } | null }) {
  const calls: Array<{ ids: string[]; column: string; value: unknown }> = [];
  const supabase = {
    from: (table: string) => {
      expect(table).toBe('profiles');
      let ids: string[] = [];
      const builder = {
        select: () => builder,
        in: (_c: string, batch: string[]) => { ids = batch; return builder; },
        eq: (column: string, value: unknown) => { calls.push({ ids, column, value }); return Promise.resolve(respond(ids)); },
      };
      return builder;
    },
  } as unknown as SupabaseClient;
  return { supabase, calls };
}

describe('the neutral line', () => {
  it('names the app and nothing else: no practice, content, name or time', () => {
    expect(DISCREET_PUSH_COPY).toEqual({ title: 'Shoonaya', body: 'You have a new notification.' });
    expect(`${DISCREET_PUSH_COPY.title} ${DISCREET_PUSH_COPY.body}`).not.toMatch(/japa|quiz|festival|vrat|mood|family|shloka|reminder|mandali|[0-9]/i);
  });
});

describe('findDiscreetUserIds', () => {
  it('asks the database only for accounts that switched it on, and returns those', async () => {
    const { supabase, calls } = client(() => ({ data: [{ id: 'u2' }], error: null }));
    const result = await findDiscreetUserIds(supabase, ['u1', 'u2', 'u1', '']);
    expect([...result.discreetUserIds]).toEqual(['u2']);
    expect(result.lookupFailed).toBe(false);
    expect(calls).toEqual([{ ids: ['u1', 'u2'], column: 'notification_discreet_mode', value: true }]);
  });

  it('treats a missing column as "nobody has asked", not as a failure', async () => {
    const { supabase } = client(() => ({ data: null, error: { code: '42703', message: 'column does not exist' } }));
    const result = await findDiscreetUserIds(supabase, ['u1']);
    expect(result).toEqual({ discreetUserIds: new Set(), lookupFailed: false, error: null });
  });

  it('reports any other failure as a failure, with no accounts', async () => {
    for (const code of ['57014', '08006', undefined]) {
      const { supabase } = client(() => ({ data: null, error: { code, message: 'boom' } }));
      const result = await findDiscreetUserIds(supabase, ['u1']);
      expect(result.lookupFailed).toBe(true);
      expect(result.discreetUserIds.size).toBe(0);
      expect(result.error?.message).toBe('boom');
    }
  });

  it('looks up in batches of 500 and merges them', async () => {
    const ids = Array.from({ length: 1201 }, (_, i) => `u${i}`);
    const { supabase, calls } = client((batch) => ({ data: batch.filter((id) => id.endsWith('7')).map((id) => ({ id })), error: null }));
    const result = await findDiscreetUserIds(supabase, ids);
    expect(calls.map((c) => c.ids.length)).toEqual([500, 500, 201]);
    expect(result.discreetUserIds.size).toBe(ids.filter((id) => id.endsWith('7')).length);
  });

  it('does not query at all for an empty list', async () => {
    const respond = vi.fn(() => ({ data: [], error: null }));
    const { supabase } = client(respond);
    expect((await findDiscreetUserIds(supabase, [])).discreetUserIds.size).toBe(0);
    expect(respond).not.toHaveBeenCalled();
  });

  it('stops at the first failing batch and reports failure rather than a partial answer', async () => {
    let n = 0;
    const { supabase } = client(() => (++n === 2 ? { data: null, error: { code: '57014', message: 'timeout' } } : { data: [{ id: 'u1' }], error: null }));
    const result = await findDiscreetUserIds(supabase, Array.from({ length: 1001 }, (_, i) => `u${i}`));
    expect(result.lookupFailed).toBe(true);
    expect(result.discreetUserIds.size).toBe(0);
  });
});

describe('shouldShowDiscreetCopy', () => {
  const asked = { discreetUserIds: new Set(['u1']), lookupFailed: false };

  it('is true only for an account that asked, for an ordinary type', () => {
    expect(shouldShowDiscreetCopy('festival', 'u1', asked)).toBe(true);
    expect(shouldShowDiscreetCopy('festival', 'u2', asked)).toBe(false);
  });

  it('is true for everyone when the lookup failed: privacy fails closed', () => {
    const failed = { discreetUserIds: new Set<string>(), lookupFailed: true };
    expect(shouldShowDiscreetCopy('festival', 'u2', failed)).toBe(true);
  });

  it('never replaces a security notice, even for an account that asked or when the lookup failed', () => {
    expect(DISCREET_EXEMPT_TYPES).toEqual(['security']);
    expect(shouldShowDiscreetCopy('security', 'u1', asked)).toBe(false);
    expect(shouldShowDiscreetCopy('Security', 'u1', asked)).toBe(false);
    expect(shouldShowDiscreetCopy('security', 'u2', { discreetUserIds: new Set(), lookupFailed: true })).toBe(false);
  });

  it('covers the families of message that reveal the most', () => {
    for (const type of ['family_remembrance', 'sanskar_milestone', 'mandali_comment', 'mood', 'brahma_muhurta', 'japa', 'daily_digest', 'general']) {
      expect(shouldShowDiscreetCopy(type, 'u1', asked), type).toBe(true);
    }
  });
});
