import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { assertNotBanned } from '@/lib/api-guards';

// ─── POST /api/karma/award ───────────────────────────────────────────────────
// Awards karma to a user by executing the increment_karma RPC.
// ─────────────────────────────────────────────────────────────────────────────

/** Maximum karma that can be awarded in a single call. */
const MAX_KARMA_PER_AWARD = 100;

/**
 * Allowlist of legitimate karma reasons.
 * Adding a new action that earns karma requires it to be listed here —
 * this prevents arbitrary string values from being passed by a client.
 */
const ALLOWED_KARMA_REASONS = new Set([
  'japa_complete',
  'quiz_complete',
  'nitya_karma',
  'pathshala_lesson',
  'dharm_veer',
  'sankalpa_complete',
  'seva',
  'referral',
  'profile_complete',
  'streak_milestone',
  'mala_session',
  'vrat_complete',
  'sankalpa_milestone',
  'kul_event',
]);

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const banned = await assertNotBanned(supabase, user.id);
  if (banned) return banned;

  try {
    const body = await req.json();
    const { amount, reason } = body;

    if (typeof amount !== 'number' || amount <= 0 || amount > MAX_KARMA_PER_AWARD) {
      return NextResponse.json(
        { error: `Amount must be a number between 1 and ${MAX_KARMA_PER_AWARD}` },
        { status: 400 },
      );
    }

    if (!reason || !ALLOWED_KARMA_REASONS.has(reason)) {
      return NextResponse.json(
        { error: `Invalid karma reason. Must be one of: ${[...ALLOWED_KARMA_REASONS].join(', ')}` },
        { status: 400 },
      );
    }

    const { error } = await supabase.rpc('increment_karma', {
      p_user_id: user.id,
      p_amount: amount,
    });

    if (error) throw error;

    return NextResponse.json({ success: true, karma_earned: amount, reason });
  } catch (err) {
    console.error('[karma/award] Failed:', err);
    return NextResponse.json({ error: 'Failed to award karma' }, { status: 500 });
  }
}
