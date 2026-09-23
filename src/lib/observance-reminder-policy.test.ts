import { describe, expect, it } from "vitest";
import {
  buildObservanceReminderKey,
  decideObservanceReminder,
  type ObservanceReminderInput,
} from "./observance-reminder-policy";

const base: ObservanceReminderInput = {
  occurrence: {
    id: "occurrence-2026-01",
    slug: "sample-observance",
    date: "2026-10-02",
    tradition: "hindu",
    calendarProfile: "legacy-ujjain",
    sampradaya: null,
    audience: "general",
    sourceEligible: true,
  },
  preferences: {
    enabled: true,
    leadDays: [1, 7],
    tradition: "hindu",
    calendarProfile: "legacy-ujjain",
    sampradaya: null,
    audience: null,
  },
  daysAway: 1,
  localDate: "2026-10-01",
  notificationAudience: "general",
};

describe("observance reminder policy", () => {
  it("fails closed until the user has enabled observance reminders", () => {
    expect(decideObservanceReminder({ ...base, preferences: { ...base.preferences, enabled: false } }))
      .toMatchObject({ eligible: false, reason: "preference_disabled" });
  });

  it("requires a reviewed-source-qualified occurrence", () => {
    expect(decideObservanceReminder({ ...base, occurrence: { ...base.occurrence, sourceEligible: false } }))
      .toMatchObject({ eligible: false, reason: "content_not_reviewed" });
  });

  it("rejects mismatched tradition, calendar profile, and sampradaya", () => {
    expect(decideObservanceReminder({ ...base, preferences: { ...base.preferences, tradition: "sikh" } }))
      .toMatchObject({ eligible: false, reason: "tradition_not_applicable" });
    expect(decideObservanceReminder({ ...base, preferences: { ...base.preferences, calendarProfile: null } }))
      .toMatchObject({ eligible: false, reason: "calendar_profile_not_applicable" });
    expect(decideObservanceReminder({
      ...base,
      occurrence: { ...base.occurrence, sampradaya: "school-a" },
      preferences: { ...base.preferences, sampradaya: "school-b" },
    })).toMatchObject({ eligible: false, reason: "sampradaya_not_applicable" });
  });

  it("allows a genuinely shared occurrence without guessing a user's tradition", () => {
    expect(decideObservanceReminder({
      ...base,
      occurrence: { ...base.occurrence, tradition: "all", calendarProfile: null },
      preferences: { ...base.preferences, tradition: null, calendarProfile: null },
    })).toMatchObject({ eligible: true, budgetClass: "explicit_observance", budgetExempt: true });
  });

  it("requires explicit audience eligibility for women-focused content", () => {
    const womenFocused: ObservanceReminderInput = {
      ...base,
      occurrence: { ...base.occurrence, audience: "female" },
      notificationAudience: "female",
    };
    expect(decideObservanceReminder(womenFocused)).toMatchObject({ eligible: false, reason: "audience_not_applicable" });
    expect(decideObservanceReminder({
      ...womenFocused,
      preferences: { ...base.preferences, audience: "female" },
    })).toMatchObject({ eligible: true, budgetExempt: true });
  });

  it("does not accept unselected lead times or malformed civil dates", () => {
    expect(decideObservanceReminder({ ...base, daysAway: 3, localDate: "2026-09-29" }))
      .toMatchObject({ eligible: false, reason: "lead_time_not_selected" });
    expect(decideObservanceReminder({ ...base, localDate: "2026-02-30" }))
      .toMatchObject({ eligible: false, reason: "invalid_date_or_lead_time" });
    expect(decideObservanceReminder({ ...base, localDate: "2026-09-30" }))
      .toMatchObject({ eligible: false, reason: "invalid_date_or_lead_time" });
  });

  it("keeps lead time and audience in semantic identity, and rejects invalid keys", () => {
    const d1 = buildObservanceReminderKey({ occurrence: base.occurrence, daysAway: 1, localObservanceDate: "2026-10-02", audience: "general" });
    const d7 = buildObservanceReminderKey({ occurrence: base.occurrence, daysAway: 7, localObservanceDate: "2026-10-02", audience: "general" });
    const female = buildObservanceReminderKey({ occurrence: base.occurrence, daysAway: 1, localObservanceDate: "2026-10-02", audience: "female" });
    expect(new Set([d1, d7, female]).size).toBe(3);
    expect(buildObservanceReminderKey({ occurrence: { id: null, slug: null }, daysAway: 1, localObservanceDate: "2026-10-02", audience: "general" })).toBeNull();
  });

  it("explicitly exempts opted-in observances from engagement budgets", () => {
    const decision = decideObservanceReminder(base);
    if (!decision.eligible) throw new Error("Expected eligible observance reminder");
    expect(decision.budgetClass).toBe("explicit_observance");
    expect(decision.budgetExempt).toBe(true);
    expect(decision).not.toHaveProperty("dailyBudget");
  });
});
