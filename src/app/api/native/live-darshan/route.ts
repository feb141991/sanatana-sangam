import { NextRequest, NextResponse } from 'next/server';

import { getApiUser } from '@/lib/api-auth';
import { resolveActiveLiveStreams, type LiveDarshanDbRow } from '@/lib/live-streams';

// GET /api/native/live-darshan
//
// Returns the exact same stability-filtered stream list the PWA's own
// src/app/(main)/live-darshan/page.tsx renders — reuses
// resolveActiveLiveStreams() directly rather than re-deriving or
// duplicating any of its logic. That function is the real safety boundary
// for this whole feature: it merges DB-managed rows (health-checked by
// /api/cron/check-live-darshans, auto-suppressed once health_status is
// no longer 'healthy'/'suspect') with a manually re-audited static
// allowlist (VERIFIED_STATIC_STREAM_IDS). Everything else in
// src/lib/live-streams.ts's ~150-entry LIVE_STREAMS catalog carries an
// unverified "VERIFY-LIVE" video ID and is deliberately excluded from
// resolveActiveLiveStreams()'s output — so native inherits the same
// "only real, stable sources" guarantee web already relies on, with zero
// duplicated catalog data and zero drift risk as the team's admin/cron
// pipeline updates health status over time.
//
// Auth: getApiUser (Bearer for native, cookie for web) — matches the
// page.tsx server component's own requirement that the caller be signed
// in (it redirects to '/' otherwise). No service-role; RLS-scoped read.

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { user, error: authError, supabase } = await getApiUser(req);
    if (!user || !supabase) {
      return NextResponse.json({ error: authError?.message ?? 'Unauthenticated' }, { status: 401 });
    }

    const { data: dbStreams, error: streamsError } = await supabase
      .from('live_darshans')
      .select('id, title, location, schedule, category, tradition, current_video_id, is_active, health_status')
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    // Same resilience as page.tsx: a DB read error falls back to the
    // manually-verified static tier (resolveActiveLiveStreams(null)) rather
    // than failing the whole request or surfacing nothing.
    const streams = resolveActiveLiveStreams(!streamsError ? (dbStreams as LiveDarshanDbRow[] | null) : null);

    return NextResponse.json(
      { streams },
      { headers: { 'Cache-Control': 'private, max-age=60' } },
    );
  } catch (err: unknown) {
    console.error('[GET /api/native/live-darshan] Server error:', err);
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
