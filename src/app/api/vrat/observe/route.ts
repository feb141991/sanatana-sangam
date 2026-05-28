import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { assertNotBanned } from '@/lib/api-guards';
import { localSpiritualDate } from '@/lib/sacred-time';

// ── Karma awarded for observing a vrat ───────────────────────────────────────
const VRAT_KARMA = 25;

// ── GET /api/vrat/observe?vrat_id=X ──────────────────────────────────────────
// Returns whether the authenticated user has observed this vrat today and
// the all-time observation count for this vrat.
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const vrat_id = req.nextUrl.searchParams.get('vrat_id');
  if (!vrat_id) return NextResponse.json({ error: 'Missing vrat_id' }, { status: 400 });

  // Fetch timezone for spiritual date (starts at 4 AM)
  const { data: tzRow } = await supabase
    .from('profiles')
    .select('timezone')
    .eq('id', user.id)
    .maybeSingle();
  const today = localSpiritualDate(tzRow?.timezone, 4);

  // Check for today's observation + all-time count in one query
  const recType = `vrat_obs:${vrat_id}`;

  const { data: allObs } = await supabase
    .from('recommendations')
    .select('date')
    .eq('user_id', user.id)
    .eq('type', recType)
    .order('date', { ascending: false });

  const observedToday = (allObs ?? []).some(r => r.date === today);
  const totalCount = (allObs ?? []).length;

  return NextResponse.json({ observed_today: observedToday, total_count: totalCount, today });
}

// ── POST /api/vrat/observe ────────────────────────────────────────────────────
// Mark a vrat as observed for today. Idempotent — duplicate calls return the
// same success response without double-awarding karma.
// Body: { vrat_id: string, vrat_name: string }
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const banned = await assertNotBanned(supabase, user.id);
  if (banned) return banned;

  const { vrat_id, vrat_name } = await req.json().catch(() => ({}));
  if (!vrat_id || typeof vrat_id !== 'string') {
    return NextResponse.json({ error: 'Missing vrat_id' }, { status: 400 });
  }

  // Fetch timezone
  const { data: tzRow } = await supabase
    .from('profiles')
    .select('timezone')
    .eq('id', user.id)
    .maybeSingle();
  const today = localSpiritualDate(tzRow?.timezone, 4);

  const recType = `vrat_obs:${vrat_id}`;

  // Check if already observed today (atomic with upsert)
  const { data: existing } = await supabase
    .from('recommendations')
    .select('date')
    .eq('user_id', user.id)
    .eq('type', recType)
    .eq('date', today)
    .maybeSingle();

  if (existing) {
    // Already observed — return success without awarding karma again
    return NextResponse.json({ success: true, already_observed: true, karma_earned: 0, today });
  }

  // Record observation
  const { error: upsertErr } = await supabase
    .from('recommendations')
    .upsert(
      {
        user_id: user.id,
        date: today,
        type: recType,
        content: {
          vrat_id,
          vrat_name: vrat_name || vrat_id,
          karma_earned: VRAT_KARMA,
          observed_at: new Date().toISOString(),
        },
        generated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,date,type' },
    );

  if (upsertErr) {
    console.error('[vrat/observe] DB write failed:', upsertErr.message);
    return NextResponse.json({ error: 'Failed to record observation' }, { status: 500 });
  }

  // Award karma using the increment_karma RPC (same as karma/award route)
  const { error: karmaErr } = await supabase.rpc('increment_karma', {
    p_user_id: user.id,
    p_amount: VRAT_KARMA,
  });

  if (karmaErr) {
    // Karma award is best-effort — observation is already recorded
    console.warn('[vrat/observe] Karma award failed (observation still recorded):', karmaErr.message);
  }

  return NextResponse.json({
    success: true,
    already_observed: false,
    karma_earned: karmaErr ? 0 : VRAT_KARMA,
    today,
  });
}
