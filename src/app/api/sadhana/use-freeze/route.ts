import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { localSpiritualDate } from '@/lib/sacred-time';

function shiftIsoDate(isoDate: string, days: number) {
  const date = new Date(`${isoDate}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function hasAnyCompletion(row: {
  japa_done?: boolean | null;
  nitya_done?: boolean | null;
  pathshala_done?: boolean | null;
  quiz_done?: boolean | null;
  dharmveer_done?: boolean | null;
} | null | undefined) {
  if (!row) return false;
  return Boolean(
    row.japa_done
    || row.nitya_done
    || row.pathshala_done
    || row.quiz_done
    || row.dharmveer_done,
  );
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, freezesRemaining: 0, streakProtected: false }, { status: 401 });
    }

    const { timeZone } = await req.json().catch(() => ({ timeZone: 'UTC' }));
    const today = localSpiritualDate(timeZone, 4);
    const yesterday = shiftIsoDate(today, -1);

    const [
      { data: profile, error: profileError },
      { data: yesterdayRow, error: yesterdayError },
      { data: latestStreakRow, error: latestError },
    ] = await Promise.all([
      supabase
        .from('profiles')
        .select('streak_freeze_count, last_freeze_used, timezone')
        .eq('id', user.id)
        .single(),
      supabase
        .from('daily_sadhana')
        .select('japa_done, nitya_done, pathshala_done, quiz_done, dharmveer_done, streak_count')
        .eq('user_id', user.id)
        .eq('date', yesterday)
        .maybeSingle(),
      supabase
        .from('daily_sadhana')
        .select('date, streak_count')
        .eq('user_id', user.id)
        .lt('date', today)
        .not('streak_count', 'is', null)
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (profileError || yesterdayError || latestError) {
      throw profileError ?? yesterdayError ?? latestError;
    }

    const freezesAvailable = profile?.streak_freeze_count ?? 0;
    const latestStreak = latestStreakRow?.streak_count ?? 0;

    if (freezesAvailable <= 0 || latestStreak <= 0) {
      return NextResponse.json({ success: false, freezesRemaining: freezesAvailable, streakProtected: false });
    }

    if (profile?.last_freeze_used === today) {
      return NextResponse.json({ success: false, freezesRemaining: freezesAvailable, streakProtected: true });
    }

    if (hasAnyCompletion(yesterdayRow)) {
      return NextResponse.json({ success: false, freezesRemaining: freezesAvailable, streakProtected: false });
    }

    const nextFreezeCount = Math.max(0, freezesAvailable - 1);

    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({
        streak_freeze_count: nextFreezeCount,
        last_freeze_used: today,
      })
      .eq('id', user.id);

    if (profileUpdateError) throw profileUpdateError;

    const { error: protectError } = await supabase
      .from('daily_sadhana')
      .upsert({
        user_id: user.id,
        date: yesterday,
        streak_count: yesterdayRow?.streak_count ?? latestStreak,
      }, { onConflict: 'user_id,date' });

    if (protectError) throw protectError;

    return NextResponse.json({
      success: true,
      freezesRemaining: nextFreezeCount,
      streakProtected: true,
    });
  } catch (error) {
    console.error('[sadhana/use-freeze]', error);
    return NextResponse.json({ success: false, freezesRemaining: 0, streakProtected: false }, { status: 500 });
  }
}
