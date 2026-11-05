import type { NotificationCandidateInsert } from '@/types/database';
import { resolveTimeZone } from './sacred-time';
import { SANSKARA_ACTION_URL, SANSKARA_EVENT_TYPE, SANSKARA_MAX_AHEAD_MS } from './sanskara-reminder-candidate';
import { SANSKARA_HANDOVER_WORDINGS } from './sanskara-handover-candidate';

/**
 * Turns rows of `sanskara_early_approval_due()` into `notification_candidates`: the notice that tells the OTHER managers of a
 * child that an early hand-over is waiting for their agreement. Same event type as the milestone reminders and the hand-over notices,
 * a disjoint key space: `event_id` is the hand-over id and `event_instance` is `Eapproval` (a milestone reminder's starts with `L`, a
 * hand-over notice's with `H`). Design: docs/SANSKARA_HANDOVER_SCOPE.md section 3.
 *
 * Who is told is decided in SQL (a current manager who has not agreed, opted in, with consent); this file only shapes the rows. It never
 * receives the child's name or birth date or the starter's identity. The wording is the existing generic, reviewed hand-over wording: it
 * names no child, no relationship, no stage and no date. The insert trigger `sanskara_validate_early_approval_candidate` re-checks everything
 * at the instant of the insert, and the dispatcher re-checks `sanskara_early_approval_still_valid` immediately before sending.
 */

export const SANSKARA_EARLY_APPROVAL_INSTANCE = 'Eapproval';

/** How long the notice stays deliverable after it is due. Past this it is no longer news and is dropped by the pipeline. */
const NOTICE_LIFETIME_MS = 12 * 60 * 60 * 1000;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** One row of `sanskara_early_approval_due()`, as PostgREST returns it. */
export type SanskaraEarlyApprovalDueRow = {
  handover_id: string;
  account_id: string;
  profile_generation: number;
  local_date: string;
  scheduled_for: string;
  timezone: string;
  language: string | null;
  quiet_hours_start: number | null;
  quiet_hours_end: number | null;
};

export type SanskaraEarlyApprovalBuild = {
  candidates: NotificationCandidateInsert[];
  malformedCount: number;
  outsideHorizonCount: number;
};

type Language = 'en' | 'hi' | 'pa';

function languageFor(value: string | null): Language {
  const language = value?.trim().toLowerCase();
  return language === 'hi' || language === 'pa' ? language : 'en';
}

function isWellFormed(row: SanskaraEarlyApprovalDueRow): boolean {
  return typeof row.handover_id === 'string' && UUID_RE.test(row.handover_id)
    && typeof row.account_id === 'string' && UUID_RE.test(row.account_id)
    && typeof row.profile_generation === 'number' && Number.isInteger(row.profile_generation) && row.profile_generation >= 0
    && typeof row.local_date === 'string' && DATE_RE.test(row.local_date)
    && typeof row.timezone === 'string' && row.timezone.length > 0
    && typeof row.scheduled_for === 'string' && Number.isFinite(Date.parse(row.scheduled_for));
}

export function buildSanskaraEarlyApprovalCandidates(rows: SanskaraEarlyApprovalDueRow[], now: Date): SanskaraEarlyApprovalBuild {
  const candidates: NotificationCandidateInsert[] = [];
  let malformedCount = 0;
  let outsideHorizonCount = 0;

  for (const row of rows) {
    if (!isWellFormed(row)) { malformedCount += 1; continue; }

    const scheduledFor = new Date(row.scheduled_for);
    if (scheduledFor.getTime() > now.getTime() + SANSKARA_MAX_AHEAD_MS) { outsideHorizonCount += 1; continue; }

    const expiresAt = new Date(Math.max(now.getTime(), scheduledFor.getTime()) + NOTICE_LIFETIME_MS);
    const timezone = resolveTimeZone(row.timezone);
    const language = languageFor(row.language);
    const wording = SANSKARA_HANDOVER_WORDINGS[language][0];
    candidates.push({
      user_id: row.account_id,
      event_type: SANSKARA_EVENT_TYPE,
      event_id: row.handover_id,
      event_instance: SANSKARA_EARLY_APPROVAL_INSTANCE,
      local_date: row.local_date,
      audience_variant: 'manager',
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
        handover_id: row.handover_id,
        profile_generation: row.profile_generation,
        local_date: row.local_date,
        timezone,
      },
    });
  }
  return { candidates, malformedCount, outsideHorizonCount };
}
