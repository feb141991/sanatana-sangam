/**
 * Pure eligibility contract for the observance-first notification rollout.
 * This deliberately performs no database writes, scheduling, or delivery.
 * Source eligibility remains owned by observance-notification-source.ts.
 */

export type ObservanceAudience = "general" | "female";

export type ObservanceReminderOccurrence = {
  id: string | null;
  slug: string | null;
  date: string;
  tradition: string | null;
  calendarProfile: string | null;
  sampradaya: string | null;
  audience: ObservanceAudience;
  sourceEligible: boolean;
};

export type ObservanceReminderPreferences = {
  enabled: boolean;
  leadDays: readonly number[];
  tradition: string | null;
  calendarProfile: string | null;
  sampradaya: string | null;
  audience: "female" | "not_female" | null;
};

export type ObservanceReminderInput = {
  occurrence: ObservanceReminderOccurrence;
  preferences: ObservanceReminderPreferences;
  daysAway: number;
  localDate: string;
  notificationAudience: ObservanceAudience;
};

export type ObservanceReminderDecision =
  | {
      eligible: true;
      reason: "eligible";
      notificationKey: string;
      budgetClass: "explicit_observance";
      budgetExempt: true;
    }
  | {
      eligible: false;
      reason:
        | "preference_disabled"
        | "content_not_reviewed"
        | "lead_time_not_selected"
        | "tradition_not_applicable"
        | "calendar_profile_not_applicable"
        | "sampradaya_not_applicable"
        | "audience_not_applicable"
        | "invalid_date_or_lead_time";
    };

function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function keyPart(value: string): string {
  return encodeURIComponent(value.trim());
}

function civilDateDifference(laterDate: string, earlierDate: string): number {
  const later = Date.parse(`${laterDate}T00:00:00.000Z`);
  const earlier = Date.parse(`${earlierDate}T00:00:00.000Z`);
  return (later - earlier) / 86_400_000;
}

export function buildObservanceReminderKey(input: {
  occurrence: Pick<ObservanceReminderOccurrence, "id" | "slug">;
  daysAway: number;
  localObservanceDate: string;
  audience: ObservanceAudience;
}): string | null {
  const identity = input.occurrence.id ?? input.occurrence.slug;
  if (!identity || !isIsoDate(input.localObservanceDate) || !Number.isInteger(input.daysAway) || input.daysAway < 0) {
    return null;
  }

  return [
    "observance-v1",
    keyPart(identity),
    `d${input.daysAway}`,
    input.localObservanceDate,
    input.audience,
  ].join(":");
}

export function decideObservanceReminder(input: ObservanceReminderInput): ObservanceReminderDecision {
  const { occurrence, preferences } = input;
  if (!preferences.enabled) return { eligible: false, reason: "preference_disabled" };
  if (!occurrence.sourceEligible) return { eligible: false, reason: "content_not_reviewed" };
  if (!isIsoDate(occurrence.date) || !isIsoDate(input.localDate) || !Number.isInteger(input.daysAway) || input.daysAway < 0) {
    return { eligible: false, reason: "invalid_date_or_lead_time" };
  }
  if (civilDateDifference(occurrence.date, input.localDate) !== input.daysAway) {
    return { eligible: false, reason: "invalid_date_or_lead_time" };
  }
  if (!preferences.leadDays.includes(input.daysAway)) return { eligible: false, reason: "lead_time_not_selected" };

  if (occurrence.tradition && occurrence.tradition !== "all" && occurrence.tradition !== preferences.tradition) {
    return { eligible: false, reason: "tradition_not_applicable" };
  }
  if (occurrence.calendarProfile && occurrence.calendarProfile !== preferences.calendarProfile) {
    return { eligible: false, reason: "calendar_profile_not_applicable" };
  }
  if (occurrence.sampradaya && occurrence.sampradaya !== preferences.sampradaya) {
    return { eligible: false, reason: "sampradaya_not_applicable" };
  }
  if (input.notificationAudience !== occurrence.audience) {
    return { eligible: false, reason: "audience_not_applicable" };
  }
  if (occurrence.audience === "female" && preferences.audience !== "female") {
    return { eligible: false, reason: "audience_not_applicable" };
  }

  const notificationKey = buildObservanceReminderKey({
    occurrence,
    daysAway: input.daysAway,
    localObservanceDate: occurrence.date,
    audience: input.notificationAudience,
  });
  if (!notificationKey) return { eligible: false, reason: "invalid_date_or_lead_time" };

  return {
    eligible: true,
    reason: "eligible",
    notificationKey,
    budgetClass: "explicit_observance",
    budgetExempt: true,
  };
}
