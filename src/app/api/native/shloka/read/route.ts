import { NextRequest, NextResponse } from 'next/server';

import { getApiUser } from '@/lib/api-auth';

export const runtime = 'nodejs';

type ProfileRow = {
  timezone: string | null;
};

type MarkShlokaReadRow = {
  streak: number;
  read_date: string;
  already_read: boolean;
  seva_awarded: number;
  milestone: boolean;
};

// Was two independent, non-atomic writes (profiles.update() for the streak,
// then a separate increment_period_seva RPC call for +5 seva) — if the
// second call failed, the whole route returned 500 and the native client
// reverted its UI even though the streak half may have already committed.
// Now a single call into mark_shloka_read(), which does the idempotency
// check, streak update, and seva award in one locked transaction (see
// supabase/migrations/20260712120000_atomic_mark_shloka_read.sql for the
// full rationale). The "spiritual day" boundary (rolls over at local 4am,
// not midnight) is now computed inside that function instead of here, so
// there's one authoritative implementation instead of three
// (web/native/route each carrying their own copy).
export async function POST(req: NextRequest) {
  try {
    const { user, error: authError, supabase } = await getApiUser(req);
    if (!user || !supabase) {
      return NextResponse.json({ error: authError?.message ?? 'Unauthenticated' }, { status: 401 });
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('timezone')
      .eq('id', user.id)
      .maybeSingle();

    const profile = profileData as ProfileRow | null;

    const { data, error } = await supabase
      .rpc('mark_shloka_read', { p_timezone: profile?.timezone ?? 'UTC' })
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const result = data as MarkShlokaReadRow;

    return NextResponse.json({
      success: true,
      alreadyRead: result.already_read,
      date: result.read_date,
      streak: result.streak,
      sevaAwarded: result.seva_awarded,
      milestone: result.milestone,
    });
  } catch (err: unknown) {
    console.error('[POST /api/native/shloka/read] Server error:', err);
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
