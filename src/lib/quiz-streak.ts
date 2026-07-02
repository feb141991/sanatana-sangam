/**
 * Compute current quiz streak from a sorted list of ISO date strings.
 * A streak is consecutive calendar days ending on today OR yesterday
 * (grace: user hasn't played today yet but played yesterday — streak intact).
 * Returns 0 if no qualifying streak.
 */
export function computeQuizStreak(dates: string[]): number {
  if (!dates || dates.length === 0) return 0;
  
  const dateSet = new Set(dates);
  const now = new Date();
  
  const todayStr = now.toISOString().split('T')[0];
  
  const yesterday = new Date(now);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  let currentStr = todayStr;
  
  if (dateSet.has(todayStr)) {
    currentStr = todayStr;
  } else if (dateSet.has(yesterdayStr)) {
    currentStr = yesterdayStr;
  } else {
    return 0;
  }
  
  let streak = 0;
  // Parse currentStr as UTC midnight
  const current = new Date(`${currentStr}T00:00:00Z`);
  
  while (true) {
    const dStr = current.toISOString().split('T')[0];
    if (dateSet.has(dStr)) {
      streak++;
      current.setUTCDate(current.getUTCDate() - 1);
    } else {
      break;
    }
  }
  
  return streak;
}

export type StreakMilestone = 'three_days' | 'week' | 'month' | 'century' | null;

/**
 * Returns a milestone label if the streak crosses a threshold, otherwise null.
 * Milestones: 3, 7, 30, 100.
 */
export function getStreakMilestone(streak: number): StreakMilestone {
  switch (streak) {
    case 3: return 'three_days';
    case 7: return 'week';
    case 30: return 'month';
    case 100: return 'century';
    default: return null;
  }
}
