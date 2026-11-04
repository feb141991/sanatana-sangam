import type { NotificationCandidateInsert } from '@/types/database';
import { resolveTimeZone } from './sacred-time';
import { localTimeToUtc, shiftCivilDate } from './observance-timing';
import { SANSKARA_ACTION_URL, SANSKARA_EVENT_TYPE, SANSKARA_MAX_AHEAD_MS } from './sanskara-reminder-candidate';

/**
 * Turns rows of `sanskara_handover_due()` into `notification_candidates`: the notices that tell a child's managers the
 * hand-over at 18 is near or closing. Same event type as the milestone reminders, a disjoint key space: `event_id` is the
 * child's subject id and `event_instance` is `H<notice>`. Design: docs/SANSKARA_HANDOVER_SCOPE.md, backend design section 5.
 *
 * Who is told is decided in SQL by `sanskara_can`; this file only shapes the rows. It never receives the child's name or birth
 * date. The insert trigger `sanskara_validate_handover_candidate` re-checks everything at the instant of the insert.
 */

export const SANSKARA_HANDOVER_NOTICES = ['open_90', 'open_30', 'open_7', 'open_0', 'closing_30', 'closing_7'] as const;
export type SanskaraHandoverNotice = (typeof SANSKARA_HANDOVER_NOTICES)[number];

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** One row of `sanskara_handover_due()`, as PostgREST returns it. */
export type SanskaraHandoverDueRow = {
  subject_id: string;
  account_id: string;
  notice: string;
  audience_variant: string;
  profile_generation: number;
  local_date: string;
  scheduled_for: string;
  timezone: string;
  language: string | null;
  quiet_hours_start: number | null;
  quiet_hours_end: number | null;
};

export type SanskaraHandoverBuild = {
  candidates: NotificationCandidateInsert[];
  malformedCount: number;
  outsideHorizonCount: number;
};

type Language = 'en' | 'hi' | 'pa';

function languageFor(value: string | null): Language {
  const language = value?.trim().toLowerCase();
  return language === 'hi' || language === 'pa' ? language : 'en';
}

// One wording for all six notices, so the lock screen shows no stage, no age, no date and no relationship. What is due, and
// for whom, is shown inside the app after access is checked again. Two wordings per language because the insert trigger refuses
// text that contains the child's name (three letters or more) as a substring; the producer tries the next only on that answer.
// Hindi and Punjabi wording was reviewed and approved by the founder, Prince Sharma, on 2026-11-04.
type Wording = { title: string; body: string };
const WORDINGS: Record<Language, Wording[]> = {
  en: [
    { title: 'Sanskara timeline', body: 'Something on your timeline needs your attention. Open the app.' },
    { title: 'Saved dates', body: 'A saved item needs a look. Please open the app.' },
  ],
  hi: [
    { title: 'संस्कार समयरेखा', body: 'आपकी समयरेखा में कुछ देखने योग्य है। ऐप खोलें।' },
    { title: 'आपका दिन', body: 'आपके लिए एक सूचना है। ऐप खोलें।' },
  ],
  pa: [
    { title: 'ਸੰਸਕਾਰ ਸਮਾਂ-ਰੇਖਾ', body: 'ਤੁਹਾਡੀ ਸਮਾਂ-ਰੇਖਾ ਵਿੱਚ ਕੁਝ ਵੇਖਣ ਵਾਲਾ ਹੈ। ਐਪ ਖੋਲ੍ਹੋ।' },
    { title: 'ਤੁਹਾਡਾ ਦਿਨ', body: 'ਤੁਹਾਡੇ ਲਈ ਇੱਕ ਸੂਚਨਾ ਹੈ। ਐਪ ਖੋਲ੍ਹੋ।' },
  ],
};

/** Exposed so a test can run every wording through the name rule. */
export const SANSKARA_HANDOVER_WORDINGS = WORDINGS;

/** The same candidate with the next generic wording, or null when there is none. Nothing else about it changes. */
export function withSanskaraHandoverWording(candidate: NotificationCandidateInsert, variant: number): NotificationCandidateInsert | null {
  const wording = WORDINGS[languageFor(candidate.language ?? null)][variant];
  return wording ? { ...candidate, title: wording.title, body: wording.body } : null;
}

function isCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

function isWellFormed(row: SanskaraHandoverDueRow): boolean {
  const isOpen = typeof row.notice === 'string' && row.notice.startsWith('open_');
  return typeof row.subject_id === 'string' && UUID_RE.test(row.subject_id)
    && typeof row.account_id === 'string' && UUID_RE.test(row.account_id)
    && (SANSKARA_HANDOVER_NOTICES as readonly string[]).includes(row.notice)
    && row.audience_variant === (isOpen ? 'manager' : 'former_manager')
    && isCount(row.profile_generation)
    && typeof row.local_date === 'string' && DATE_RE.test(row.local_date)
    && typeof row.timezone === 'string' && row.timezone.length > 0
    && typeof row.scheduled_for === 'string' && Number.isFinite(Date.parse(row.scheduled_for));
}

export function buildSanskaraHandoverCandidates(rows: SanskaraHandoverDueRow[], now: Date): SanskaraHandoverBuild {
  const candidates: NotificationCandidateInsert[] = [];
  let malformedCount = 0;
  let outsideHorizonCount = 0;

  for (const row of rows) {
    if (!isWellFormed(row)) { malformedCount += 1; continue; }

    const scheduledFor = new Date(row.scheduled_for);
    if (scheduledFor.getTime() > now.getTime() + SANSKARA_MAX_AHEAD_MS) { outsideHorizonCount += 1; continue; }

    // Valid until the end of its own local day: a late run still delivers it that day and never the next.
    const timezone = resolveTimeZone(row.timezone);
    const nextDay = shiftCivilDate(row.local_date, 1);
    const expiresAt = nextDay ? localTimeToUtc(nextDay, '00:00', timezone) : null;
    if (!expiresAt || expiresAt.getTime() <= Math.max(now.getTime(), scheduledFor.getTime())) { malformedCount += 1; continue; }

    const language = languageFor(row.language);
    const wording = WORDINGS[language][0];
    candidates.push({
      user_id: row.account_id,
      event_type: SANSKARA_EVENT_TYPE,
      event_id: row.subject_id,
      event_instance: `H${row.notice}`,
      local_date: row.local_date,
      audience_variant: row.audience_variant,
      scheduled_for: scheduledFor.toISOString(),
      expires_at: expiresAt.toISOString(),
      priority: 30,
      title: wording.title,
      body: wording.body,
      action_url: SANSKARA_ACTION_URL,
      language,
      timezone,
      tradition: null,
      calendar_profile: null,
      source_status: 'user_provided',
      source_refs: {},
      // Exactly the keys the insert trigger allows.
      metadata: {
        subject_id: row.subject_id,
        notice: row.notice,
        profile_generation: row.profile_generation,
        local_date: row.local_date,
        timezone,
      },
    });
  }
  return { candidates, malformedCount, outsideHorizonCount };
}
