import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { assertNotBanned } from '@/lib/api-guards';

// ─── POST /api/karma/award ───────────────────────────────────────────────────
// Awards karma atomically via the award_karma RPC, which serialises concurrent
// calls per user and rolls back all writes if any step fails.
// ─────────────────────────────────────────────────────────────────────────────

const MAX_KARMA_PER_AWARD = 100;
const MAX_KARMA_PER_DAY   = 500;

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
  // Community & co-creation seva
  'blessing_shared',         // Shared a festival blessing card
  'scripture_correction',    // Submitted a translation correction
  'new_member_welcome',      // Welcomed a new Kul/community member
  'satsang_hosted',          // Hosted a virtual satsang
  'family_prayer_upload',    // Uploaded a family prayer to the archive
  'content_flagged',         // Flagged incorrect content (reviewed + confirmed)
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

    const today = new Date().toISOString().slice(0, 10);

    const { data, error } = await supabase.rpc('award_karma', {
      p_user_id:      user.id,
      p_reason:       reason,
      p_amount:       amount,
      p_date:         today,
      p_daily_cap:    MAX_KARMA_PER_DAY,
      p_source_route: '/api/karma/award',
    });

    if (error) throw error;

    const result = data as { status: string; karma_earned: number; daily_total: number };

    if (result.status === 'already_awarded') {
      return NextResponse.json(
        { error: `Karma for '${reason}' already awarded today.`, already_awarded: true },
        { status: 429 },
      );
    }

    if (result.status === 'daily_cap_reached') {
      return NextResponse.json(
        { error: `Daily karma cap of ${MAX_KARMA_PER_DAY} reached.`, daily_cap_reached: true },
        { status: 429 },
      );
    }

    return NextResponse.json({
      success:      true,
      karma_earned: result.karma_earned,
      reason,
      daily_total:  result.daily_total,
    });
  } catch (err) {
    console.error('[karma/award] Failed:', err);
    return NextResponse.json({ error: 'Failed to award karma' }, { status: 500 });
  }
}
