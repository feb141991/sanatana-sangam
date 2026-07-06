import { NextRequest, NextResponse } from 'next/server';
import { getApiUser } from '@/lib/api-auth';
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
  const { user, error: authError, supabase } = await getApiUser(req);

  if (!user || !supabase) {
    return NextResponse.json({ error: authError?.message ?? 'Unauthorized' }, { status: 401 });
  }

  const banned = await assertNotBanned(supabase, user.id);
  if (banned) return banned;

  try {
    const body = await req.json();
    const { amount, reason, target_user_id } = body;

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

    let finalAmount = amount;
    let metadata: any = null;

    if (reason === 'new_member_welcome' && target_user_id) {
      // Fetch both users' tradition from profiles
      const [callerRes, targetRes] = await Promise.all([
        supabase.from('profiles').select('tradition').eq('id', user.id).maybeSingle(),
        supabase.from('profiles').select('tradition').eq('id', target_user_id).maybeSingle()
      ]);

      const callerTradition = callerRes.data?.tradition;
      const targetTradition = targetRes.data?.tradition;

      if (callerTradition && targetTradition && callerTradition !== targetTradition) {
        finalAmount = amount + 10;
        metadata = { cross_tradition: true, welcomed_user_id: target_user_id };
      }
    }

    const today = new Date().toISOString().slice(0, 10);

    const { data, error } = await supabase.rpc('award_karma', {
      p_user_id:      user.id,
      p_reason:       reason,
      p_amount:       finalAmount,
      p_date:         today,
      p_daily_cap:    MAX_KARMA_PER_DAY,
      p_source_route: '/api/karma/award',
      p_metadata:     metadata,
    });

    if (error) throw error;

    const awarded = data as number;

    if (awarded <= 0) {
      return NextResponse.json(
        { error: `No karma awarded today for '${reason}' (either already awarded or daily cap reached).`, already_awarded: true },
        { status: 429 },
      );
    }

    return NextResponse.json({
      success:      true,
      karma_earned: awarded,
      reason,
    });
  } catch (err) {
    console.error('[karma/award] Failed:', err);
    return NextResponse.json({ error: 'Failed to award karma' }, { status: 500 });
  }
}
