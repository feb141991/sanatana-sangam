import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { findDeletingUserIds } from './deleting-recipients';

function fakeClient(respond: (ids: string[]) => { data: Array<{ id: string }> | null; error: { message: string } | null }) {
  const calls: Array<{ table: string; ids: string[]; eq: [string, unknown] | null }> = [];
  const client = {
    from: vi.fn((table: string) => {
      const call = { table, ids: [] as string[], eq: null as [string, unknown] | null };
      calls.push(call);
      const builder = {
        select: () => builder,
        in: (_column: string, ids: string[]) => { call.ids = ids; return builder; },
        eq: (column: string, value: unknown) => { call.eq = [column, value]; return builder; },
        then: (resolve: (value: unknown) => unknown) => Promise.resolve(respond(call.ids)).then(resolve),
      };
      return builder;
    }),
  };
  return { client: client as unknown as SupabaseClient, calls };
}

describe('findDeletingUserIds', () => {
  it('returns only the users the database reports as deleting, asking for is_deleting = true', async () => {
    const { client, calls } = fakeClient(() => ({ data: [{ id: 'u2' }], error: null }));
    const result = await findDeletingUserIds(client, ['u1', 'u2', 'u3']);
    expect(result.error).toBeNull();
    expect([...result.deletingUserIds]).toEqual(['u2']);
    expect(calls[0]).toMatchObject({ table: 'profiles', ids: ['u1', 'u2', 'u3'], eq: ['is_deleting', true] });
  });

  it('makes no query for an empty or blank list', async () => {
    const { client, calls } = fakeClient(() => ({ data: [], error: null }));
    expect((await findDeletingUserIds(client, [])).deletingUserIds.size).toBe(0);
    expect((await findDeletingUserIds(client, ['', ''])).deletingUserIds.size).toBe(0);
    expect(calls).toHaveLength(0);
  });

  it('de-duplicates ids and batches large lists instead of one oversized request', async () => {
    const ids = Array.from({ length: 1201 }, (_, i) => `user-${i}`);
    const { client, calls } = fakeClient((batch) => ({ data: batch.includes('user-700') ? [{ id: 'user-700' }] : [], error: null }));
    const result = await findDeletingUserIds(client, [...ids, ...ids]);
    expect(calls.map((c) => c.ids.length)).toEqual([500, 500, 201]);
    expect([...result.deletingUserIds]).toEqual(['user-700']);
  });

  it('reports a lookup failure as an error with no ids, so callers cannot mistake it for "nobody is deleting"', async () => {
    const { client } = fakeClient((batch) => (batch.includes('user-600')
      ? { data: null, error: { message: 'boom' } }
      : { data: [{ id: 'user-1' }], error: null }));
    const ids = Array.from({ length: 700 }, (_, i) => `user-${i}`);
    const result = await findDeletingUserIds(client, ids);
    expect(result.error).toEqual({ message: 'boom' });
    expect(result.deletingUserIds.size).toBe(0);
  });
});
