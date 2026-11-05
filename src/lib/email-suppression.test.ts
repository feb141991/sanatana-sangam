import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { hashEmailAddress } from '@/lib/email-outbox';
import { checkEmailSuppression } from './email-suppression';

function client(result: { data: unknown; error: unknown } | (() => never), seen: { column?: string; value?: string } = {}) {
  return {
    from: (table: string) => {
      expect(table).toBe('email_suppressions');
      return {
        select: () => ({
          eq: (column: string, value: string) => {
            seen.column = column;
            seen.value = value;
            return { maybeSingle: async () => (typeof result === 'function' ? result() : result) };
          },
        }),
      };
    },
  };
}

describe('checkEmailSuppression', () => {
  beforeEach(() => { vi.stubEnv('EMAIL_SUPPRESSION_HMAC_KEY', 'test-suppression-key'); });
  afterEach(() => { vi.unstubAllEnvs(); });

  it('looks up the keyed hash of the normalised address, never the address itself', async () => {
    const seen: { column?: string; value?: string } = {};
    await checkEmailSuppression(client({ data: null, error: null }, seen), '  Devotee@Example.COM ');
    expect(seen.column).toBe('email_hash');
    expect(seen.value).toBe(hashEmailAddress('devotee@example.com', 'test-suppression-key'));
    expect(seen.value).not.toContain('example.com');
  });

  it('is clear when the address is not on the list', async () => {
    expect(await checkEmailSuppression(client({ data: null, error: null }), 'a@b.com')).toBe('clear');
  });

  it('is suppressed when the address is on the list', async () => {
    expect(await checkEmailSuppression(client({ data: { email_hash: 'x' }, error: null }), 'a@b.com')).toBe('suppressed');
  });

  it('fails closed, and says "could not check" rather than "suppressed", when the lookup errors or throws', async () => {
    expect(await checkEmailSuppression(client({ data: null, error: { code: '57014' } }), 'a@b.com')).toBe('unavailable');
    expect(await checkEmailSuppression(client(() => { throw new Error('socket hang up'); }), 'a@b.com')).toBe('unavailable');
  });

  it('fails closed when the hash key is not configured', async () => {
    vi.stubEnv('EMAIL_SUPPRESSION_HMAC_KEY', '');
    expect(await checkEmailSuppression(client({ data: null, error: null }), 'a@b.com')).toBe('unavailable');
  });

  it.each([null, undefined, ''])('cannot clear a missing address (%j)', async (email) => {
    expect(await checkEmailSuppression(client({ data: null, error: null }), email)).toBe('unavailable');
  });
});
