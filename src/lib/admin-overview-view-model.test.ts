import { describe, expect, it } from "vitest";
import type { UrgentAlertItem } from "@/app/api/admin/alerts/route";
import {
  allQueueCountsKnown,
  buildReviewQueues,
  formatOnboardingRate,
  formatUpdatedLabel,
  splitOverviewAlerts,
  totalOpenReviews,
} from "./admin-overview-view-model";

function alert(overrides: Partial<UrgentAlertItem> & Pick<UrgentAlertItem, "id" | "type">): UrgentAlertItem {
  return {
    title: overrides.id,
    desc: "",
    severity: "medium",
    href: "/admin",
    timestamp: "2026-11-14T00:00:00.000Z",
    ...overrides,
  };
}

describe("splitOverviewAlerts", () => {
  it("keeps platform alerts and drops the all-clear marker", () => {
    const { systemAlerts } = splitOverviewAlerts([
      alert({ id: "system-ok", type: "system" }),
      alert({ id: "client-err-crit-abc", type: "client_error" }),
      alert({ id: "mon-1", type: "monitoring" }),
      alert({ id: "apple-token-custody-not-configured", type: "system" }),
    ]);
    expect(systemAlerts.map((a) => a.id)).toEqual(["client-err-crit-abc", "mon-1", "apple-token-custody-not-configured"]);
  });

  it("does not list moderation or Dharm Veer queue items as alerts: the queue rows carry their totals", () => {
    const { systemAlerts, calendarFindingsCount } = splitOverviewAlerts([
      alert({ id: "report-1", type: "report", severity: "critical" }),
      alert({ id: "report-2", type: "report", severity: "critical" }),
      alert({ id: "dv-ram", type: "dharm_veer" }),
    ]);
    expect(systemAlerts).toEqual([]);
    expect(calendarFindingsCount).toBe(0);
  });

  it("counts calendar findings and keeps a failed-query diagnostic as a system alert, not a finding", () => {
    const { systemAlerts, calendarFindingsCount } = splitOverviewAlerts([
      alert({ id: "integrity-11", type: "integrity" }),
      alert({ id: "integrity-12", type: "integrity" }),
      alert({ id: "system-integrity-query-error", type: "integrity", severity: "high" }),
      alert({ id: "system-reports-query-error", type: "report", severity: "high" }),
    ]);
    expect(calendarFindingsCount).toBe(2);
    expect(systemAlerts.map((a) => a.id)).toEqual(["system-integrity-query-error", "system-reports-query-error"]);
  });
});

describe("buildReviewQueues", () => {
  it("puts queues with work first and keeps a stable order among ties", () => {
    const rows = buildReviewQueues({ pendingReports: 0, calendarFindings: 3, pendingDharmVeerReview: 2 });
    expect(rows.map((r) => r.id)).toEqual(["calendar", "dharm-veer", "reports"]);
  });

  it("puts an unknown count after queues with work but before empty ones, and never turns it into zero", () => {
    const rows = buildReviewQueues({ pendingReports: null, calendarFindings: 0, pendingDharmVeerReview: 1 });
    expect(rows.map((r) => r.id)).toEqual(["dharm-veer", "reports", "calendar"]);
    expect(rows.find((r) => r.id === "reports")?.count).toBeNull();
    expect(rows.find((r) => r.id === "reports")?.tone).toBe("neutral");
  });

  it("marks reported content as the most urgent queue and links each queue to its own workspace", () => {
    const rows = buildReviewQueues({ pendingReports: 4, calendarFindings: 1, pendingDharmVeerReview: 1 });
    expect(rows[0]).toMatchObject({ id: "reports", tone: "danger", href: "/admin/moderation" });
    expect(rows.find((r) => r.id === "calendar")?.href).toBe("/admin/calendar-governance?tab=integrity");
    expect(rows.find((r) => r.id === "dharm-veer")?.href).toBe("/admin/dharm-veer-review");
  });

  it("treats an unknown calendar count like any other unknown: after queues with work, never zero", () => {
    const rows = buildReviewQueues({ pendingReports: 0, calendarFindings: null, pendingDharmVeerReview: 2 });
    expect(rows.map((r) => r.id)).toEqual(["dharm-veer", "calendar", "reports"]);
    expect(rows.find((r) => r.id === "calendar")).toMatchObject({ count: null, tone: "neutral" });
  });

  it("is calm when every queue is empty", () => {
    const rows = buildReviewQueues({ pendingReports: 0, calendarFindings: 0, pendingDharmVeerReview: 0 });
    expect(rows.every((r) => r.tone === "neutral")).toBe(true);
    expect(rows.map((r) => r.id)).toEqual(["reports", "calendar", "dharm-veer"]);
  });
});

describe("totalOpenReviews", () => {
  it("sums the known queue counts", () => {
    const rows = buildReviewQueues({ pendingReports: 2, calendarFindings: 3, pendingDharmVeerReview: 1 });
    expect(totalOpenReviews(rows)).toBe(6);
  });

  it("ignores an unknown count rather than counting it as zero", () => {
    const rows = buildReviewQueues({ pendingReports: null, calendarFindings: 3, pendingDharmVeerReview: null });
    expect(totalOpenReviews(rows)).toBe(3);
  });

  it("is zero when the only known queue is empty, and unknown when no queue count is known", () => {
    const calendarOnly = buildReviewQueues({ pendingReports: null, calendarFindings: 0, pendingDharmVeerReview: null });
    expect(totalOpenReviews(calendarOnly)).toBe(0);

    const nothingKnown = calendarOnly.map((row) => ({ ...row, count: null }));
    expect(totalOpenReviews(nothingKnown)).toBeNull();
    expect(totalOpenReviews([])).toBeNull();
  });
});

describe("allQueueCountsKnown", () => {
  it("is true only when every queue has a real count, even if all of them are zero", () => {
    const empty = buildReviewQueues({ pendingReports: 0, calendarFindings: 0, pendingDharmVeerReview: 0 });
    expect(allQueueCountsKnown(empty)).toBe(true);
  });

  it("is false when any one count is unknown, so 'all clear' can never be claimed on partial data", () => {
    expect(allQueueCountsKnown(buildReviewQueues({ pendingReports: null, calendarFindings: 0, pendingDharmVeerReview: 0 }))).toBe(false);
    expect(allQueueCountsKnown(buildReviewQueues({ pendingReports: 0, calendarFindings: null, pendingDharmVeerReview: 0 }))).toBe(false);
    expect(allQueueCountsKnown(buildReviewQueues({ pendingReports: 0, calendarFindings: 0, pendingDharmVeerReview: null }))).toBe(false);
  });

  it("is false for no rows at all", () => {
    expect(allQueueCountsKnown([])).toBe(false);
  });
});

describe("formatOnboardingRate", () => {
  it("rounds to a whole percent", () => {
    expect(formatOnboardingRate(2, 3)).toBe("67%");
    expect(formatOnboardingRate(1, 3)).toBe("33%");
    expect(formatOnboardingRate(32, 32)).toBe("100%");
  });

  it("has no rate without seekers or with unusable numbers, and never exceeds 100", () => {
    expect(formatOnboardingRate(0, 0)).toBeNull();
    expect(formatOnboardingRate(5, -1)).toBeNull();
    expect(formatOnboardingRate(Number.NaN, 10)).toBeNull();
    expect(formatOnboardingRate(12, 10)).toBe("100%");
    expect(formatOnboardingRate(-3, 10)).toBe("0%");
  });
});

describe("formatUpdatedLabel", () => {
  it("shows local hours and minutes with leading zeros", () => {
    expect(formatUpdatedLabel(new Date(2026, 10, 14, 9, 5, 30))).toBe("Updated 09:05");
    expect(formatUpdatedLabel(new Date(2026, 10, 14, 21, 40, 0))).toBe("Updated 21:40");
  });

  it("says nothing before the first load or for an invalid date", () => {
    expect(formatUpdatedLabel(null)).toBeNull();
    expect(formatUpdatedLabel(new Date("not a date"))).toBeNull();
  });
});
