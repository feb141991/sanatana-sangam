import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { generateWithProvider } from '@/lib/ai/providers/inference';

export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch the last 14 days of check-ins
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 14);
    
    const { data: checkins, error } = await supabase
      .from('user_mood_checkins')
      .select('*')
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

    // Try to get AI summary
    try {
      const summaryPayload = checkins.map(c => ({
        date: new Date(c.created_at).toLocaleDateString(),
        mood: c.before_mood,
        action: c.completed_action || c.clicked_action || 'none'
      }));

      const prompt = `You are Dharma Mitra — a wise, empathetic spiritual guide speaking to a Shoonya (a Shoonaya practitioner) on their inner path.
Review the following mood check-ins over the past 14 days. They logged their mood and chose a spiritual practice each time.
Provide a 2-3 sentence encouraging reflection on their emotional journey. Warm tone, grounded in dharma. Optionally use 1-2 Sanskrit terms (Sadhana, Abhyasa, Shanti). No bullet points. No fluff.

Data: ${JSON.stringify(summaryPayload)}
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
    return NextResponse.json({ 
      summary: `You have checked in ${checkins.length} times in the past two weeks. Keep up your consistent practice, the path reveals itself step by step.` 
    });

  } catch (err) {
    console.error('Reflection route error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
