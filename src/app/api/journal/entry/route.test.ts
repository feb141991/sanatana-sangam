import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const upserts: Array<Record<string, unknown>> = [];
let upsertError: { code?: string; message: string } | null = null;
vi.mock('@/lib/supabase-server', () => ({
  createServerSupabaseClient: async () => ({
    auth: { getUser: async () => ({ data: { user: { id: 'user-1' } } }) },
    from: () => ({
      select: () => ({ eq: () => ({ single: async () => ({ data: { timezone: 'Asia/Kolkata' } }) }) }),
      upsert: (row: Record<string, unknown>) => {
        upserts.push(row);
        return { select: () => ({ single: async () => (upsertError ? { data: null, error: upsertError } : { data: row, error: null }) }) };
      },
    }),
  }),
}));

import { POST } from './route';

const post = (overrides: Record<string, unknown>) =>
  POST(new NextRequest('http://localhost:3000/api/journal/entry', {
    method: 'POST',
    body: JSON.stringify({ content: 'A quiet morning.', mood: 'peaceful', ...overrides }),
  }));

describe('POST /api/journal/entry: entry_date', () => {
  beforeEach(() => {
    upserts.length = 0;
    upsertError = null;
  });

  it('saves an entry for a real date', async () => {
    const res = await post({ entry_date: '2026-10-09' });
    expect(res.status).toBe(200);
    expect(upserts[0].entry_date).toBe('2026-10-09');
  });

  it.each(['2025-02-31', '2023-02-29', '2025-04-31', '2025-13-45', '09/10/2026', '20261009'])(
    'rejects entry_date %s with a 400 and saves nothing',
    async (entry_date) => {
      const res = await post({ entry_date });
      expect(res.status).toBe(400);
      expect(upserts).toHaveLength(0);
    },
  );

  it('answers a database failure with a generic 500 and never echoes its text', async () => {
    upsertError = { code: 'XX000', message: 'internal detail: relation "journal_entries" column "secret"' };
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = await post({ entry_date: '2026-10-09' });
    expect(res.status).toBe(500);
    expect(JSON.stringify(await res.json())).not.toMatch(/internal detail|journal_entries|secret/);
  });
});
