import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

type MoodCheckin = Database['public']['Tables']['user_mood_checkins']['Row'];

type ActionSummary = {
  key: string;
  action: string;
  count: number;
  sharePct: number;
};

type MoodSummary = {
  mood: string;
  count: number;
  sharePct: number;
};

type NeedSummary = {
  need: string;
  count: number;
};

type TimeSummary = {
  time: string;
  count: number;
};

type PracticeTypeSummary = {
  type: string;
  count: number;
};

type TrendDirection = 'improving' | 'steady' | 'needs_attention';

export interface MoodInsightMetrics {
  totalCheckins: number;
  completedActions: number;
  completionRate: number;
  mostFrequentMood: string | null;
  dominantMoodShare: number;
  preferredActions: ActionSummary[];
  moodBreakdown: MoodSummary[];
  commonNeeds: NeedSummary[];
  commonTimeCommitments: TimeSummary[];
  commonPracticeTypes: PracticeTypeSummary[];
  streak: number;
  afterMoodLoggedCount: number;
  improvementRate: number | null;
  recentTrend: TrendDirection | null;
  loggedAfterMoodRate: number;
  suggestions: string[];
}

const ACTION_LABELS: Record<string, string> = {
  stotram: 'Chant Stotrams',
  katha: 'Read Stories',
  dhyana: 'Meditation',
  discover: 'Discover Chants',
  japa: 'Japa Practice',
  pathshala: 'Learn Scripture',
};

const MOOD_SCORES: Record<string, number> = {
  grieving: 1,
  lost: 1,
  angry: 1,
  anxious: 2,
  overwhelmed: 2,
  lonely: 2,
  scattered: 2,
  seeking: 3,
  grateful: 4,
  joyful: 5,
};

function getDayKey(dateString: string) {
  return new Date(dateString).toISOString().split('T')[0];
}

function formatActionName(action: string) {
  return ACTION_LABELS[action] ?? action.replace(/[-_]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function getTrendDirection(checkins: MoodCheckin[]): TrendDirection | null {
  const scored = checkins
    .map((checkin) => MOOD_SCORES[checkin.before_mood ?? ''] ?? null)
    .filter((score): score is number => score !== null);

  if (scored.length < 4) return null;

  const windowSize = Math.min(3, Math.floor(scored.length / 2));
  const recentWindow = scored.slice(0, windowSize);
  const previousWindow = scored.slice(windowSize, windowSize * 2);

  if (previousWindow.length === 0) return null;

  const recentAverage = recentWindow.reduce((sum, score) => sum + score, 0) / recentWindow.length;
  const previousAverage = previousWindow.reduce((sum, score) => sum + score, 0) / previousWindow.length;
  const delta = recentAverage - previousAverage;

  if (delta >= 0.6) return 'improving';
  if (delta <= -0.6) return 'needs_attention';
  return 'steady';
}

function buildSuggestions({
  mostFrequentMood,
  completionRate,
  commonNeeds,
  commonPracticeTypes,
  commonTimeCommitments,
  preferredActions,
  improvementRate,
  recentTrend,
  streak,
}: {
  mostFrequentMood: string | null;
  completionRate: number;
  commonNeeds: NeedSummary[];
  commonPracticeTypes: PracticeTypeSummary[];
  commonTimeCommitments: TimeSummary[];
  preferredActions: ActionSummary[];
  improvementRate: number | null;
  recentTrend: TrendDirection | null;
  streak: number;
}) {
  const suggestions: string[] = [];
  const topNeed = commonNeeds[0]?.need ?? null;
  const topAction = preferredActions[0]?.action ?? null;
  const topPracticeType = commonPracticeTypes[0]?.type ?? null;
  const topTimeCommitment = commonTimeCommitments[0]?.time ?? null;

  if (mostFrequentMood === 'anxious' || mostFrequentMood === 'overwhelmed' || mostFrequentMood === 'scattered') {
    suggestions.push('Favor shorter grounding practices first. Two to five minute repetitions are more likely to become consistent than longer sessions this week.');
  }

  if (mostFrequentMood === 'grieving' || mostFrequentMood === 'lonely') {
    suggestions.push('Lean toward devotional or relational practices. Katha, stotram, or shared sangat-style spaces are more likely to support emotional steadiness than solo intensity.');
  }

  if (mostFrequentMood === 'seeking' || mostFrequentMood === 'lost') {
    suggestions.push('Bias toward study with one clear next step. Pathshala or a short reading practice will likely convert seeking into direction faster than broad discovery.');
  }

  if (completionRate < 40) {
    suggestions.push('Your follow-through is low relative to check-ins. Reduce the size of the suggested practice and repeat one dependable action until completion becomes easier.');
  } else if (completionRate >= 70 && topAction) {
    suggestions.push(`${topAction} is already working for you. Keep it as your default recovery action before adding variety.`);
  }

  if (topNeed === 'calm') {
    suggestions.push('Your check-ins lean toward calm-seeking. Prioritize breath-led or mantra-led practices over content-heavy exploration.');
  } else if (topNeed === 'clarity') {
    suggestions.push('Clarity is the recurring need. Choose practices with structure: scripture, guided reflection, or a single focused prompt.');
  } else if (topNeed === 'devotion') {
    suggestions.push('Devotion is showing up as a pattern. Bhakti-oriented practices will likely feel more restorative than purely cognitive ones right now.');
  } else if (topNeed === 'comfort') {
    suggestions.push('Comfort appears repeatedly. Gentle repetition and familiar prayers are likely to work better than novelty this week.');
  }

  if (improvementRate !== null && improvementRate < 35) {
    suggestions.push('Few sessions are ending in a better after-mood. Keep the first action simpler and shorter so regulation happens before you go deeper.');
  } else if (improvementRate !== null && improvementRate >= 60) {
    suggestions.push('Your after-mood lift is strong. This is a good week to reinforce the practices you already trust rather than experimenting widely.');
  }

  if (recentTrend === 'needs_attention') {
    suggestions.push('The recent emotional trend is slipping. Prefer consistency over intensity for the next few days and avoid skipping the first check-in of the day.');
  } else if (recentTrend === 'improving') {
    suggestions.push('Your recent pattern is improving. Keep the same rhythm and avoid changing too many variables while it is working.');
  }

  if (topPracticeType === 'listen') {
    suggestions.push('Listening practices are dominating your choices. Pair one listening session with one active repetition so the effect carries into the rest of the day.');
  } else if (topPracticeType === 'reflect') {
    suggestions.push('Reflection is a recurring doorway for you. Keep one written or spoken takeaway after each session so insight turns into a usable pattern.');
  } else if (topPracticeType === 'chant') {
    suggestions.push('Chanting is showing up as a reliable regulation path. Use it earlier in the emotional spiral instead of waiting until the mood is fully escalated.');
  }

  if (topTimeCommitment === '2 min' && completionRate < 60) {
    suggestions.push('Even short commitments are hard to complete right now. Reduce friction further by choosing one fixed practice slot rather than relying on mood-dependent timing.');
  } else if (topTimeCommitment === '10+ min' && completionRate >= 60) {
    suggestions.push('You are sustaining longer practices without much drop-off. This is a good time to deepen one anchor practice instead of sampling many options.');
  }

  if (streak >= 5 && completionRate >= 50) {
    suggestions.push('Your consistency base is forming. Protect the streak with a non-negotiable minimum practice so momentum survives low-energy days.');
  }

  return suggestions.slice(0, 3);
}

export async function getMoodInsights(
  days: number,
  supabase: SupabaseClient,
  userId: string
): Promise<MoodInsightMetrics> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const { data: checkins, error } = await supabase
    .from('user_mood_checkins')
    .select('id, user_id, before_mood, after_mood, completed_action, clicked_action, completed_at, context_need, context_time, context_type, session_status, dismissed, source_surface, recommended_action_type, recommended_action_target, reflection_note, closed_at, recommendations_shown, skipped_actions, created_at')
    .eq('user_id', userId)
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
      completionRate: 0,
      mostFrequentMood: null,
      dominantMoodShare: 0,
      preferredActions: [],
      moodBreakdown: [],
      commonNeeds: [],
      commonTimeCommitments: [],
      commonPracticeTypes: [],
      streak: 0,
      afterMoodLoggedCount: 0,
      improvementRate: null,
      recentTrend: null,
      loggedAfterMoodRate: 0,
      suggestions: [],
    };
  }

  let completedActions = 0;
  let afterMoodLoggedCount = 0;
  let liftedSessions = 0;

  const moodCounts: Record<string, number> = {};
  const actionCounts: Record<string, number> = {};
  const needCounts: Record<string, number> = {};
  const timeCounts: Record<string, number> = {};
  const practiceTypeCounts: Record<string, number> = {};
  const checkinDays = new Set<string>();

  for (const checkin of checkins) {
    if (checkin.before_mood) {
      moodCounts[checkin.before_mood] = (moodCounts[checkin.before_mood] ?? 0) + 1;
    }

    if (checkin.context_need) {
      needCounts[checkin.context_need] = (needCounts[checkin.context_need] ?? 0) + 1;
    }

    if (checkin.context_time) {
      timeCounts[checkin.context_time] = (timeCounts[checkin.context_time] ?? 0) + 1;
    }

    if (checkin.context_type) {
      practiceTypeCounts[checkin.context_type] = (practiceTypeCounts[checkin.context_type] ?? 0) + 1;
    }

    const action = checkin.completed_action;
    if (action && checkin.completed_at) {
      completedActions += 1;
      actionCounts[action] = (actionCounts[action] ?? 0) + 1;
    }

    if (checkin.after_mood) {
      afterMoodLoggedCount += 1;
      const beforeScore = MOOD_SCORES[checkin.before_mood ?? ''];
      const afterScore = MOOD_SCORES[checkin.after_mood];
      if (beforeScore !== undefined && afterScore !== undefined && afterScore > beforeScore) {
        liftedSessions += 1;
      }
    }

    checkinDays.add(getDayKey(checkin.created_at));
  }

  let currentStreak = 0;
  const today = new Date();
  let cursor = new Date(today);

  while (true) {
    const dayKey = getDayKey(cursor.toISOString());
    if (checkinDays.has(dayKey)) {
      currentStreak += 1;
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }

    if (currentStreak === 0 && dayKey === getDayKey(today.toISOString())) {
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }

    break;
  }

  const moodBreakdown = Object.entries(moodCounts)
    .map(([mood, count]) => ({
      mood,
      count,
      sharePct: Math.round((count / checkins.length) * 100),
    }))
    .sort((left, right) => right.count - left.count);

  const mostFrequentMood = moodBreakdown[0]?.mood ?? null;
  const dominantMoodShare = moodBreakdown[0]?.sharePct ?? 0;

  const preferredActions = Object.entries(actionCounts)
    .map(([action, count]) => ({
      key: action,
      action: formatActionName(action),
      count,
      sharePct: completedActions > 0 ? Math.round((count / completedActions) * 100) : 0,
    }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 3);

  const commonNeeds = Object.entries(needCounts)
    .map(([need, count]) => ({ need, count }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 3);

  const commonTimeCommitments = Object.entries(timeCounts)
    .map(([time, count]) => ({ time, count }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 3);

  const commonPracticeTypes = Object.entries(practiceTypeCounts)
    .map(([type, count]) => ({ type, count }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 3);

  const completionRate = Math.round((completedActions / checkins.length) * 100);
  const improvementRate = afterMoodLoggedCount > 0
    ? Math.round((liftedSessions / afterMoodLoggedCount) * 100)
    : null;
  const recentTrend = getTrendDirection(checkins);
  const loggedAfterMoodRate = Math.round((afterMoodLoggedCount / checkins.length) * 100);

  return {
    totalCheckins: checkins.length,
    completedActions,
    completionRate,
    mostFrequentMood,
    dominantMoodShare,
    preferredActions,
    moodBreakdown,
    commonNeeds,
    commonTimeCommitments,
    commonPracticeTypes,
    streak: currentStreak,
    afterMoodLoggedCount,
    improvementRate,
    recentTrend,
    loggedAfterMoodRate,
    suggestions: buildSuggestions({
      mostFrequentMood,
      completionRate,
      commonNeeds,
      commonPracticeTypes,
      commonTimeCommitments,
      preferredActions,
      improvementRate,
      recentTrend,
      streak: currentStreak,
    }),
  };
}
