import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

// ─── POST /api/quiz/save ──────────────────────────────────────────────────────
// Persists a quiz response to the database.
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { question, chosen_index, correct_index, is_correct, tradition } = body;

    const { error } = await supabase
      .from('quiz_responses')
      .insert({
        user_id: user.id,
        question,
        chosen_index,
        correct_index,
        is_correct,
        tradition,
        date: new Date().toISOString().split('T')[0]
      });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[quiz/save] Failed:', err);
    return NextResponse.json({ error: 'Failed to save response' }, { status: 500 });
  }
}
