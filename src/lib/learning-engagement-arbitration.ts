/**
 * Learning Engagement Slot Arbitration
 *
 * Enforces that generic learning engagement candidates (Dharm Veer and Daily Quiz)
 * compete for a single routine engagement slot on any given local spiritual date.
 * Alternates deterministically per devotee so an individual never receives both on the same day.
 */

export type LearningCandidateType = 'dharm_veer' | 'quiz';

export interface DevoteeLearningPreferences {
  dharmVeerEnabled?: boolean | null;
  quizEnabled?: boolean | null;
}

/**
 * Fast deterministic string hash for stable modulo selection.
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Selects which learning engagement candidate type to schedule for a devotee on a given local date.
 * Returns null if both are disabled.
 */
export function selectLearningEngagementType(
  userId: string,
  localDate: string,
  preferences: DevoteeLearningPreferences = {}
): LearningCandidateType | null {
  // If explicitly disabled, respect devotee preference
  const isDharmVeerAllowed = preferences.dharmVeerEnabled !== false;
  const isQuizAllowed = preferences.quizEnabled !== false;

  if (!isDharmVeerAllowed && !isQuizAllowed) {
    return null;
  }

  if (isDharmVeerAllowed && !isQuizAllowed) {
    return 'dharm_veer';
  }

  if (!isDharmVeerAllowed && isQuizAllowed) {
    return 'quiz';
  }

  // Both allowed: Deterministically alternate based on user + local date hash
  const seed = `${userId}::${localDate}::learning_slot`;
  const hash = hashString(seed);

  return hash % 2 === 0 ? 'dharm_veer' : 'quiz';
}
