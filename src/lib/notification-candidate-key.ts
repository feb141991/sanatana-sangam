/**
 * Canonical helper for deriving and parsing legacy-compatible notification keys
 * from structured semantic notification candidate identities.
 *
 * Pattern:
 * - Observances: `${eventType}:${eventId}:${offsetInstance}:${localDate}:${audienceVariant}`
 * - Generic/Routine: `${eventType}:${eventId}${instance}:${localDate}:${audienceVariant}`
 */

export interface SemanticCandidateIdentity {
  event_type: string;
  event_id: string;
  event_instance?: string | null;
  local_date: string;
  audience_variant?: string | null;
}

/**
 * Derives a deterministic, legacy-compatible notification_key for a candidate.
 */
export function deriveCandidateNotificationKey(candidate: SemanticCandidateIdentity): string {
  const eventType = candidate.event_type.trim().toLowerCase();
  const eventId = candidate.event_id.trim();
  const instance = (candidate.event_instance ?? '').trim();
  const localDate = candidate.local_date.trim();
  const audience = (candidate.audience_variant ?? 'general').trim().toLowerCase();

  // For observances (observance, festival, vrat, tithi), ensure offset instance (e.g. D0, D-1, D-7) is explicit
  if (['observance', 'festival', 'vrat', 'tithi'].includes(eventType)) {
    const offset = instance || 'D0';
    return `${eventType}:${eventId}:${offset}:${localDate}:${audience}`;
  }

  // For routine and devotional engagement (quiz, dharm_veer, streak_nudge, mood, etc.)
  if (instance) {
    return `${eventType}:${eventId}:${instance}:${localDate}:${audience}`;
  }

  return `${eventType}:${eventId}:${localDate}:${audience}`;
}

/**
 * Parses a semantic notification key back into its constituent parts.
 */
export function parseCandidateNotificationKey(key: string): SemanticCandidateIdentity | null {
  if (!key || typeof key !== 'string') return null;
  const parts = key.split(':');
  if (parts.length < 3) return null;

  const event_type = parts[0];

  if (['observance', 'festival', 'vrat', 'tithi'].includes(event_type)) {
    if (parts.length >= 5) {
      return {
        event_type,
        event_id: parts[1],
        event_instance: parts[2],
        local_date: parts[3],
        audience_variant: parts[4],
      };
    }
  }

  if (parts.length === 4) {
    return {
      event_type,
      event_id: parts[1],
      event_instance: '',
      local_date: parts[2],
      audience_variant: parts[3],
    };
  }

  if (parts.length >= 5) {
    return {
      event_type,
      event_id: parts[1],
      event_instance: parts[2],
      local_date: parts[3],
      audience_variant: parts[4],
    };
  }

  return null;
}
