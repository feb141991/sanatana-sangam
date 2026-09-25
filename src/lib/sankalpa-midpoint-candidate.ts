import type { NotificationCandidateInsert } from '@/types/database';
import { localTimeToUtc, shiftCivilDate } from './observance-timing';
import { isValidTimeZone } from './sacred-time';

export type SankalpaMidpointInput = {
  userId: string;
  sankalpaId: string;
  startDate: string;
  targetDays: number;
  localDate: string;
  timezone: string;
  language?: string | null;
  optedIn: boolean;
  now: Date;
};

const COPY = {
  en: {
    title: 'Sankalpa midpoint',
    body: 'You are halfway through your Sankalpa. Take a moment to reconnect with your intention.',
  },
  hi: {
    title: 'संकल्प का मध्य',
    body: 'आप अपने संकल्प के मध्य में हैं। अपने संकल्पित उद्देश्य से फिर जुड़ने के लिए एक क्षण लें।',
  },
  pa: {
    title: 'ਸੰਕਲਪ ਦਾ ਅੱਧਾ ਪੜਾਅ',
    body: 'ਤੁਸੀਂ ਆਪਣੇ ਸੰਕਲਪ ਦੇ ਅੱਧੇ ਰਾਹ ਤੇ ਹੋ। ਆਪਣੇ ਉਦੇਸ਼ ਨਾਲ ਮੁੜ ਜੁੜਨ ਲਈ ਇੱਕ ਪਲ ਲਵੋ।',
  },
} as const;

/** Builds one private, opt-in-only reminder candidate without reading the vow text. */
export function produceSankalpaMidpointCandidate(
  input: SankalpaMidpointInput,
): NotificationCandidateInsert | null {
  if (!input.optedIn || !input.userId || !input.sankalpaId) return null;
  if (!Number.isInteger(input.targetDays) || input.targetDays < 1) return null;
  if (!isValidTimeZone(input.timezone)) return null;

  const midpointDate = shiftCivilDate(input.startDate, Math.floor(input.targetDays / 2));
  if (!midpointDate || midpointDate !== input.localDate) return null;

  const scheduledFor = localTimeToUtc(input.localDate, '18:00', input.timezone);
  const expiresAt = localTimeToUtc(input.localDate, '23:59', input.timezone);
  if (!scheduledFor || !expiresAt || scheduledFor.getTime() <= input.now.getTime()) return null;

  const language = input.language === 'hi' || input.language === 'pa' ? input.language : 'en';
  const copy = COPY[language];

  return {
    user_id: input.userId,
    event_type: 'sankalpa_midpoint',
    event_id: input.sankalpaId,
    event_instance: 'midpoint',
    local_date: input.localDate,
    audience_variant: 'general',
    scheduled_for: scheduledFor.toISOString(),
    expires_at: expiresAt.toISOString(),
    priority: 20,
    title: copy.title,
    body: copy.body,
    action_url: '/sankalpa',
    language,
    timezone: input.timezone,
    source_status: 'user_intent',
    source_refs: { canonical_route: '/sankalpa' },
    metadata: {
      action_url: '/sankalpa',
      sankalpa_id: input.sankalpaId,
      reminder_instance: 'midpoint',
      local_date: input.localDate,
    },
  };
}
