import { NextRequest, NextResponse } from 'next/server';

import { getApiUser } from '@/lib/api-auth';
import { localSpiritualDate } from '@/lib/sacred-time';

export const runtime = 'nodejs';

type ProfileRow = {
  timezone: string | null;
  shloka_streak: number | null;
  last_shloka_date: string | null;
};

function previousSpiritualDate(today: string) {
  const yesterdayObj = new Date(`${today}T12:00:00Z`);
  yesterdayObj.setUTCDate(yesterdayObj.getUTCDate() - 1);
  return yesterdayObj.toISOString().slice(0, 10);
}

export async function POST(req: NextRequest) {
  try {
    const { user, error: authError, supabase } = await getApiUser(req);
    if (!user || !supabase) {
      return NextResponse.json({ error: authError?.message ?? 'Unauthenticated' }, { status: 401 });
    }

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('timezone, shloka_streak, last_shloka_date')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    const profile = profileData as ProfileRow | null;
    const today = localSpiritualDate(profile?.timezone ?? 'UTC', 4);
    const lastReadDate = profile?.last_shloka_date ?? null;

    if (lastReadDate === today) {
      return NextResponse.json({
        success: true,
        alreadyRead: true,
        date: today,
        streak: profile?.shloka_streak ?? 0,
        sevaAwarded: 0,
      });
    }

    const yesterday = previousSpiritualDate(today);
    const newStreak = lastReadDate === yesterday ? (profile?.shloka_streak ?? 0) + 1 : 1;

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        shloka_streak: newStreak,
        last_shloka_date: today,
      })
      .eq('id', user.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    const { error: sevaError } = await supabase.rpc('increment_period_seva', {
      p_user_id: user.id,
      p_points: 5,
    });

    if (sevaError) {
      return NextResponse.json({ error: sevaError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      alreadyRead: false,
      date: today,
      streak: newStreak,
      sevaAwarded: 5,
      milestone: newStreak % 7 === 0,
    });
  } catch (err: unknown) {
    console.error('[POST /api/native/shloka/read] Server error:', err);
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
