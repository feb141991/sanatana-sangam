import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { localSpiritualDate } from '@/lib/sacred-time';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    // Always verify JWT server-side — getSession() returns unverified cached data.
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { timeZone } = await req.json().catch(() => ({ timeZone: 'UTC' }));
    const spiritualDate = localSpiritualDate(timeZone);
    const userId = user.id;

    const { data: profile } = await supabase
      .from('profiles')
      .select('streak_freeze_count, is_banned')
      .eq('id', userId)
      .maybeSingle();

    if (profile?.is_banned) {
      return NextResponse.json({ error: 'Your account has been suspended.' }, { status: 403 });
    }

    // Fetch today's sadhana record
    const { data: sadhana, error } = await supabase
      .from('daily_sadhana')
      .select('id, japa_done, quiz_done, nitya_done, pathshala_done, dharmveer_done, perfect_day_bonus_given')
      .eq('user_id', userId)
      .eq('date', spiritualDate)
      .single();

    if (error || !sadhana) {
      return NextResponse.json({ awarded: false, reason: 'incomplete' });
    }

    // Check if bonus already given
    if (sadhana.perfect_day_bonus_given) {
      return NextResponse.json({ awarded: false, reason: 'already_given' });
    }

    // Check if all 5 are done
    const allDone = sadhana.japa_done && sadhana.quiz_done && sadhana.nitya_done && sadhana.pathshala_done && sadhana.dharmveer_done;

    if (!allDone) {
      return NextResponse.json({ awarded: false, reason: 'incomplete' });
    }

    // Atomically claim the bonus: only succeeds if perfect_day_bonus_given is still false.
    // .select('id') returns the updated row — if the array is empty, a concurrent request
    // already set it to true and this request lost the race.
    const { data: claimedRows, error: updateError } = await supabase
      .from('daily_sadhana')
      .update({ perfect_day_bonus_given: true })
      .eq('id', sadhana.id)
      .eq('perfect_day_bonus_given', false)
      .select('id');

    if (updateError) {
      throw new Error(`Failed to update daily_sadhana: ${updateError.message}`);
    }

    // Another concurrent request won the race — bonus was already claimed.
    if (!claimedRows || claimedRows.length === 0) {
      return NextResponse.json({ awarded: false, reason: 'already_given' });
    }

    // Call RPCs to award karma and seva
    const { error: karmaError } = await supabase.rpc('increment_karma', { p_user_id: userId, p_amount: 30 });
    if (karmaError) {
      console.error('Failed to award karma for perfect day:', karmaError);
      // We don't fail the request completely, but log it
    }

    const { error: sevaError } = await supabase.rpc('increment_period_seva', { p_user_id: userId, p_points: 15 });
    if (sevaError) {
      console.error('Failed to award seva for perfect day:', sevaError);
    } else {
      // PART C - fire-and-forget tier check
      fetch(new URL('/api/seva-tier/check', req.url).toString(), { 
        method: 'POST', 
        headers: { Cookie: req.headers.get('cookie') ?? '' } 
      }).catch((e: unknown) => {
        console.warn('[sadhana/perfect-day] seva-tier check failed:', (e as Error)?.message);
      });
    }

    let freezeAwarded = false;
    let freezesRemaining = profile?.streak_freeze_count ?? 0;
    if ((profile?.streak_freeze_count ?? 0) < 3) {
      const { data: freezeCount, error: freezeError } = await supabase.rpc('increment_streak_freeze', {
        p_user_id: userId,
        p_amount: 1,
      });
      if (freezeError) {
        console.error('Failed to award streak freeze for perfect day:', freezeError);
      } else if (typeof freezeCount === 'number') {
        freezeAwarded = freezeCount > (profile?.streak_freeze_count ?? 0);
        freezesRemaining = freezeCount;
      }
    }

    return NextResponse.json({ awarded: true, karma: 30, seva: 15, freezeAwarded, freezesRemaining });

  } catch (error) {
    console.error('Error in /api/sadhana/perfect-day:', error);
    return NextResponse.json({ awarded: false, reason: 'server_error' }, { status: 500 });
  }
}
