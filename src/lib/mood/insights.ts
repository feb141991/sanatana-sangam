import { createServerSupabaseClient } from '@/lib/supabase-server';

export interface MoodInsightMetrics {
  totalCheckins: number;
  completedActions: number;
  mostFrequentMood: string | null;
  preferredActions: { action: string; count: number }[];
  streak: number; // consecutive days
}

export async function getMoodInsights(days: number): Promise<MoodInsightMetrics> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Unauthorized');
  }

  // Calculate the cutoff date
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  const { data: checkins, error } = await supabase
    .from('user_mood_checkins')
    .select('*')
    .eq('user_id', user.id)
    .eq('dismissed', false)
    .neq('session_status', 'abandoned')
    .gte('created_at', cutoffDate.toISOString())
    .order('created_at', { ascending: false });

  if (error || !checkins) {
    throw new Error('Failed to fetch mood check-ins');
  }

  if (checkins.length === 0) {
    return {
      totalCheckins: 0,
      completedActions: 0,
      mostFrequentMood: null,
      preferredActions: [],
      streak: 0,
    };
  }

  let completedActions = 0;
  const moodCounts: Record<string, number> = {};
  const actionCounts: Record<string, number> = {};

  // Track unique days for streak calculation
  const checkinDays = new Set<string>();

  for (const checkin of checkins) {
    // Basic stats
    if (checkin.before_mood) {
      moodCounts[checkin.before_mood] = (moodCounts[checkin.before_mood] || 0) + 1;
    }
    
    // Actions - count only actual completions for metrics
    const action = checkin.completed_action;
    if (action && checkin.completed_at) {
      completedActions++;
      actionCounts[action] = (actionCounts[action] || 0) + 1;
    }

    // Streak logic (basic)
    const dayKey = new Date(checkin.created_at).toISOString().split('T')[0];
    checkinDays.add(dayKey);
  }

  // Calculate streak based on consecutive days from today backwards
  let currentStreak = 0;
  let d = new Date();
  while (true) {
    const dStr = d.toISOString().split('T')[0];
    if (checkinDays.has(dStr)) {
      currentStreak++;
      d.setDate(d.getDate() - 1);
    } else if (currentStreak === 0 && d.toISOString().split('T')[0] === new Date().toISOString().split('T')[0]) {
      // Allow today to be missed if calculating mid-day, check yesterday
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }

  // Find most frequent mood
  let mostFrequentMood = null;
  let maxMoodCount = 0;
  for (const [mood, count] of Object.entries(moodCounts)) {
    if (count > maxMoodCount) {
      mostFrequentMood = mood;
      maxMoodCount = count;
    }
  }

  const formatActionName = (act: string) => {
    const map: Record<string, string> = {
      'stotram': 'Chant Stotrams',
      'katha': 'Read Stories',
      'dhyana': 'Meditation',
      'discover': 'Discover Chants',
      'japa': 'Japa Practice',
      'pathshala': 'Learn Scripture'
    };
    return map[act] || act.replace(/-/g, ' ');
  };

  // Format preferred actions
  const preferredActions = Object.entries(actionCounts)
    .map(([action, count]) => ({ action: formatActionName(action), count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  return {
    totalCheckins: checkins.length,
    completedActions,
    mostFrequentMood,
    preferredActions,
    streak: currentStreak,
  };
}
