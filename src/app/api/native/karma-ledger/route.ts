import { NextRequest, NextResponse } from 'next/server';

import { getApiUser } from '@/lib/api-auth';

// GET /api/native/karma-ledger
//
// Full-history karma ledger list for native's app/my-progress/ledger.tsx,
// which previously read this table directly via `supabase.from('karma_ledger')`
// with no date filter (all-time, newest first). Not served by
// /api/native/progress (which only returns a 30-day reason+amount summary
// for My Progress's home card) or /api/user/report (30-day window, doesn't
// return per-row id/source_route/metadata this screen's list UI needs) -
// hence a small, purpose-built route rather than reshaping either.
//
// Auth: getApiUser (Bearer for native, cookie for web). Reuses the
// returned RLS-scoped client - karma_ledger's existing
// "users_read_own_karma_ledger" SELECT policy (auth.uid() = user_id)
// already grants exactly this access to the native client today. No
// service role.

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { user, error: authError, supabase } = await getApiUser(req);
    if (!user || !supabase) {
      return NextResponse.json({ error: authError?.message ?? 'Unauthenticated' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('karma_ledger')
      .select('id, amount, reason, source_route, metadata, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { ledger: data ?? [] },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal error' }, { status: 500 });
  }
}
