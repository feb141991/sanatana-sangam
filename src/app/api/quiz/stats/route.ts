import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { computeQuizStreak } from '@/lib/quiz-streak';

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data: responses, error } = await supabase
      .from('quiz_responses')
      .select('date, is_correct, tradition')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(200);

    if (error) throw error;

    const dates = (responses || []).map(r => r.date);
    const dateSet = new Set(dates);
    
    // Calculate current streak
    const currentStreak = computeQuizStreak(dates);

    // Calculate best streak
    let bestStreak = 0;
    if (dates.length > 0) {
      // Sort dates ascending
      const sortedDates = [...Array.from(dateSet)].sort();
      let currentRun = 1;
      bestStreak = 1;

      for (let i = 1; i < sortedDates.length; i++) {
        const prev = new Date(`${sortedDates[i-1]}T00:00:00Z`);
        const curr = new Date(`${sortedDates[i]}T00:00:00Z`);
        // if prev is exactly 1 day before curr
        const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86400000);
        
        if (diffDays === 1) {
          currentRun++;
          if (currentRun > bestStreak) bestStreak = currentRun;
        } else {
          currentRun = 1;
        }
      }
    }

    // Totals
    const total_answered = responses?.length || 0;
    const total_correct = responses?.filter(r => r.is_correct).length || 0;
    const accuracy_pct = total_answered > 0 ? Number(((total_correct / total_answered) * 100).toFixed(1)) : 0;

    // By tradition
    const traditionMap: Record<string, { answered: number; correct: number }> = {};
    for (const r of (responses || [])) {
      if (!traditionMap[r.tradition]) {
        traditionMap[r.tradition] = { answered: 0, correct: 0 };
      }
      traditionMap[r.tradition].answered++;
      if (r.is_correct) traditionMap[r.tradition].correct++;
    }
    const by_tradition = Object.entries(traditionMap).map(([tradition, stats]) => ({
      tradition,
      answered: stats.answered,
      correct: stats.correct,
      accuracy_pct: Number(((stats.correct / stats.answered) * 100).toFixed(1)),
    }));

    // Last 7 days
    const last_7_days: (boolean | null)[] = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setUTCDate(d.getUTCDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const r = responses?.find(x => x.date === dStr);
      if (r) {
        last_7_days.push(r.is_correct);
      } else {
        last_7_days.push(null);
      }
    }

    return NextResponse.json({
      streak: currentStreak,
      best_streak: bestStreak,
      total_answered,
      total_correct,
      accuracy_pct,
      by_tradition,
      last_7_days,
    }, {
      headers: {
        'Cache-Control': 'private, no-store',
      }
    });

  } catch (err) {
    console.error('[quiz/stats] Failed:', err);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
