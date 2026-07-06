import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getDharmVeerRoster, selectDharmVeerOfTheDayFromRoster } from '@/lib/dharm-veer-db';

// Public content endpoint — `dharm_veers` / `dharm_veer_daily` both carry a
// fully public read RLS policy (`USING (true)`), so no auth is required here.
// This mirrors the existing `/api/discover` and `/api/pathshala/paths`
// no-auth-for-published-content pattern already in this repo.
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

    return NextResponse.json({ success: true, roster, todayHero });
  } catch (err: unknown) {
    console.error('[GET /api/dharm-veer/roster] Server error:', err);
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
