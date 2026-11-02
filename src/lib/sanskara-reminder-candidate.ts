import type { NotificationCandidateInsert } from '@/types/database';
import { resolveTimeZone } from './sacred-time';
import { localTimeToUtc, shiftCivilDate } from './observance-timing';

/**
 * Turns rows of `sanskara_reminders_due()` into `notification_candidates` for event_type 'sanskar_milestone'.
 *
 * Who may be reminded of what is decided in SQL by `sanskara_can`; this file only shapes the rows. It never reads a name,
 * a title or a rite (the database function does not return them), so the text cannot repeat one. The insert trigger
 * `sanskara_validate_candidate` re-checks everything at the instant of the insert and is the authority, not this file.
 * Design: docs/SANSKARA_TRACKER_BACKEND_DESIGN.md section 5.
 */

export const SANSKARA_EVENT_TYPE = 'sanskar_milestone';
/** The link carries no id and no query; the screen re-authorizes on open. */
export const SANSKARA_ACTION_URL = '/kul/sanskara';
/** The insert trigger refuses anything scheduled further ahead than this. */
export const SANSKARA_MAX_AHEAD_MS = 48 * 60 * 60 * 1000;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const LEADS = new Set([0, 1, 3, 7, 14, 30]);
const AUDIENCES = new Set(['self', 'manager', 'viewer']);

/** One row of `sanskara_reminders_due()`, as PostgREST returns it. */
export type SanskaraDueRow = {
  subscription_id: string;
  subscription_generation: number;
  record_version: number;
  profile_generation: number;
  account_id: string;
  lead_days: number;
  audience_variant: string;
  local_date: string;
  scheduled_for: string;
  timezone: string;
  language: string | null;
  quiet_hours_start: number | null;
  quiet_hours_end: number | null;
};

export type SanskaraCandidateBuild = {
  candidates: NotificationCandidateInsert[];
  malformedCount: number;
  outsideHorizonCount: number;
};

type Language = 'en' | 'hi' | 'pa';

function languageFor(value: string | null): Language {
  const language = value?.trim().toLowerCase();
  return language === 'hi' || language === 'pa' ? language : 'en';
}

// Generic on purpose: no name, no milestone, no rite, no relationship, no date. Whoever reads a lock screen learns only that
// a reminder they chose is due. The wording does not change with the audience for the same reason.
//
// More than one wording per language because the insert trigger refuses any text that contains a person's name (three letters
// or more) as a substring. Fixed copy would make every reminder for, say, a child called "Tim" or "Kara" fail forever and
// silently. The wordings share as few letter sequences as possible; the producer tries the next one only when the trigger
// answers sanskara_candidate_not_discreet, and the trigger judges each attempt again. If every wording is refused the
// reminder is not sent. Hindi and Punjabi are unreviewed by a native speaker.
type Wording = { title: string; today: string; soon: string };
const COPY: Record<Language, Wording[]> = {
  en: [
    {
      title: 'Sanskara reminder',
      today: 'Today is a date you chose to be reminded of. Open your timeline.',
      soon: 'A date you chose to be reminded of is coming up. Open your timeline.',
    },
    {
      title: 'Saved date',
      today: 'A saved date is here. Please open the app.',
      soon: 'A saved date is near. Please open the app.',
    },
  ],
  hi: [
    {
      title: 'संस्कार स्मरण',
      today: 'आज वह तिथि है जिसकी याद दिलाने को आपने कहा था। अपनी समयरेखा खोलें।',
      soon: 'आपकी चुनी हुई स्मरण तिथि निकट है। अपनी समयरेखा खोलें।',
    },
    {
      title: 'आपका दिन',
      today: 'आपका चुना हुआ दिन आ गया है। ऐप खोलें।',
      soon: 'आपका चुना हुआ दिन पास है। ऐप खोलें।',
    },
  ],
  pa: [
    {
      title: 'ਸੰਸਕਾਰ ਯਾਦ',
      today: 'ਅੱਜ ਉਹ ਤਾਰੀਖ ਹੈ ਜਿਸ ਦੀ ਯਾਦ ਦਿਵਾਉਣ ਲਈ ਤੁਸੀਂ ਕਿਹਾ ਸੀ। ਆਪਣੀ ਸਮਾਂ-ਰੇਖਾ ਖੋਲ੍ਹੋ।',
      soon: 'ਤੁਹਾਡੀ ਚੁਣੀ ਹੋਈ ਯਾਦ ਦੀ ਤਾਰੀਖ ਨੇੜੇ ਹੈ। ਆਪਣੀ ਸਮਾਂ-ਰੇਖਾ ਖੋਲ੍ਹੋ।',
    },
    {
      title: 'ਤੁਹਾਡਾ ਦਿਨ',
      today: 'ਤੁਹਾਡਾ ਚੁਣਿਆ ਦਿਨ ਆ ਗਿਆ ਹੈ। ਐਪ ਖੋਲ੍ਹੋ।',
      soon: 'ਤੁਹਾਡਾ ਚੁਣਿਆ ਦਿਨ ਨੇੜੇ ਹੈ। ਐਪ ਖੋਲ੍ਹੋ।',
    },
  ],
};

/** Exposed so a test can run every wording through the name rule. */
export const SANSKARA_WORDINGS = COPY;

function wordingText(language: Language, variant: number, leadDays: number) {
  const wording = COPY[language][variant];
  if (!wording) return null;
  return { title: wording.title, body: leadDays === 0 ? wording.today : wording.soon };
}

/**
 * The same candidate with the next generic wording, or null when there is none. Used only after the insert trigger refused the
 * text as not discreet (it repeats someone's name); nothing else about the candidate changes.
 */
export function withSanskaraWording(candidate: NotificationCandidateInsert, variant: number): NotificationCandidateInsert | null {
  const lead = Number((candidate.event_instance ?? '').replace(/^L/, ''));
  if (!Number.isInteger(lead)) return null;
  const text = wordingText(languageFor(candidate.language ?? null), variant, lead);
  return text ? { ...candidate, ...text } : null;
}

function isCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

function isWellFormed(row: SanskaraDueRow): boolean {
  return typeof row.subscription_id === 'string' && UUID_RE.test(row.subscription_id)
    && typeof row.account_id === 'string' && UUID_RE.test(row.account_id)
    && isCount(row.subscription_generation) && isCount(row.record_version) && isCount(row.profile_generation)
    && isCount(row.lead_days) && LEADS.has(row.lead_days)
    && typeof row.audience_variant === 'string' && AUDIENCES.has(row.audience_variant)
    && typeof row.local_date === 'string' && DATE_RE.test(row.local_date)
    && typeof row.timezone === 'string' && row.timezone.length > 0
    && typeof row.scheduled_for === 'string' && Number.isFinite(Date.parse(row.scheduled_for));
}

export function buildSanskaraReminderCandidates(rows: SanskaraDueRow[], now: Date): SanskaraCandidateBuild {
  const candidates: NotificationCandidateInsert[] = [];
  let malformedCount = 0;
  let outsideHorizonCount = 0;

  for (const row of rows) {
    if (!isWellFormed(row)) { malformedCount += 1; continue; }

    const scheduledFor = new Date(row.scheduled_for);
    if (scheduledFor.getTime() > now.getTime() + SANSKARA_MAX_AHEAD_MS) { outsideHorizonCount += 1; continue; }

    // The reminder stays valid until the end of its own local day, so a late run still delivers it that day and never the next.
    const timezone = resolveTimeZone(row.timezone);
    const nextDay = shiftCivilDate(row.local_date, 1);
    const expiresAt = nextDay ? localTimeToUtc(nextDay, '00:00', timezone) : null;
    if (!expiresAt || expiresAt.getTime() <= Math.max(now.getTime(), scheduledFor.getTime())) { malformedCount += 1; continue; }

    const language = languageFor(row.language);
    const text = wordingText(language, 0, row.lead_days)!;
    candidates.push({
      user_id: row.account_id,
      event_type: SANSKARA_EVENT_TYPE,
      event_id: row.subscription_id,
      event_instance: `L${row.lead_days}`,
      local_date: row.local_date,
      audience_variant: row.audience_variant,
      scheduled_for: scheduledFor.toISOString(),
      expires_at: expiresAt.toISOString(),
      priority: 30,
      title: text.title,
      body: text.body,
      action_url: SANSKARA_ACTION_URL,
      language,
      timezone,
      tradition: null,
      calendar_profile: null,
      source_status: 'user_provided',
      source_refs: {},
      // Exactly the keys the insert trigger allows: opaque ids and the versions this reminder was prepared on.
      metadata: {
        subscription_id: row.subscription_id,
        subscription_generation: row.subscription_generation,
        record_version: row.record_version,
        profile_generation: row.profile_generation,
        local_date: row.local_date,
        timezone,
      },
    });
  }
  return { candidates, malformedCount, outsideHorizonCount };
}
