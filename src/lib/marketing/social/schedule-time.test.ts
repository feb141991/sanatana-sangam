import { describe, it, expect } from "vitest";
import { zonedTimeToUtcIso, localDateInZone } from "./schedule-time";

describe("zonedTimeToUtcIso", () => {
  it("converts IST (UTC+5:30, no DST) correctly", () => {
    const iso = zonedTimeToUtcIso("2026-09-25", "09:00", "Asia/Kolkata");
    expect(iso).toBe(new Date("2026-09-25T03:30:00.000Z").toISOString());
  });

  it("converts US Eastern during daylight saving (UTC-4)", () => {
    const iso = zonedTimeToUtcIso("2026-07-04", "09:00", "America/New_York");
    expect(iso).toBe(new Date("2026-07-04T13:00:00.000Z").toISOString());
  });

  it("converts US Eastern during standard time (UTC-5)", () => {
    const iso = zonedTimeToUtcIso("2026-01-15", "09:00", "America/New_York");
    expect(iso).toBe(new Date("2026-01-15T14:00:00.000Z").toISOString());
  });

  it("throws on malformed input", () => {
    expect(() => zonedTimeToUtcIso("not-a-date", "09:00", "Asia/Kolkata")).toThrow();
  });
});

describe("localDateInZone", () => {
  it("returns the local calendar date, which can differ from the UTC date", () => {
    // 2026-09-25T02:00:00Z is still 2026-09-24 evening in New York (UTC-4).
    const instant = new Date("2026-09-25T02:00:00.000Z");
    expect(localDateInZone(instant, "America/New_York")).toBe("2026-09-24");
    expect(localDateInZone(instant, "Asia/Kolkata")).toBe("2026-09-25");
  });
});
