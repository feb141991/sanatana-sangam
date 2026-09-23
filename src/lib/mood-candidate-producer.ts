import type { NotificationCandidateInsert } from '@/types/database';
import { localTimeToUtc } from './observance-timing';
import { isHourInQuietWindow, resolveTimeZone } from './sacred-time';

export type MoodSlot = 'midday' | 'evening';

export interface DevoteeProfileForMood {
  id: string;
  tradition?: string | null;
  timezone?: string | null;
  notification_quiet_hours_start?: number | null;
  notification_quiet_hours_end?: number | null;
  is_deleting?: boolean | null;
}

export const MIDDAY_PROMPTS_BY_TRADITION: Record<string, string[]> = {
  hindu: [
    'How is your inner space today?',
    'How does your heart feel in this moment?',
    'Take a breath — what is your mood right now?',
  ],
  sikh: [
    "Waheguru's grace is with you — how do you feel?",
    'Pause for a moment. What does your heart say?',
  ],
  buddhist: [
    'Notice this moment — what feelings are present?',
    'Be present — how is your mind right now?',
  ],
  jain: [
    'In this moment of awareness — how are you?',
    'Pause and observe — what is your inner state?',
  ],
  other: [
    'How are you feeling right now?',
    'Take a quiet breath — what is your mood?',
  ],
};

export const EVENING_PROMPTS_BY_TRADITION: Record<string, string[]> = {
  hindu: [
    'As the day winds down, how has your inner journey been?',
    'Before evening puja, take a moment — how do you feel?',
    'The setting sun invites reflection. What is your mood?',
  ],
  sikh: [
    'As Rehras Sahib time approaches, how does your heart feel?',
    'The evening Gurbani calls — how are you in this moment?',
  ],
  buddhist: [
    'Evening meditation begins with awareness. How are you?',
    'As the day closes, what feelings are present for you?',
  ],
  jain: [
    'Evening pratikraman time — how has your inner space been?',
    'Before your evening samayik, check in: how do you feel?',
  ],
  other: [
    'As the day winds down, how are you feeling?',
    'Take a quiet moment — what is your mood this evening?',
  ],
};

/**
 * Returns a deterministic or randomly chosen prompt for a given slot and tradition.
 */
export function getMoodPrompt(slot: MoodSlot, tradition: string = 'hindu', seedIndex?: number): string {
  const normalizedTradition = tradition?.toLowerCase() ?? 'other';
  const table = slot === 'midday' ? MIDDAY_PROMPTS_BY_TRADITION : EVENING_PROMPTS_BY_TRADITION;
  const prompts = table[normalizedTradition] ?? table.other;

  if (seedIndex !== undefined && seedIndex >= 0) {
    return prompts[seedIndex % prompts.length];
  }
  return prompts[Math.floor(Math.random() * prompts.length)];
}

/**
 * Produces a validated Mood check-in candidate for a devotee on a specific local civil date.
 * Supports both 'midday' (12:00 noon) and 'evening' (18:00) reminder slots.
 *
 * Enforces:
 * 1. Active account (suppresses if is_deleting === true).
 * 2. Quiet-hours protection (suppresses if slot falls inside quiet hours).
 * 3. Tradition-tailored reflection prompt.
 * 4. Exact canonical route `/discover/mood`.
 * 5. Timezone, DST, and quiet-hours safe scheduling.
 * 6. Priority: 60 (`routine_engagement` - daily check-in).
 */
export function produceMoodCandidate(
  devotee: DevoteeProfileForMood,
  slot: MoodSlot,
  localDate: string,
  options?: {
    promptIndex?: number;
    customTitle?: string;
    customBody?: string;
  }
): NotificationCandidateInsert | null {
  // 1. Account safety: skip accounts marked for deletion
  if (devotee.is_deleting === true) {
    return null;
  }

  const timezone = resolveTimeZone(devotee.timezone);
  const targetHour = slot === 'midday' ? 12 : 18;

  // 2. Quiet hours: suppress if the scheduled hour falls in quiet window
  const quietStart = devotee.notification_quiet_hours_start != null ? Number(devotee.notification_quiet_hours_start) : null;
  const quietEnd = devotee.notification_quiet_hours_end != null ? Number(devotee.notification_quiet_hours_end) : null;

  if (isHourInQuietWindow(targetHour, quietStart, quietEnd)) {
    return null;
  }

  const sendTime = `${String(targetHour).padStart(2, '0')}:00`;
  const scheduledForDate = localTimeToUtc(localDate, sendTime, timezone);
  const expiresAtDate = localTimeToUtc(localDate, '23:59', timezone);

  if (!scheduledForDate || !expiresAtDate) {
    return null;
  }

  // 3. Tradition-specific reflection prompt
  const tradition = devotee.tradition ?? 'hindu';
  const prompt = getMoodPrompt(slot, tradition, options?.promptIndex);

  const title = options?.customTitle ?? (slot === 'midday' ? 'Midday check-in 🌿' : '🌙 Evening check-in');
  const body = options?.customBody ?? `${prompt} Let scripture meet your mood.`;

  return {
    user_id: devotee.id,
    event_type: 'mood',
    event_id: slot,
    event_instance: '',
    local_date: localDate,
    audience_variant: 'general',
    scheduled_for: scheduledForDate.toISOString(),
    expires_at: expiresAtDate.toISOString(),
    priority: 60, // Priority 6: routine engagement - daily check-in
    title,
    body,
    action_url: '/discover/mood',
    language: 'en',
    timezone,
    tradition,
    calendar_profile: null,
    source_status: 'verified',
    source_refs: {
      canonical_route: '/discover/mood',
      slot,
    },
    metadata: {
      slot,
      prompt,
      tradition,
      action_url: '/discover/mood',
      priority_class: 'routine_engagement',
    },
  };
}
