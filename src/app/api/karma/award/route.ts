import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { assertNotBanned } from '@/lib/api-guards';

// ─── POST /api/karma/award ───────────────────────────────────────────────────
// Awards karma to a user by executing the increment_karma RPC.
// Rate-limited: each reason can only be awarded once per day per user,
// and the total daily karma across all reasons is capped at MAX_KARMA_PER_DAY.
// ─────────────────────────────────────────────────────────────────────────────

/** Maximum karma that can be awarded in a single call. */
const MAX_KARMA_PER_AWARD = 100;

/**
 * Maximum total karma a user can earn via this endpoint in a single UTC day.
 * Prevents multi-call accumulation even if reason deduplication were bypassed.
 */
const MAX_KARMA_PER_DAY = 500;

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
  'ai_chat_response',
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

    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD UTC

    // ── 1. Per-reason daily deduplication ────────────────────────────────────
    // Each reason can only be awarded once per day. A unique index on
    // (user_id, reason, awarded_date) in karma_award_log enforces this.
    const { data: existingAward } = await supabase
      .from('karma_award_log')
      .select('id')
      .eq('user_id', user.id)
      .eq('reason', reason)
      .eq('awarded_date', today)
      .maybeSingle();

    if (existingAward) {
      return NextResponse.json(
        { error: `Karma for '${reason}' already awarded today.`, already_awarded: true },
        { status: 429 },
      );
    }

    // ── 2. Daily total cap ────────────────────────────────────────────────────
    // Prevent a user from accumulating more than MAX_KARMA_PER_DAY karma
    // in a single day across all reasons.
    const { data: dailyRows } = await supabase
      .from('karma_award_log')
      .select('amount')
      .eq('user_id', user.id)
      .eq('awarded_date', today);

    const dailyTotal = (dailyRows ?? []).reduce((sum, r) => sum + (r.amount ?? 0), 0);
    if (dailyTotal + amount > MAX_KARMA_PER_DAY) {
      return NextResponse.json(
        { error: `Daily karma cap of ${MAX_KARMA_PER_DAY} reached.`, daily_cap_reached: true },
        { status: 429 },
      );
    }

    // ── 3. Record the award (before incrementing, to win the race) ───────────
    const { error: logError } = await supabase
      .from('karma_award_log')
      .insert({ user_id: user.id, reason, amount, awarded_date: today });

    if (logError) {
      // Unique constraint violation = a concurrent request just inserted first
      if (logError.code === '23505') {
        return NextResponse.json(
          { error: `Karma for '${reason}' already awarded today.`, already_awarded: true },
          { status: 429 },
        );
      }
      throw logError;
    }

    // ── 4. Increment karma ────────────────────────────────────────────────────
    const { error } = await supabase.rpc('increment_karma', {
      p_user_id: user.id,
      p_amount: amount,
    });

    if (error) throw error;

    // Record in karma ledger — fire and forget, non-blocking
    supabase.from('karma_ledger').insert({
      user_id: user.id,
      amount: amount,
      reason: reason,
      source_route: '/api/karma/award',
      metadata: { ip: req.headers.get('x-forwarded-for') ?? null },
    }).then(({ error }) => {
      if (error) console.warn('[karma/award] ledger insert failed:', error.message);
    });

    return NextResponse.json({ success: true, karma_earned: amount, reason, daily_total: dailyTotal + amount });
  } catch (err) {
    console.error('[karma/award] Failed:', err);
    return NextResponse.json({ error: 'Failed to award karma' }, { status: 500 });
  }
}
