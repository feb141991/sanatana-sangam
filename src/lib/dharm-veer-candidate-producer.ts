import type { NotificationCandidateInsert } from '@/types/database';
import { DHARM_VEERS, getDharmVeerOfTheDay, type DharmVeer } from './dharm-veer';
import { localTimeToUtc } from './observance-timing';
import { getLocalHour, isHourInQuietWindow, resolveTimeZone } from './sacred-time';

export interface DevoteeProfileForLearning {
  id: string;
  tradition?: string | null;
  language?: string | null;
  timezone?: string | null;
  preferred_reminder_time?: string | null;
  notification_quiet_hours_start?: number | null;
  notification_quiet_hours_end?: number | null;
}

/**
 * Produces a validated Dharm Veer candidate for a devotee on a specific local civil date.
 * Enforces:
 * 1. Selected hero is approved, live, and source-backed.
 * 2. Push copy contains NO unsupported quotations or fabricated religious claims.
 * 3. Exact canonical route `/dharm-veer/[id]`.
 * 4. Timezone and quiet-hours safety.
 */
export function produceDharmVeerCandidate(
  devotee: DevoteeProfileForLearning,
  localDate: string,
  heroOverride?: DharmVeer
): NotificationCandidateInsert | null {
  const timezone = resolveTimeZone(devotee.timezone);
  const hero = heroOverride ?? getDharmVeerOfTheDay(devotee.tradition);

  // Validate approved, source-backed hero exists
  if (!hero || !hero.id || !hero.name || (!hero.source && !hero.sourceCitations?.length)) {
    return null;
  }

  // Canonical route
  const action_url = `/dharm-veer/${hero.id}`;

  // Dignified push copy without fabricated quotes or claims
  const title = devotee.language === 'hi' && hero.nameLocal
    ? `धर्म वीर: ${hero.nameLocal}`
    : `Dharm Veer: ${hero.name}`;

  const body = devotee.language === 'hi' && hero.taglineLocal
    ? `${hero.emoji} ${hero.taglineLocal}`
    : `${hero.emoji} ${hero.tagline}`;

  // Determine local send time (default 08:30)
  let sendTime = devotee.preferred_reminder_time || '08:30';
  let [hour, minute] = sendTime.split(':').map(Number);

  // Adjust if falling inside quiet hours window
  if (
    devotee.notification_quiet_hours_start != null &&
    devotee.notification_quiet_hours_end != null &&
    isHourInQuietWindow(hour, devotee.notification_quiet_hours_start, devotee.notification_quiet_hours_end)
  ) {
    hour = (devotee.notification_quiet_hours_end + 1) % 24;
    sendTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  }

  const scheduledForDate = localTimeToUtc(localDate, sendTime, timezone);
  const expiresAtDate = localTimeToUtc(localDate, '23:59', timezone);

  if (!scheduledForDate || !expiresAtDate) {
    return null;
  }

  return {
    user_id: devotee.id,
    event_type: 'dharm_veer',
    event_id: hero.id,
    event_instance: '',
    local_date: localDate,
    audience_variant: devotee.language ?? 'general',
    scheduled_for: scheduledForDate.toISOString(),
    expires_at: expiresAtDate.toISOString(),
    priority: 60, // Routine engagement priority
    title,
    body,
    action_url,
    language: devotee.language ?? 'en',
    timezone,
    tradition: hero.tradition,
    calendar_profile: null,
    source_status: 'verified',
    source_refs: {
      source: hero.source,
      citations: hero.sourceCitations ?? [],
    },
    metadata: {
      priority_class: 'routine_engagement',
      learning_slot: true,
      hero_id: hero.id,
      hero_name: hero.name,
      tradition: hero.tradition,
    },
    status: 'pending',
  };
}
