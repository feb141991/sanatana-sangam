import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getDharmVeerRoster, selectDharmVeerOfTheDayFromRoster } from '@/lib/dharm-veer-db';

// Public content endpoint — no auth required, mirroring the existing
// `/api/discover` and `/api/pathshala/paths` no-auth-for-published-content
// pattern already in this repo.
//
// RLS note (updated 2026-07-24): `dharm_veers` no longer has an unconditional
// public read policy. Since the Dharm Veer auto-sourcing agent started
// writing pending_review/rejected rows, the policy is
// `USING (review_status = 'approved')` -- see
// supabase/migrations/20260724163000_dharm_veer_source_backed_review.sql.
// getDharmVeerRoster/selectDharmVeerOfTheDayFromRoster below already filter
// to approved rows independently (src/lib/dharm-veer-db.ts), so this route's
// behavior is unaffected either way; the RLS policy is defense-in-depth, not
// this route's only guard. `dharm_veer_daily` (the legacy fallback table used
// only inside getDharmVeerBySlug) predates review_status and still has an
// unconditional `USING (true)` public read policy -- that table has no
// review_status column and is not part of the auto-sourcing pipeline.
//
// This route intentionally invents no new business logic: it wraps
// `getDharmVeerRoster` / `selectDharmVeerOfTheDayFromRoster` from
// `src/lib/dharm-veer-db.ts` verbatim — the same functions the web
// Dharm Veer pages already use — so native and web are guaranteed to see
// the identical canonical roster and identical "hero of the day" pick.
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { searchParams } = new URL(req.url);
    const tradition = searchParams.get('tradition');

    const roster = await getDharmVeerRoster(supabase);
    const todayHero = selectDharmVeerOfTheDayFromRoster(roster, tradition);

    return NextResponse.json({ success: true, roster, todayHero }, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
    });
  } catch (err: unknown) {
    console.error('[GET /api/dharm-veer/roster] Server error:', err);
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
