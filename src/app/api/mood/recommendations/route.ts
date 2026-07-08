import { NextResponse, NextRequest } from 'next/server';
import { getFullRecommendationsForMood, MoodHistory } from '@/lib/mood/engine';
import { getApiUser } from '@/lib/api-auth';
import { assertNotBanned } from '@/lib/api-guards';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mood = searchParams.get('mood');
  const need = searchParams.get('need');
  const time = searchParams.get('time');
  const type = searchParams.get('type');
  const checkinId = searchParams.get('checkin_id');
  const fetchFull = searchParams.get('full') === 'true';

  if (!mood) {
    return NextResponse.json({ error: 'Missing mood parameter' }, { status: 400 });
  }

  let history: MoodHistory[] = [];
  const { user, supabase } = await getApiUser(request);

  if (user && supabase) {
    const banned = await assertNotBanned(supabase, user.id);
    if (banned) return banned;

    // Fetch last 50 check-ins to build personalized history
    try {
      const { data: checkins } = await supabase
        .from('user_mood_checkins')
        .select('clicked_action, completed_action, skipped_actions')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
        
      if (checkins) {
        history = checkins.map(c => ({
          clicked_action: c.clicked_action,
          completed_action: c.completed_action,
          skipped_actions: Array.isArray(c.skipped_actions) ? c.skipped_actions : null
        })) as MoodHistory[];
      }
    } catch (e) {
      console.error('Failed to fetch mood history', e);
    }
  }

  // Pass context parameters and history to the engine to get personalized full stack
  const fullStack = getFullRecommendationsForMood(mood, { need, time, type }, history);
  const recommendations = fullStack.slice(0, 2); // default slice for backward compat
  const resultsToReturn = fetchFull ? fullStack : recommendations;
  
  if (checkinId && user && resultsToReturn.length > 0) {
    try {
      const topRec = resultsToReturn[0];
      const parts = topRec.href.split('/').filter(Boolean);
      const actionType = parts.length > 0 ? parts[parts.length - 2] || parts[0] : 'general';
      const target = parts.length > 0 ? parts[parts.length - 1] : topRec.id;

      // Extract just the types for recommendations_shown tracking
      const shownTypes = resultsToReturn.map(r => r.type);

      await supabase
        .from('user_mood_checkins')
        .update({
          recommended_action_type: actionType,
          recommended_action_target: target,
          recommendations_shown: shownTypes
        })
        .eq('id', checkinId)
        .eq('user_id', user.id);
    } catch (err) {
      console.error('Failed to persist recommendation metadata', err);
    }
  }
  
  return NextResponse.json({ recommendations: resultsToReturn });
}
