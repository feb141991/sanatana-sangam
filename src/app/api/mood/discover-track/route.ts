import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

// POST /api/mood/discover-track
// Track user interactions within the personalized discovery stack
// Body: { checkinId: string, action: 'skip' | 'click', itemType: string, targetId?: string }
export async function POST(req: Request) {
  try {
    const { checkinId, action, itemType, targetId } = await req.json();

    if (!checkinId || !action || !itemType) {
      return NextResponse.json({ error: 'Missing required tracking fields' }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // First fetch the current state
    const { data: current, error: fetchErr } = await supabase
      .from('user_mood_checkins')
      .select('skipped_actions, clicked_action')
      .eq('id', checkinId)
      .eq('user_id', user.id)
      .single();

    if (fetchErr || !current) {
      return NextResponse.json({ error: 'Check-in not found' }, { status: 404 });
    }

    if (action === 'skip') {
      const skipped = Array.isArray(current.skipped_actions) ? [...current.skipped_actions] : [];
      if (!skipped.includes(itemType)) {
        skipped.push(itemType);
        
        await supabase
          .from('user_mood_checkins')
          .update({ skipped_actions: skipped })
          .eq('id', checkinId)
          .eq('user_id', user.id);
      }
    } else if (action === 'click') {
      // Overwrite the clicked action, or append if it was already set? We'll just overwrite.
      await supabase
        .from('user_mood_checkins')
        .update({ 
          clicked_action: itemType,
          // optionally store targetId if needed, but clicked_action uses the 'type' for personalization
        })
        .eq('id', checkinId)
        .eq('user_id', user.id);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Discover tracking failed:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
