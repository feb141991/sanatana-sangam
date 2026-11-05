import { revalidateTag, unstable_cache } from 'next/cache';

/**
 * The homepage's calendar preview, refreshed about once a day so a visit makes
 * no database call and a stalled database cannot hold the page on "Loading".
 *
 * It reads the guest response of /api/calendar/upcoming rather than repeating
 * its queries, so there is still one governed source for dates. Only reviewed,
 * resolved occurrences get through; anything else stays out of the snapshot.
 * Anything that changes a published occurrence must call
 * invalidatePublicCalendarSnapshot(), so a withdrawn date does not wait a day.
 */
export const PUBLIC_CALENDAR_TAG = 'public-calendar-snapshot';
export const PUBLIC_CALENDAR_SCHEMA_VERSION = 1;
export const PUBLIC_CALENDAR_REFRESH_SECONDS = 24 * 60 * 60;
// A refresh can fail for a while and the last good copy keeps serving. Past this
// age the dates are no longer worth presenting, so the preview says it could not load.
export const PUBLIC_CALENDAR_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const UPSTREAM_TIMEOUT_MS = 25_000;

export const PUBLIC_CALENDAR_UPSTREAM_QUERY =
  'days=60&reviewed=1&tradition=all&calendar_profile=legacy-ujjain&tz=Asia%2FKolkata';

export interface PublicCalendarItem {
  slug: string | null;
  display_name: string;
  description: string | null;
  tradition: string | null;
  civilDate: string;
  status: 'resolved';
  reviewStatus: 'reviewed';
}

export interface PublicCalendarSnapshot {
  schemaVersion: number;
  generatedAt: string;
  from: string | null;
  to: string | null;
  displayObservances: PublicCalendarItem[];
}

type UpstreamItem = Record<string, unknown> | null | undefined;

function optionalText(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

/** Keeps only what the preview shows, and only occurrences that may be presented as final. */
export function buildPublicCalendarSnapshot(payload: unknown, generatedAt: string): PublicCalendarSnapshot {
  const body = (payload ?? {}) as { from?: unknown; to?: unknown; displayObservances?: unknown };
  if (!Array.isArray(body.displayObservances)) {
    throw new Error('Calendar response has no displayObservances');
  }

  const displayObservances: PublicCalendarItem[] = [];
  for (const item of body.displayObservances as UpstreamItem[]) {
    if (
      !item ||
      item.status !== 'resolved' ||
      item.reviewStatus !== 'reviewed' ||
      typeof item.civilDate !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(item.civilDate) ||
      typeof item.display_name !== 'string'
    ) {
      continue;
    }
    displayObservances.push({
      slug: optionalText(item.slug),
      display_name: item.display_name,
      description: optionalText(item.description),
      tradition: optionalText(item.tradition),
      civilDate: item.civilDate,
      status: 'resolved',
      reviewStatus: 'reviewed',
    });
  }

  return {
    schemaVersion: PUBLIC_CALENDAR_SCHEMA_VERSION,
    generatedAt,
    from: optionalText(body.from),
    to: optionalText(body.to),
    displayObservances,
  };
}

export function isPublicCalendarSnapshotUsable(snapshot: PublicCalendarSnapshot, nowMs: number): boolean {
  if (snapshot.schemaVersion !== PUBLIC_CALENDAR_SCHEMA_VERSION) return false;
  const generatedMs = Date.parse(snapshot.generatedAt);
  return Number.isFinite(generatedMs) && nowMs - generatedMs <= PUBLIC_CALENDAR_MAX_AGE_MS;
}

function selfOrigin(): string {
  if (process.env.VERCEL_ENV === 'production') return 'https://www.shoonaya.com';
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 3001}`;
}

async function loadPublicCalendarSnapshot(): Promise<PublicCalendarSnapshot> {
  // The unique parameter skips the upstream's 30-minute CDN copy, so a refresh
  // after a withdrawal reads the database. No cookies are sent: this is the guest response.
  const url = `${selfOrigin()}/api/calendar/upcoming?${PUBLIC_CALENDAR_UPSTREAM_QUERY}&snapshot=${Date.now()}`;
  const response = await fetch(url, {
    cache: 'no-store',
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
  });
  // Throwing keeps the last good copy: a failed refresh must never replace it.
  if (!response.ok) throw new Error(`Calendar refresh failed with status ${response.status}`);
  return buildPublicCalendarSnapshot(await response.json(), new Date().toISOString());
}

export const getPublicCalendarSnapshot = unstable_cache(
  loadPublicCalendarSnapshot,
  ['public-calendar-snapshot', String(PUBLIC_CALENDAR_SCHEMA_VERSION)],
  { revalidate: PUBLIC_CALENDAR_REFRESH_SECONDS, tags: [PUBLIC_CALENDAR_TAG] },
);

/** Call after any write that can change a published occurrence. Never fails the write. */
export function invalidatePublicCalendarSnapshot(): void {
  try {
    revalidateTag(PUBLIC_CALENDAR_TAG);
  } catch (error) {
    console.warn('[public-calendar-snapshot] Could not invalidate:', error);
  }
}
