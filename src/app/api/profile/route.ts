import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { requireUserNotBanned } from '@/lib/api-guards';
import { SACRED_RELICS, getUnlockedRelics } from '@/lib/relics';

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { user, error: authError } = await requireUserNotBanned(supabase);
    if (authError) return authError;

    const body = await req.json().catch(() => null) as { active_symbol_id?: string } | null;
    const relicId = body?.active_symbol_id;
    if (!relicId) {
      return NextResponse.json({ error: 'active_symbol_id is required' }, { status: 400 });
    }

    const relic = SACRED_RELICS.find((item) => item.id === relicId);
    if (!relic) {
      return NextResponse.json({ error: 'Invalid relic' }, { status: 400 });
    }

    const [{ data: profile }, { data: latestSadhana }] = await Promise.all([
      supabase
        .from('profiles')
        .select('tradition, seva_score, shloka_streak')
        .eq('id', user.id)
        .single(),
      supabase
        .from('daily_sadhana')
        .select('streak_count')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const tradition = profile?.tradition ?? 'hindu';
    const streak = latestSadhana?.streak_count ?? profile?.shloka_streak ?? 0;
    const sevaScore = profile?.seva_score ?? 0;
    const unlocked = getUnlockedRelics(streak, sevaScore, tradition);
    const isUnlocked = unlocked.some((item) => item.id === relicId);

    if (!isUnlocked) {
      return NextResponse.json({ error: 'Relic not unlocked' }, { status: 403 });
    }

    const { error } = await supabase
      .from('profiles')
      .update({ active_symbol_id: relicId } as never)
      .eq('id', user.id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[api/profile PATCH]', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
