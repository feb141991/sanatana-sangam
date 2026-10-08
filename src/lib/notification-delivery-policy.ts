type ScheduledNotificationRow = {
  notification_type?: string | null;
  notification_key?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type NotificationProfile = {
  is_deleting?: boolean | null;
  wants_family_notifications?: boolean | null;
  wants_family_remembrance_reminders?: boolean | null;
  wants_festival_reminders?: boolean | null;
  wants_vrat_reminders?: boolean | null;
  wants_tithi_reminders?: boolean | null;
  wants_shloka_reminders?: boolean | null;
  wants_nitya_reminders?: boolean | null;
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
    profile.japa_reminder_enabled !== true
  ) {
    return "japa_reminders_disabled";
  }

  // Quiz reminders are explicit opt-in and default-off. Recheck at delivery
  // so a row queued before opt-out cannot still be delivered.
  if (
    row.notification_type === "quiz" &&
    profile.quiz_reminder_enabled !== true
  ) {
    return "quiz_reminders_disabled";
  }

  if (
    row.notification_type === "shloka" &&
    profile.wants_shloka_reminders === false
  ) {
    return "shloka_reminders_disabled";
  }

  // Sattvic Mode and every Nitya slot are gated on the same opt-in at
  // scheduling time; recheck it at delivery so a user who turns it off after a
  // row was queued is not still sent that day's reminder. Only an explicit
  // `false` suppresses, matching how the producers read the flag.
  const type = row.notification_type ?? "";
  if (
    (type === "sattvic" || type === "sattvic_reminder" || type.startsWith("nitya")) &&
    profile.wants_nitya_reminders === false
  ) {
    return "nitya_reminders_disabled";
  }

  if (
    row.notification_type === "sankalpa_midpoint" &&
    profile.wants_sankalpa_midpoint_reminders !== true
  ) {
    return "sankalpa_midpoint_reminders_disabled";
  }

  if (
    row.notification_type === "sanskar_milestone" &&
    profile.wants_family_notifications !== true
  ) {
    return "family_notifications_disabled";
  }

  // A separate explicit opt-in. Missing/null fails closed during partial rollout.
  if (
    row.notification_type === "family_remembrance" &&
    profile.wants_family_remembrance_reminders !== true
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
