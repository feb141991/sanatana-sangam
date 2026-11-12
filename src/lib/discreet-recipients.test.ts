import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { DISCREET_PUSH_COPY, findFullTextPushRecipients, shouldShowDiscreetCopy } from './discreet-recipients';

type Row = { id: string; notification_discreet_mode?: unknown };
type Result = { data: Row[] | null; error: { code: string } | null };

function client(respond: (ids: string[]) => Result) {
  const lookup = vi.fn((_column: string, ids: string[]) => Promise.resolve(respond(ids)));
  const select = vi.fn(() => ({ in: lookup }));
  const supabase = { from: vi.fn(() => ({ select })) } as unknown as SupabaseClient;
  return { supabase, lookup, select };
}

describe('lock-screen recipient selection', () => {
  it('sends generic text unless the recipient is explicitly opted out', async () => {
    const { supabase, lookup, select } = client(() => ({ error: null, data: [
      { id: 'off', notification_discreet_mode: false },
      { id: 'on', notification_discreet_mode: true },
      { id: 'invalid', notification_discreet_mode: 'false' },
    ] }));
    const ids = ['off', 'on', 'invalid', 'missing'];
    const result = await findFullTextPushRecipients(supabase, [...ids, 'off', '']);
    expect(select).toHaveBeenCalledWith('id, notification_discreet_mode');
    expect(lookup).toHaveBeenCalledWith('id', ids);
    expect(result.lookupFailed).toBe(false);
    for (const id of ids) expect(shouldShowDiscreetCopy('festival', id, result)).toBe(id !== 'off');
    expect(DISCREET_PUSH_COPY).toEqual({ title: 'Shoonaya', body: 'You have a new notification.' });
  });

  it.each(['42703', '57014', '08006'])('redacts on database error %s', async (code) => {
    const { supabase } = client(() => ({ data: null, error: { code } }));
    const result = await findFullTextPushRecipients(supabase, ['u1']);
    expect(result.lookupFailed).toBe(true);
    expect(shouldShowDiscreetCopy('mandali_comment', 'u1', result)).toBe(true);
    expect(shouldShowDiscreetCopy('security', 'u1', result)).toBe(false);
  });

  it('fails closed if the query throws', async () => {
    const { supabase } = client(() => { throw new Error('network'); });
    expect(await findFullTextPushRecipients(supabase, ['u1'])).toEqual({ visibleUserIds: new Set(), lookupFailed: true });
  });

  it('batches the lookups and discards a partial result after failure', async () => {
    const ids = Array.from({ length: 501 }, (_, i) => `u${i}`);
    const { supabase, lookup } = client((batch) => batch.length > 1
      ? { data: batch.map((id) => ({ id, notification_discreet_mode: false })), error: null }
      : { data: null, error: { code: '57014' } });
    const result = await findFullTextPushRecipients(supabase, ids);
    expect(lookup.mock.calls.map(([, batch]) => batch.length)).toEqual([500, 1]);
    expect(result).toEqual({ visibleUserIds: new Set(), lookupFailed: true });
  });

  it('does not query for an empty list', async () => {
    const { supabase, lookup } = client(() => ({ data: [], error: null }));
    expect(await findFullTextPushRecipients(supabase, [])).toEqual({ visibleUserIds: new Set(), lookupFailed: false });
    expect(lookup).not.toHaveBeenCalled();
  });
});
