import { NextResponse } from 'next/server';
import {
  getPublicCalendarSnapshot,
  isPublicCalendarSnapshotUsable,
} from '@/lib/calendar/public-calendar-snapshot';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const UNAVAILABLE_HEADERS = { 'Cache-Control': 'no-store' };

/**
 * The homepage calendar preview: no cookies, no personalisation, fixed inputs.
 * The snapshot is refreshed about once a day. The short CDN time is what lets a
 * withdrawn date disappear within minutes; visits between refreshes do not reach
 * the database at any CDN age, because the snapshot itself is cached.
 */
export async function GET() {
  try {
    const snapshot = await getPublicCalendarSnapshot();
    if (!isPublicCalendarSnapshotUsable(snapshot, Date.now())) {
      return NextResponse.json({ error: 'Calendar unavailable' }, { status: 503, headers: UNAVAILABLE_HEADERS });
    }
    return NextResponse.json(snapshot, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=86400' },
    });
  } catch (error) {
    console.error('[API Public Calendar] Snapshot unavailable:', error);
    return NextResponse.json({ error: 'Calendar unavailable' }, { status: 503, headers: UNAVAILABLE_HEADERS });
  }
}
