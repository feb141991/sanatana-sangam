import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const nextCache = vi.hoisted(() => ({
  revalidateTag: vi.fn(),
  unstable_cache: vi.fn((fn: unknown) => fn),
}));
vi.mock('next/cache', () => nextCache);

import {
  PUBLIC_CALENDAR_MAX_AGE_MS,
  PUBLIC_CALENDAR_REFRESH_SECONDS,
  PUBLIC_CALENDAR_SCHEMA_VERSION,
  PUBLIC_CALENDAR_TAG,
  buildPublicCalendarSnapshot,
  getPublicCalendarSnapshot,
  invalidatePublicCalendarSnapshot,
  isPublicCalendarSnapshotUsable,
} from '@/lib/calendar/public-calendar-snapshot';
import { GET } from '@/app/api/public/calendar/upcoming/route';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
const generatedAt = '2026-11-05T02:00:00.000Z';
const final = {
  slug: 'guru-nanak-gurpurab',
  display_name: 'Guru Nanak Gurpurab',
  description: 'Sourced description',
  tradition: 'sikh',
  civilDate: '2026-11-24',
  status: 'resolved',
  reviewStatus: 'reviewed',
};

describe('buildPublicCalendarSnapshot', () => {
  it('keeps exactly the occurrences that may be presented as final', () => {
    const snapshot = buildPublicCalendarSnapshot(
      {
        from: '2026-11-05',
        to: '2027-01-04',
        displayObservances: [
          final,
          { ...final, slug: 'disputed', status: 'disputed' },
          { ...final, slug: 'fallback', status: 'fallback' },
          { ...final, slug: 'withheld', status: 'withheld' },
          { ...final, slug: 'unreviewed', reviewStatus: 'pending' },
          { ...final, slug: 'no-date', civilDate: null },
          { ...final, slug: 'bad-date', civilDate: '24-11-2026' },
          { ...final, slug: 'no-name', display_name: null },
          null,
        ],
      },
      generatedAt,
    );
    expect(snapshot.displayObservances.map((item) => item.slug)).toEqual(['guru-nanak-gurpurab']);
    expect(snapshot.generatedAt).toBe(generatedAt);
    expect(snapshot.from).toBe('2026-11-05');
  });

  it('passes only the fields the preview shows', () => {
    const [item] = buildPublicCalendarSnapshot(
      { displayObservances: [{ ...final, evaluator_details: { secret: 1 }, location: { lat: 1 } }] },
      generatedAt,
    ).displayObservances;
    expect(Object.keys(item).sort()).toEqual(
      ['civilDate', 'description', 'display_name', 'reviewStatus', 'slug', 'status', 'tradition'].sort(),
    );
  });

  it('keeps an empty list when nothing is final, and refuses a malformed response', () => {
    expect(buildPublicCalendarSnapshot({ displayObservances: [] }, generatedAt).displayObservances).toEqual([]);
    for (const bad of [null, undefined, {}, { error: 'Calendar unavailable' }, { displayObservances: 'x' }]) {
      expect(() => buildPublicCalendarSnapshot(bad, generatedAt)).toThrow();
    }
  });
});

describe('isPublicCalendarSnapshotUsable', () => {
  const snapshot = buildPublicCalendarSnapshot({ displayObservances: [final] }, generatedAt);
  const generatedMs = Date.parse(generatedAt);

  it('serves a copy up to the age bound and refuses it afterwards', () => {
    expect(isPublicCalendarSnapshotUsable(snapshot, generatedMs + PUBLIC_CALENDAR_MAX_AGE_MS)).toBe(true);
    expect(isPublicCalendarSnapshotUsable(snapshot, generatedMs + PUBLIC_CALENDAR_MAX_AGE_MS + 1)).toBe(false);
  });

  it('refuses another schema or an unreadable time', () => {
    expect(
      isPublicCalendarSnapshotUsable({ ...snapshot, schemaVersion: PUBLIC_CALENDAR_SCHEMA_VERSION + 1 }, generatedMs),
    ).toBe(false);
    expect(isPublicCalendarSnapshotUsable({ ...snapshot, generatedAt: 'yesterday' }, generatedMs)).toBe(false);
  });
});

describe('snapshot refresh', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    nextCache.revalidateTag.mockReset();
  });

  it('is cached for a day under the invalidation tag', () => {
    expect(PUBLIC_CALENDAR_REFRESH_SECONDS).toBe(86_400);
    const text = source('src/lib/calendar/public-calendar-snapshot.ts');
    expect(text).toMatch(/unstable_cache\(\s*loadPublicCalendarSnapshot/);
    expect(text).toContain('revalidate: PUBLIC_CALENDAR_REFRESH_SECONDS, tags: [PUBLIC_CALENDAR_TAG]');
  });

  it('throws on a failed refresh, so the last good copy is never replaced', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{"error":"Calendar unavailable"}', { status: 500 }));
    await expect(getPublicCalendarSnapshot()).rejects.toThrow('status 500');
  });

  it('reads the guest calendar without credentials, skipping the upstream CDN copy', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ displayObservances: [final] }), { status: 200 }));
    const snapshot = await getPublicCalendarSnapshot();
    expect(snapshot.displayObservances).toHaveLength(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/api/calendar/upcoming?days=60&reviewed=1&tradition=all&calendar_profile=legacy-ujjain');
    expect(url).toMatch(/snapshot=\d+/);
    expect(init.cache).toBe('no-store');
    expect(JSON.stringify(init.headers)).not.toMatch(/cookie|authorization/i);
  });

  it('invalidation uses the tag and never fails the write that called it', () => {
    invalidatePublicCalendarSnapshot();
    expect(nextCache.revalidateTag).toHaveBeenCalledWith(PUBLIC_CALENDAR_TAG);
    nextCache.revalidateTag.mockImplementationOnce(() => {
      throw new Error('outside a request');
    });
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(() => invalidatePublicCalendarSnapshot()).not.toThrow();
  });
});

describe('GET /api/public/calendar/upcoming', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('answers a fresh snapshot with a short shared cache and a long stale window', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ displayObservances: [final] }), { status: 200 }),
    );
    const response = await GET();
    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('public, s-maxage=300, stale-while-revalidate=86400');
    expect((await response.json()).displayObservances).toHaveLength(1);
  });

  it('answers 503 uncached, with no transport detail, when there is no usable snapshot', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('supabase.co 522 connection timed out'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const response = await GET();
    expect(response.status).toBe(503);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(await response.json()).toEqual({ error: 'Calendar unavailable' });
  });

  it('takes no cookies or auth, so one visitor can never shape what another receives', () => {
    const text = source('src/app/api/public/calendar/upcoming/route.ts');
    expect(text).not.toMatch(/cookies\(|headers\(\)|getApiUser|resolveRequestProfile|NextRequest/);
  });
});

describe('homepage uses the snapshot', () => {
  const landing = source('public/landing.html');

  it('reads the public snapshot, never the live per-request route', () => {
    expect(landing).toContain('"/api/public/calendar/upcoming"');
    expect(landing).not.toContain('/api/calendar/upcoming?');
  });

  it('gives up after a bounded time instead of waiting on a slow backend', () => {
    expect(landing).toMatch(/controller\.abort\(\);\s*\}, 8000\)/);
    expect(landing).toContain('signal: controller.signal');
  });

  it('drops dates that have passed and marks an older copy', () => {
    expect(landing).toContain('item.civilDate >= today');
    expect(landing).toContain('" · as of "');
    expect(landing.match(/shoonayaCalendarAsOf \|\| ""/g)).toHaveLength(2);
  });
});

describe('every write that can change a published occurrence invalidates the snapshot', () => {
  it.each([
    'src/app/api/admin/calendar-dates/route.ts',
    'src/app/api/admin/festivals/route.ts',
    'src/app/api/admin/verify-festivals/route.ts',
    'src/app/api/admin/materialize-occurrences/route.ts',
    'src/app/api/admin/flush-cache/route.ts',
    'src/app/api/cron/materialize-occurrences/route.ts',
    'src/app/api/cron/verify-festival-dates/route.ts',
  ])('%s', (path) => {
    expect(source(path)).toMatch(/\n\s+(if \(commit\) )?invalidatePublicCalendarSnapshot\(\);/);
  });
});
