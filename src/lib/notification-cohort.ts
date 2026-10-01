/**
 * Notification cohorts, defined by explicit opt-in — not an imposed
 * demographic label. A cohort is "which reminder types has this devotee
 * actually turned on," never an inferred trait. Tradition, calendar
 * profile, language, and audience are a separate axis (content
 * eligibility: which variant of a notification's copy/date to serve),
 * already owned by observance-reminder-policy.ts / observance-preferences.ts
 * — this module does not duplicate that, it only adds the opt-in-cohort
 * grouping those files don't provide.
 */

export const NOTIFICATION_OPT_IN_TYPES = [
  'japa',
  'shloka',
  'nitya',
  'sankalpa_midpoint',
  'festival',
  'vrat',
  'tithi',
  'community',
  'family',
] as const;

export type NotificationOptInType = typeof NOTIFICATION_OPT_IN_TYPES[number];

export interface CohortProfileInput {
  is_deleting?: boolean | null;
  japa_reminder_enabled?: boolean | null;
  wants_shloka_reminders?: boolean | null;
  wants_nitya_reminders?: boolean | null;
  wants_sankalpa_midpoint_reminders?: boolean | null;
  wants_festival_reminders?: boolean | null;
  wants_vrat_reminders?: boolean | null;
  wants_tithi_reminders?: boolean | null;
  wants_community_notifications?: boolean | null;
  wants_family_notifications?: boolean | null;
}

export interface CohortClassification {
  /** Only types explicitly === true; absent/null/false are all "not opted in," never assumed on. */
  optedInto: NotificationOptInType[];
  /** False whenever opted into nothing, or the account requested deletion. */
  eligibleForAnyDelivery: boolean;
}

const OPT_IN_FIELD_BY_TYPE: Record<NotificationOptInType, keyof CohortProfileInput> = {
  japa: 'japa_reminder_enabled',
  shloka: 'wants_shloka_reminders',
  nitya: 'wants_nitya_reminders',
  sankalpa_midpoint: 'wants_sankalpa_midpoint_reminders',
  festival: 'wants_festival_reminders',
  vrat: 'wants_vrat_reminders',
  tithi: 'wants_tithi_reminders',
  community: 'wants_community_notifications',
  family: 'wants_family_notifications',
};

export function classifyCohort(profile: CohortProfileInput | null | undefined): CohortClassification {
  if (!profile) {
    return { optedInto: [], eligibleForAnyDelivery: false };
  }

  const optedInto = NOTIFICATION_OPT_IN_TYPES.filter(
    (type) => profile[OPT_IN_FIELD_BY_TYPE[type]] === true,
  );

  return {
    optedInto,
    eligibleForAnyDelivery: profile.is_deleting !== true && optedInto.length > 0,
  };
}

/**
 * Stable grouping key for a cohort -- the exact opt-in set, sorted, joined.
 * Two profiles with the same key have identical explicit opt-in needs; the
 * key carries no meaning beyond that (not a persona, not a tier).
 */
export function cohortKey(classification: CohortClassification): string {
  if (classification.optedInto.length === 0) return 'none';
  return [...classification.optedInto].sort().join('+');
}
