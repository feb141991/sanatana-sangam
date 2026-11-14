import { describe, expect, it } from "vitest";
import { buildSeekerTrend, describeNewThisMonth, seekerTrendWindowStart } from "./admin-seeker-trend";

const NOW = new Date("2026-11-14T10:00:00.000Z");

describe("buildSeekerTrend", () => {
  it("returns twelve months, oldest first, ending with the current month", () => {
    const trend = buildSeekerTrend([], NOW);
    expect(trend.months).toHaveLength(12);
    expect(trend.months[0]).toMatchObject({ key: "2025-12", label: "DEC" });
    expect(trend.months[11]).toMatchObject({ key: "2026-11", label: "NOV" });
  });

  it("counts a signup in its own UTC month and zero-fills the others (a month with no signups is a real zero)", () => {
    const trend = buildSeekerTrend(["2026-11-01T00:00:00.000Z", "2026-11-13T09:00:00.000Z", "2026-09-30T23:59:59.000Z"], NOW);
    const byKey = Object.fromEntries(trend.months.map((m) => [m.key, m.count]));
    expect(byKey["2026-11"]).toBe(2);
    expect(byKey["2026-09"]).toBe(1);
    expect(byKey["2026-10"]).toBe(0);
    expect(trend.thisMonth).toBe(2);
    expect(trend.lastMonth).toBe(0);
  });

  it("puts the instant either side of a UTC month boundary in different months, whatever the local zone", () => {
    const trend = buildSeekerTrend(["2026-10-31T23:59:59.999Z", "2026-11-01T00:00:00.000Z"], NOW);
    expect(trend.months.find((m) => m.key === "2026-10")?.count).toBe(1);
    expect(trend.months.find((m) => m.key === "2026-11")?.count).toBe(1);
  });

  it("ignores rows older than the window, newer than now's month, empty, or not dates", () => {
    const trend = buildSeekerTrend(
      ["2025-11-30T00:00:00.000Z", "2026-12-01T00:00:00.000Z", "", null, undefined, "not a date"],
      NOW,
    );
    expect(trend.months.reduce((sum, m) => sum + m.count, 0)).toBe(0);
  });

  it("crosses a year boundary with the right labels", () => {
    const trend = buildSeekerTrend(["2026-01-15T00:00:00.000Z", "2025-12-15T00:00:00.000Z"], new Date("2026-01-20T00:00:00.000Z"), 3);
    expect(trend.months.map((m) => m.key)).toEqual(["2025-11", "2025-12", "2026-01"]);
    expect(trend.months.map((m) => m.count)).toEqual([0, 1, 1]);
  });

  it("carries the truncation flag and has no last month for a one-month window", () => {
    expect(buildSeekerTrend([], NOW, 12, true).truncated).toBe(true);
    const one = buildSeekerTrend(["2026-11-02T00:00:00.000Z"], NOW, 1);
    expect(one.lastMonth).toBeNull();
    expect(one.thisMonth).toBe(1);
  });
});

describe("seekerTrendWindowStart", () => {
  it("is the first instant of the oldest month in the window", () => {
    expect(seekerTrendWindowStart(NOW)).toBe("2025-12-01T00:00:00.000Z");
    expect(seekerTrendWindowStart(new Date("2026-01-20T00:00:00.000Z"), 3)).toBe("2025-11-01T00:00:00.000Z");
  });
});

describe("describeNewThisMonth", () => {
  it("says what happened this month, and says nothing when the trend is unknown", () => {
    expect(describeNewThisMonth(buildSeekerTrend(["2026-11-02T00:00:00.000Z"], NOW))).toBe("1 new this month");
    expect(describeNewThisMonth(buildSeekerTrend([], NOW))).toBe("No new seekers this month");
    expect(describeNewThisMonth(null)).toBeNull();
  });
});
