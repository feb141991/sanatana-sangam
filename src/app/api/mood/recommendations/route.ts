import { NextResponse } from 'next/server';
import { getRecommendationsForMood } from '@/lib/mood/engine';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mood = searchParams.get('mood');
  const checkinId = searchParams.get('checkin_id');

  if (!mood) {
    return NextResponse.json({ error: 'Missing mood parameter' }, { status: 400 });
  }

  const recommendations = getRecommendationsForMood(mood);
  
  if (checkinId && recommendations.length > 0) {
    try {
      const supabase = await createServerSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const topRec = recommendations[0];
        // Parse type and target from the href if possible, or just use the ID
        // Typical href: /bhakti/stotram/hanuman-chalisa
        const parts = topRec.href.split('/').filter(Boolean);
        const type = parts.length > 0 ? parts[parts.length - 2] || parts[0] : 'general';
        const target = parts.length > 0 ? parts[parts.length - 1] : topRec.id;

        await supabase
          .from('user_mood_checkins')
          .update({
            recommended_action_type: type,
            recommended_action_target: target
          })
          .eq('id', checkinId)
          .eq('user_id', user.id);
      }
    } catch (err) {
      console.error('Failed to persist recommendation metadata', err);
    }
  }
  
  return NextResponse.json({ recommendations });
}
