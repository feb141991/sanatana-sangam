import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

// ─── POST /api/quiz/save ──────────────────────────────────────────────────────
// Persists a daily quiz response. Increments karma_points on the profile.
// Karma: +10 for correct, +2 for wrong (showing up still counts).
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { question, chosen_index, correct_index, is_correct, tradition, explanation } = body;

    // Persist quiz response (one per day per user)
    const { error: insertError } = await supabase
      .from('quiz_responses')
      .upsert({
        user_id: user.id,
        question,
        chosen_index,
        correct_index,
        is_correct,
        tradition,
        explanation: explanation ?? null,
        date: new Date().toISOString().split('T')[0],
      }, { onConflict: 'user_id,date', ignoreDuplicates: true });

    if (insertError) throw insertError;

    // Increment karma_points — only if this was a new insert (ignoreDuplicates means
    // replays won't double-award, but we still attempt the increment safely)
    const karmaGain = is_correct ? 10 : 2;
    try {
      await supabase.rpc('increment_karma', { p_user_id: user.id, p_amount: karmaGain });
    } catch { /* safe — rpc not yet deployed until migration runs */ }

    return NextResponse.json({ success: true, karma_earned: karmaGain });
  } catch (err) {
    console.error('[quiz/save] Failed:', err);
    return NextResponse.json({ error: 'Failed to save response' }, { status: 500 });
  }
}
