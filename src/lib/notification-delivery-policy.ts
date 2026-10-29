import { getLocalHour, isHourInQuietWindow, resolveTimeZone } from "./sacred-time";

type ScheduledNotificationRow = {
  notification_type?: string | null;
  notification_key?: string | null;
  metadata?: Record<string, unknown> | null;
};

/**
 * Night window applied when a user has not set their own quiet hours.
 * Native mirrors these hours in lib/reminderTime.ts to label night-time picks.
 */
export const DEFAULT_QUIET_HOURS = { startHour: 22, endHour: 6 } as const;

/**
 * Types sent at a time the user chose (Japa, quiz, family remembrance, and
 * observance reminders at observance_reminder_time) or explicitly opted into
 * as a night-time push (Brahma Muhurta). The default night window does not
 * override that choice; a quiet window the user set still does.
 */
const USER_TIMED_NOTIFICATION_TYPES: ReadonlySet<string> = new Set([
  "japa",
  "quiz",
  "family_remembrance",
  "festival",
  "vrat",
  "tithi",
  "brahma_muhurta",
]);

export type QuietHoursProfile = {
  timezone?: string | null;
  notification_quiet_hours_start?: number | string | null;
  notification_quiet_hours_end?: number | string | null;
};

function toQuietHour(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const hour = Number(value);
  return Number.isInteger(hour) && hour >= 0 && hour <= 23 ? hour : null;
}

/**
 * Delivery-time quiet-hours gate. A user-set window applies to every type.
 * Without one, DEFAULT_QUIET_HOURS applies to every type except
 * USER_TIMED_NOTIFICATION_TYPES.
 */
export function getQuietHoursSkipReason(
  row: ScheduledNotificationRow,
  profile: QuietHoursProfile,
  now: Date,
): "quiet_hours_active" | "default_quiet_hours" | null {
  const localHour = getLocalHour(now, resolveTimeZone(profile.timezone));
  const quietStart = toQuietHour(profile.notification_quiet_hours_start);
  const quietEnd = toQuietHour(profile.notification_quiet_hours_end);

  if (quietStart !== null && quietEnd !== null) {
    return isHourInQuietWindow(localHour, quietStart, quietEnd) ? "quiet_hours_active" : null;
  }

  if (USER_TIMED_NOTIFICATION_TYPES.has(row.notification_type ?? "")) return null;

  return isHourInQuietWindow(localHour, DEFAULT_QUIET_HOURS.startHour, DEFAULT_QUIET_HOURS.endHour)
    ? "default_quiet_hours"
    : null;
}

export type NotificationProfile = {
  is_deleting?: boolean | null;
  wants_brahma_muhurta_reminders?: boolean | null;
  wants_family_notifications?: boolean | null;
  wants_family_remembrance_reminders?: boolean | null;
  wants_festival_reminders?: boolean | null;
  wants_vrat_reminders?: boolean | null;
  wants_tithi_reminders?: boolean | null;
  wants_shloka_reminders?: boolean | null;
  wants_nitya_reminders?: boolean | null;
  wants_sattvic_reminders?: boolean | null;
  wants_mood_reminders?: boolean | null;
  wants_evening_reminder?: boolean | null;
  wants_madhyahn_reminder?: boolean | null;
  dharm_veer_reminder_enabled?: boolean | null;
  wants_sankalpa_midpoint_reminders?: boolean | null;
  japa_reminder_enabled?: boolean | null;
  quiz_reminder_enabled?: boolean | null;
};

export function getNotificationPreferenceSkipReason(
  row: ScheduledNotificationRow,
  profile: NotificationProfile,
): string | null {
  if (profile.is_deleting === true) {
    return "account_deletion_pending";
  }

  if (
    row.notification_type === "japa" &&
    profile.japa_reminder_enabled === false
  ) {
    return "japa_reminders_disabled";
  }

  if (
    row.notification_type === "brahma_muhurta" &&
    profile.wants_brahma_muhurta_reminders === false
  ) {
    return "brahma_muhurta_reminders_disabled";
  }

  // Quiz reminders are default-on. Recheck at delivery so a user who turned it off
  // after a row was queued is not sent the reminder.
  if (
    row.notification_type === "quiz" &&
    profile.quiz_reminder_enabled === false
  ) {
    return "quiz_reminders_disabled";
  }

  if (
    row.notification_type === "shloka" &&
    profile.wants_shloka_reminders === false
  ) {
    return "shloka_reminders_disabled";
  }

  // Recheck the feature's own preference, including rows queued before an
  // opt-out. These categories must not inherit the morning Nitya toggle.
  const type = row.notification_type ?? "";
  const independentPreferences: Record<string, keyof NotificationProfile> = {
    sattvic: 'wants_sattvic_reminders',
    sattvic_reminder: 'wants_sattvic_reminders',
    mood: 'wants_mood_reminders',
    mood_checkin: 'wants_mood_reminders',
    nitya_sandhya: 'wants_evening_reminder',
    nitya_madhyahn: 'wants_madhyahn_reminder',
    dharm_veer: 'dharm_veer_reminder_enabled',
  };
  const independentPreference = independentPreferences[type];
  if (independentPreference) {
    return profile[independentPreference] === false ? `${type}_reminders_disabled` : null;
  }
  if (
    type.startsWith("nitya") &&
    profile.wants_nitya_reminders === false
  ) {
    return "nitya_reminders_disabled";
  }

  if (
    row.notification_type === "sankalpa_midpoint" &&
    profile.wants_sankalpa_midpoint_reminders === false
  ) {
    return "sankalpa_midpoint_reminders_disabled";
  }

  if (
    row.notification_type === "sanskar_milestone" &&
    profile.wants_family_notifications === false
  ) {
    return "family_notifications_disabled";
  }

  if (
    row.notification_type === "family_remembrance" &&
    profile.wants_family_remembrance_reminders === false
  ) {
    return "family_remembrance_reminders_disabled";
  }

  if (
    row.notification_type === "festival" &&
    profile.wants_festival_reminders === false
  ) {
    return "festival_reminders_disabled";
  }

  if (
    row.notification_type === "vrat" &&
    profile.wants_vrat_reminders === false
  ) {
    return "vrat_reminders_disabled";
  }

  if (
    row.notification_type === "tithi" &&
    profile.wants_tithi_reminders === false
  ) {
    return "tithi_reminders_disabled";
  }

  return null;
}

export function getScheduledNotificationActionPath(row: ScheduledNotificationRow): string {
  const metadataAction = row.metadata?.action_url;
  if (typeof metadataAction === "string" && metadataAction.startsWith("/")) {
    return metadataAction;
  }

  const notificationType = row.notification_type ?? "generic";
  if (notificationType === "sanskar_milestone") return "/kul/sanskara";
  if (notificationType === "family_remembrance") return "/kul?section=family";
  if (notificationType === "sankalpa_midpoint") return "/sankalpa";
  if (notificationType === "shloka") return "/home?focus=shloka";
  if (notificationType === "quiz") return "/quiz";
  if (notificationType === "sattvic_reminder") return "/bhakti/zen";
  if (notificationType.startsWith("nitya")) return "/nitya-karma";
  if (notificationType === "festival" || notificationType === "tithi") return "/panchang";
  if (notificationType === "vrat") return "/vrat";
  return "/discover/mood";
}

export function getScheduledNotificationPushData(
  row: ScheduledNotificationRow,
): Record<string, string> {
  const metadata = row.metadata ?? {};
  const data: Record<string, string> = {
    type: row.notification_type ?? "generic",
    notification_key: row.notification_key ?? "",
  };

  if (row.notification_type === "sanskar_milestone") {
    data.sanskara_id = String(metadata.sanskara_id ?? "");
    data.kul_member_id = String(metadata.kul_member_id ?? "");
  }

  if (row.notification_type === "sankalpa_midpoint") {
    data.sankalpa_id = String(metadata.sankalpa_id ?? "");
  }

  if (
    row.notification_type === "festival" ||
    row.notification_type === "vrat" ||
    row.notification_type === "tithi"
  ) {
    data.festival_id = String(metadata.occurrence_id ?? metadata.slug ?? "");
    data.slug = String(metadata.slug ?? "");
    data.category = String(metadata.category ?? row.notification_type);
    data.days_away = String(metadata.days_away ?? "");
    if (row.notification_type === "vrat") {
      data.vrat_id = String(metadata.occurrence_id ?? metadata.slug ?? "");
    }
  }

  return data;
}
