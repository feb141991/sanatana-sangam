import { NextResponse, NextRequest } from 'next/server';
import { getApiUser } from '@/lib/api-auth';
import { assertNotBanned } from '@/lib/api-guards';
import { generateWithProvider } from '@/lib/ai/providers/inference';
import { getMoodInsights } from '@/lib/mood/insights';

export async function GET(request: NextRequest) {
  try {
    const { user, error: authError, supabase } = await getApiUser(request);
    if (!user || !supabase) {
      return NextResponse.json({ error: authError?.message ?? 'Unauthorized' }, { status: 401 });
    }
    const banned = await assertNotBanned(supabase, user.id);
    if (banned) return banned;

    // Fetch the last 14 days of check-ins
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 14);
    
    const { data: checkins, error } = await supabase
      .from('user_mood_checkins')
      .select('id, user_id, before_mood, after_mood, completed_action, clicked_action, completed_at, context_need, context_time, context_type, session_status, dismissed, source_surface, recommended_action_type, recommended_action_target, reflection_note, closed_at, created_at')
      .eq('user_id', user.id)
      .eq('dismissed', false)
      .neq('session_status', 'abandoned')
      .gte('created_at', cutoffDate.toISOString())
      .order('created_at', { ascending: false });

    if (error || !checkins) {
      return NextResponse.json({ error: 'Failed to fetch check-ins' }, { status: 500 });
    }

    if (checkins.length === 0) {
      return NextResponse.json({ 
        summary: "Your journey begins now. Start logging your daily moods to receive personalized spiritual reflections." 
      });
    }

    const insightSnapshot = await getMoodInsights(14).catch(() => null);

    // Try to get AI summary
    try {
      const summaryPayload = checkins.slice(0, 10).map(c => ({
        date: new Date(c.created_at).toLocaleDateString(),
        mood: c.before_mood,
        action: c.completed_action || c.clicked_action || 'none',
        need: c.context_need || 'unspecified',
        time: c.context_time || 'unspecified',
        practiceType: c.context_type || 'unspecified',
        afterMood: c.after_mood || 'not_logged',
      }));

      const prompt = `You are Dharma Mitra, a grounded spiritual guide for Shoonaya.
Review the user's last 14 days of mood check-ins and return a short reflection that is:
- observably tied to the data
- emotionally intelligent
- suggestive, with one concrete next-step recommendation
- 3 to 4 sentences only
- warm but not vague
- no bullet points
- no exaggerated mysticism
- no generic praise

Analytics snapshot: ${JSON.stringify(insightSnapshot)}
Recent check-ins: ${JSON.stringify(summaryPayload)}
`;

      const aiResponse = await generateWithProvider({
        user: prompt,
        temperature: 0.7,
        maxOutputTokens: 2048,
        reasoningEffort: 'none'
      }, {
        responseFormat: 'text'
      });

      if (aiResponse && aiResponse.text) {
        return NextResponse.json({ summary: aiResponse.text.trim() });
      }
    } catch (aiError) {
      console.warn('AI Reflection failed, using fallback:', aiError);
    }

    // Fallback if AI fails or times out
    const fallbackMood = checkins[0]?.before_mood ?? 'recently mixed';
    const fallbackCompleted = checkins.filter((checkin) => Boolean(checkin.completed_action && checkin.completed_at)).length;
    const fallbackNeedCounts = checkins.reduce<Record<string, number>>((acc, checkin) => {
      if (!checkin.context_need) return acc;
      acc[checkin.context_need] = (acc[checkin.context_need] ?? 0) + 1;
      return acc;
    }, {});
    const fallbackTopNeed = Object.entries(fallbackNeedCounts).sort((left, right) => right[1] - left[1])[0]?.[0] ?? null;

    return NextResponse.json({ 
      summary: `You checked in ${checkins.length} times over the last two weeks, most recently feeling ${fallbackMood}. You completed ${fallbackCompleted} practices,${fallbackTopNeed ? ` and ${fallbackTopNeed} appears as a recurring need.` : ''} Keep the next step simple and repeat the practice that feels easiest to complete before you add more variety.` 
    });

  } catch (err) {
    console.error('Reflection route error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
