import {
  decideObservanceReminder,
  type ObservanceAudience,
  type ObservanceReminderOccurrence,
} from "./observance-reminder-policy";
import {
  mapProfileToObservancePreferences,
  type ObservanceCategory,
} from "./observance-preferences";
import {
  computeObservanceSendInstant,
  shiftCivilDate,
} from "./observance-timing";
import {
  buildObservanceActionPath,
  isWomenFocusedVrat,
  type ReviewedObservance,
} from "./observance-notification-source";
import {
  getLocalHour,
  isHourInQuietWindow,
  resolveTimeZone,
} from "./sacred-time";

export type ObservanceProfile = {
  id: string;
  tradition: string | null;
  calendar_profile: string | null;
  sampradaya: string | null;
  gender_context: string | null;
  timezone: string | null;
  wants_festival_reminders: boolean | null;
  wants_vrat_reminders?: boolean | null;
  wants_tithi_reminders?: boolean | null;
  observance_reminder_lead_days?: number[] | null;
  observance_reminder_time?: string | null;
  notification_quiet_hours_start?: number | null;
  notification_quiet_hours_end?: number | null;
  is_deleting?: boolean | null;
};

export type ScheduledObservanceRow = {
  user_id: string;
  title: string;
  body: string;
  send_at: string;
  notification_type: "festival" | "vrat" | "tithi";
  status: "pending";
  metadata: {
    occurrence_id: string | null;
    slug: string | null;
    name: string;
    category: ObservanceCategory;
    type: ObservanceCategory;
    days_away: number;
    local_date: string;
    sent_timezone: string;
    action_url: string;
    emoji: string;
    tradition: string | null;
    sampradaya: string | null;
    calendar_profile: string | null;
    audience: ObservanceAudience;
    budget_class: "explicit_observance";
    budget_exempt: true;
  };
  notification_key: string;
  retry_count: number;
};

export type ObservanceScheduleResult = {
  candidates: ScheduledObservanceRow[];
  stats: {
    totalUsers: number;
    totalObservances: number;
    evaluatedCount: number;
    eligibleCount: number;
    skippedPastCount: number;
    skippedQuietHoursCount: number;
    suppressedReasons: Record<string, number>;
  };
};

function formatReminderTitle(
  name: string,
  emoji: string,
  category: ObservanceCategory,
  daysAway: number,
  audience: ObservanceAudience
): string {
  const prefix = emoji ? `${emoji} ` : "";
  if (category === "vrat") {
    if (daysAway === 0) return `${prefix}Today is ${name}`;
    if (daysAway === 1) return `${prefix}Tomorrow is ${name}`;
    return `${prefix}${name} — In ${daysAway} days`;
  }

  if (daysAway === 0) return `${prefix}${name} — Today!`;
  if (daysAway === 1) return `${prefix}${name} — Tomorrow!`;
  return `${prefix}${name} — In ${daysAway} days`;
}

function formatReminderBody(
  observance: ReviewedObservance,
  category: ObservanceCategory,
  daysAway: number,
  userTradition: string | null
): string {
  const desc = observance.description?.trim();
  if (daysAway === 0) {
    return desc || `May this auspicious day of ${observance.name} bring peace and grace.`;
  }
  if (daysAway === 1) {
    if (desc) return `${desc}. Prepare your sadhana and observance rhythm.`;
    return `Tomorrow is ${observance.name}. Set aside a little time to prepare well.`;
  }
  return `${observance.name} is coming up. Set aside time to remember and prepare.`;
}

export function generateObservanceScheduleCandidates(input: {
  users: ObservanceProfile[];
  observances: ReviewedObservance[];
  incompleteSeriesIds?: Set<string>;
  now: Date;
  categoryFilter?: ObservanceCategory | "all";
}): ObservanceScheduleResult {
  const {
    users,
    observances,
    incompleteSeriesIds = new Set<string>(),
    now,
    categoryFilter = "all",
  } = input;

  const candidates: ScheduledObservanceRow[] = [];
  const suppressedReasons: Record<string, number> = {};
  let evaluatedCount = 0;
  let skippedPastCount = 0;
  let skippedQuietHoursCount = 0;

  const recordSuppression = (reason: string) => {
    suppressedReasons[reason] = (suppressedReasons[reason] || 0) + 1;
  };

  for (const user of users) {
    if (user.is_deleting) {
      recordSuppression("account_deletion_pending");
      continue;
    }

    const tz = resolveTimeZone(user.timezone);
    const reminderTime = user.observance_reminder_time || "08:00";

    for (const observance of observances) {
      if (observance.id && incompleteSeriesIds.has(observance.id)) {
        recordSuppression("incomplete_series");
        continue;
      }

      const isVrat = observance.type === "vrat" || isWomenFocusedVrat(observance);
      const category: ObservanceCategory = isVrat ? "vrat" : "festival";

      if (categoryFilter !== "all" && category !== categoryFilter) {
        continue;
      }

      const preferences = mapProfileToObservancePreferences(user, category);
      if (!preferences.enabled) {
        recordSuppression(`preference_disabled_${category}`);
        continue;
      }

      const audience: ObservanceAudience = isWomenFocusedVrat(observance) ? "female" : "general";

      for (const daysAway of preferences.leadDays) {
        evaluatedCount++;

        const sendInstant = computeObservanceSendInstant(
          observance.date,
          daysAway,
          reminderTime,
          tz
        );

        if (!sendInstant) {
          recordSuppression("invalid_timing");
          continue;
        }

        if (sendInstant.isPast(now)) {
          skippedPastCount++;
          recordSuppression("send_instant_past");
          continue;
        }

        // Quiet hours check at scheduled local hour
        const sendHour = getLocalHour(sendInstant.sendAt, tz);
        const quietStart = user.notification_quiet_hours_start != null ? Number(user.notification_quiet_hours_start) : null;
        const quietEnd = user.notification_quiet_hours_end != null ? Number(user.notification_quiet_hours_end) : null;
        if (isHourInQuietWindow(sendHour, quietStart, quietEnd)) {
          skippedQuietHoursCount++;
          recordSuppression("quiet_hours_conflict");
          continue;
        }

        const policyOccurrence: ObservanceReminderOccurrence = {
          id: observance.id ? String(observance.id) : null,
          slug: observance.slug,
          date: observance.date,
          tradition: observance.tradition || "all",
          calendarProfile: (observance as any).calendar_profile || null,
          sampradaya: (observance as any).sampradaya || null,
          audience,
          sourceEligible: true,
        };

        const decision = decideObservanceReminder({
          occurrence: policyOccurrence,
          preferences,
          daysAway,
          localDate: sendInstant.localDate,
          notificationAudience: audience,
        });

        if (!decision.eligible) {
          recordSuppression(decision.reason);
          continue;
        }

        const actionPath = buildObservanceActionPath(observance);
        const title = formatReminderTitle(observance.name, observance.emoji, category, daysAway, audience);
        const body = formatReminderBody(observance, category, daysAway, preferences.tradition);

        candidates.push({
          user_id: user.id,
          title,
          body,
          send_at: sendInstant.sendAt.toISOString(),
          notification_type: category,
          status: "pending",
          metadata: {
            occurrence_id: policyOccurrence.id,
            slug: observance.slug,
            name: observance.name,
            category,
            type: category,
            days_away: daysAway,
            local_date: sendInstant.localDate,
            sent_timezone: tz,
            timezone: tz,
            action_url: actionPath,
            emoji: observance.emoji,
            tradition: policyOccurrence.tradition,
            sampradaya: policyOccurrence.sampradaya,
            calendar_profile: policyOccurrence.calendarProfile,
            audience,
            budget_class: "explicit_observance",
            budget_exempt: true,
          },
          notification_key: decision.notificationKey,
          retry_count: 0,
        });
      }
    }
  }

  return {
    candidates,
    stats: {
      totalUsers: users.length,
      totalObservances: observances.length,
      evaluatedCount,
      eligibleCount: candidates.length,
      skippedPastCount,
      skippedQuietHoursCount,
      suppressedReasons,
    },
  };
}
