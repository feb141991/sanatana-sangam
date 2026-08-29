type ScheduledNotificationRow = {
  notification_type?: string | null;
  notification_key?: string | null;
  metadata?: Record<string, unknown> | null;
};

type NotificationProfile = {
  wants_family_notifications?: boolean | null;
};

export function getNotificationPreferenceSkipReason(
  row: ScheduledNotificationRow,
  profile: NotificationProfile,
): string | null {
  if (
    row.notification_type === "sanskar_milestone" &&
    profile.wants_family_notifications !== true
  ) {
    return "family_notifications_disabled";
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
  if (notificationType === "sattvic_reminder") return "/bhakti/zen";
  if (notificationType.startsWith("nitya")) return "/nitya-karma";
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

  return data;
}
