import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { localSpiritualDate } from '@/lib/sacred-time';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { timeZone } = await req.json().catch(() => ({ timeZone: 'UTC' }));
    const spiritualDate = localSpiritualDate(timeZone);
    const userId = session.user.id;

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

    // Update perfect_day_bonus_given
    const { error: updateError } = await supabase
      .from('daily_sadhana')
      .update({ perfect_day_bonus_given: true })
      .eq('id', sadhana.id)
      .eq('perfect_day_bonus_given', false); // extra safety check

    if (updateError) {
      throw new Error(`Failed to update daily_sadhana: ${updateError.message}`);
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
      }).catch(() => {}); // non-fatal
    }

    return NextResponse.json({ awarded: true, karma: 30, seva: 15 });

  } catch (error) {
    console.error('Error in /api/sadhana/perfect-day:', error);
    return NextResponse.json({ awarded: false, reason: 'server_error' }, { status: 500 });
  }
}
