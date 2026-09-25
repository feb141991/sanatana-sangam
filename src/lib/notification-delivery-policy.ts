type ScheduledNotificationRow = {
  notification_type?: string | null;
  notification_key?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type NotificationProfile = {
  wants_family_notifications?: boolean | null;
  wants_festival_reminders?: boolean | null;
  wants_vrat_reminders?: boolean | null;
  wants_tithi_reminders?: boolean | null;
  wants_sankalpa_midpoint_reminders?: boolean | null;
};

export function getNotificationPreferenceSkipReason(
  row: ScheduledNotificationRow,
  profile: NotificationProfile,
): string | null {
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
  if (notificationType === "sankalpa_midpoint") return "/sankalpa";
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
