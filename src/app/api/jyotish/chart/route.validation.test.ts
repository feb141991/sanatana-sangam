import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const getApiUser = vi.fn();
vi.mock('@/lib/api-auth', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/api-auth')>()),
  getApiUser: (...args: unknown[]) => getApiUser(...args),
}));

// A recording stand-in for the service-role client: it keeps every insert so the test can see
// exactly what would have been written to birth_profiles.
const inserted: Array<Record<string, unknown>> = [];
let insertError: { code?: string; message: string } | null = null;
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: () => ({
      update: () => ({ eq: () => ({ eq: async () => ({ error: null }) }) }),
      insert: (row: Record<string, unknown>) => {
        inserted.push(row);
        return { select: () => ({ single: async () => (insertError ? { data: null, error: insertError } : { data: { id: 'bp-1', ...row }, error: null }) }) };
      },
    }),
  }),
}));

import { POST } from './route';

// An impossible birth date used to be rolled over by the astrology engine ("1991-02-30" became
// 2 March) and a chart for a date the person never entered was saved with no error at all.

const valid = {
  date_of_birth: '1991-08-18',
  time_of_birth: '10:30',
  birth_lat: 28.61,
  birth_lng: 77.2,
  birth_timezone: 'Asia/Kolkata',
};
const post = (overrides: Record<string, unknown>) =>
  POST(new NextRequest('http://localhost:3000/api/jyotish/chart', { method: 'POST', body: JSON.stringify({ ...valid, ...overrides }) }));

describe('POST /api/jyotish/chart: birth date and time', () => {
  beforeEach(() => {
    inserted.length = 0;
    insertError = null;
    getApiUser.mockReset();
    getApiUser.mockResolvedValue({ user: { id: 'user-1' }, error: null, supabase: null });
  });

  it('saves a chart for a real birth date and time', async () => {
    const res = await post({});
    expect(res.status).toBe(201);
    expect(inserted).toHaveLength(1);
    expect(inserted[0].date_of_birth).toBe('1991-08-18');
    expect(inserted[0].time_of_birth).toBe('10:30');
  });

  it('stores the normalised date and time, not the raw text sent', async () => {
    const res = await post({ date_of_birth: ' 1991-08-18 ', time_of_birth: '6:05' });
    expect(res.status).toBe(201);
    expect(inserted[0].date_of_birth).toBe('1991-08-18');
    expect(inserted[0].time_of_birth).toBe('06:05');
  });

  it('allows an unknown birth time', async () => {
    const res = await post({ time_of_birth: undefined });
    expect(res.status).toBe(201);
    expect(inserted[0].time_of_birth).toBeNull();
  });

  it.each([
    ['1991-02-30', 'calendar'],
    ['1991-02-31', 'calendar'],
    ['2023-02-29', 'calendar'],
    ['1991-04-31', 'calendar'],
    ['1991-13-01', 'calendar'],
    ['18081991', 'format'],
    ['18/08/1991', 'format'],
    ['1799-12-31', 'too_old'],
    ['2999-01-01', 'future'],
  ])('rejects the birth date %s (%s) with a 400 and saves no chart', async (date_of_birth, reason) => {
    const res = await post({ date_of_birth });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.code).toBe('INVALID_DATE_OF_BIRTH');
    expect(json.reason).toBe(reason);
    expect(inserted).toHaveLength(0);
  });

  it.each([
    ['24:00', 'range'],
    ['25:30', 'range'],
    ['12:60', 'range'],
    ['noon', 'format'],
    ['1030', 'format'],
  ])('rejects the birth time %s (%s) with a 400 and saves no chart', async (time_of_birth, reason) => {
    const res = await post({ time_of_birth });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.code).toBe('INVALID_TIME_OF_BIRTH');
    expect(json.reason).toBe(reason);
    expect(inserted).toHaveLength(0);
  });

  it('still reports a missing birth date as required', async () => {
    const res = await post({ date_of_birth: undefined });
    expect(res.status).toBe(400);
    expect(inserted).toHaveLength(0);
  });

  it('answers a database data-exception with a 400 and never echoes the database text', async () => {
    insertError = { code: '22008', message: 'date/time field value out of range: "x" on birth_profiles.date_of_birth' };
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = await post({});
    expect(res.status).toBe(400);
    expect(JSON.stringify(await res.json())).not.toMatch(/date\/time field|birth_profiles|date_of_birth/);
  });

  it('answers any other database failure with a generic 500 and never echoes its text', async () => {
    insertError = { code: 'XX000', message: 'internal detail: relation "birth_profiles" column "secret"' };
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = await post({});
    expect(res.status).toBe(500);
    expect(JSON.stringify(await res.json())).not.toMatch(/internal detail|birth_profiles|secret/);
  });
});
