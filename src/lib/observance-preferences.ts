import type { ObservanceReminderPreferences } from './observance-reminder-policy';

export type ObservanceCategory = 'festival' | 'vrat' | 'tithi';

export type ProfilePreferenceInput = {
  tradition?: string | null;
  calendar_profile?: string | null;
  sampradaya?: string | null;
  gender_context?: string | null;
  wants_festival_reminders?: boolean | null;
  wants_vrat_reminders?: boolean | null;
  wants_tithi_reminders?: boolean | null;
  observance_reminder_lead_days?: number[] | null;
  observance_reminder_time?: string | null;
};

export const TIME_FORMAT_RE = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;
export const DEFAULT_LEAD_DAYS: readonly number[] = [1, 7];
export const DEFAULT_REMINDER_TIME = '08:00';

export function isValidObservanceReminderTime(value: unknown): value is string {
  return typeof value === 'string' && TIME_FORMAT_RE.test(value);
}

export function sanitizeObservanceLeadDays(value: unknown): number[] | null {
  if (!Array.isArray(value)) return null;
  const filtered = value.filter((v): v is number => Number.isInteger(v) && v >= 0 && v <= 30);
  if (filtered.length === 0 && value.length > 0) return null;
  return [...new Set(filtered)].sort((a, b) => a - b);
}

export function mapProfileToObservancePreferences(
  profile: ProfilePreferenceInput | null | undefined,
  category: ObservanceCategory
): ObservanceReminderPreferences {
  if (!profile) {
    return {
      enabled: false,
      leadDays: DEFAULT_LEAD_DAYS,
      tradition: null,
      calendarProfile: null,
      sampradaya: null,
      audience: null,
    };
  }

  let enabled = false;
  switch (category) {
    case 'festival':
      enabled = profile.wants_festival_reminders === true;
      break;
    case 'vrat':
      enabled = profile.wants_vrat_reminders === true;
      break;
    case 'tithi':
      enabled = profile.wants_tithi_reminders === true;
      break;
  }

  const validLeadDays = sanitizeObservanceLeadDays(profile.observance_reminder_lead_days);
  // An explicitly empty array means the user disabled every reminder offset;
  // only a missing/invalid field falls back to the documented defaults.
  const leadDays = validLeadDays ?? DEFAULT_LEAD_DAYS;

  const audience = profile.gender_context === 'female' ? 'female' : 'not_female';

  return {
    enabled,
    leadDays,
    tradition: profile.tradition ?? null,
    calendarProfile: profile.calendar_profile ?? null,
    sampradaya: profile.sampradaya ?? null,
    audience,
  };
}
