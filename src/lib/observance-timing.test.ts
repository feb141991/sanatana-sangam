import { describe, expect, it } from "vitest";
import {
  computeObservanceSendInstant,
  localTimeToUtc,
  shiftCivilDate,
} from "./observance-timing";

describe("observance-timing", () => {
  describe("shiftCivilDate", () => {
    it("correctly shifts dates backwards and forwards", () => {
      expect(shiftCivilDate("2026-10-20", -1)).toBe("2026-10-19");
      expect(shiftCivilDate("2026-10-20", -7)).toBe("2026-10-13");
      expect(shiftCivilDate("2026-10-20", 0)).toBe("2026-10-20");
      expect(shiftCivilDate("2026-10-20", 5)).toBe("2026-10-25");
    });

    it("handles month and leap year boundaries correctly", () => {
      expect(shiftCivilDate("2026-03-01", -1)).toBe("2026-02-28");
      // 2028 is a leap year
      expect(shiftCivilDate("2028-03-01", -1)).toBe("2028-02-29");
      expect(shiftCivilDate("2026-01-01", -1)).toBe("2025-12-31");
    });

    it("fails safe for invalid ISO date strings", () => {
      expect(shiftCivilDate("invalid", -1)).toBeNull();
      expect(shiftCivilDate("2026-13-45", -1)).toBeNull();
    });
  });

  describe("localTimeToUtc", () => {
    it("converts IST (+05:30) correctly to UTC", () => {
      const utc = localTimeToUtc("2026-10-20", "08:00", "Asia/Kolkata");
      expect(utc?.toISOString()).toBe("2026-10-20T02:30:00.000Z");
    });

    it("converts UTC time with zero offset", () => {
      const utc = localTimeToUtc("2026-10-20", "08:00", "UTC");
      expect(utc?.toISOString()).toBe("2026-10-20T08:00:00.000Z");
    });

    it("accounts for DST in America/New_York (EDT UTC-4 vs EST UTC-5)", () => {
      // July = Daylight Saving Time (UTC-4)
      const edt = localTimeToUtc("2026-07-01", "08:00", "America/New_York");
      expect(edt?.toISOString()).toBe("2026-07-01T12:00:00.000Z");

      // December = Standard Time (UTC-5)
      const est = localTimeToUtc("2026-12-01", "08:00", "America/New_York");
      expect(est?.toISOString()).toBe("2026-12-01T13:00:00.000Z");
    });

    it("accounts for DST in Europe/London (BST UTC+1 vs GMT UTC+0)", () => {
      // June = British Summer Time (UTC+1)
      const bst = localTimeToUtc("2026-06-15", "09:00", "Europe/London");
      expect(bst?.toISOString()).toBe("2026-06-15T08:00:00.000Z");

      // January = Greenwich Mean Time (UTC+0)
      const gmt = localTimeToUtc("2026-01-15", "09:00", "Europe/London");
      expect(gmt?.toISOString()).toBe("2026-01-15T09:00:00.000Z");
    });

    it("returns null for malformed date or time", () => {
      expect(localTimeToUtc("invalid", "08:00", "UTC")).toBeNull();
      expect(localTimeToUtc("2026-10-20", "25:00", "UTC")).toBeNull();
      expect(localTimeToUtc("2026-10-20", "invalid", "UTC")).toBeNull();
    });
  });

  describe("computeObservanceSendInstant", () => {
    it("computes D-1, D-7, and D0 send instants with local dates", () => {
      const d1 = computeObservanceSendInstant("2026-11-08", 1, "08:00", "Asia/Kolkata");
      expect(d1?.localDate).toBe("2026-11-07");
      expect(d1?.sendAt.toISOString()).toBe("2026-11-07T02:30:00.000Z");

      const d7 = computeObservanceSendInstant("2026-11-08", 7, "08:00", "Asia/Kolkata");
      expect(d7?.localDate).toBe("2026-11-01");
      expect(d7?.sendAt.toISOString()).toBe("2026-11-01T02:30:00.000Z");

      const d0 = computeObservanceSendInstant("2026-11-08", 0, "08:00", "Asia/Kolkata");
      expect(d0?.localDate).toBe("2026-11-08");
      expect(d0?.sendAt.toISOString()).toBe("2026-11-08T02:30:00.000Z");
    });

    it("correctly indicates if the instant is in the past", () => {
      const instant = computeObservanceSendInstant("2026-11-08", 1, "08:00", "Asia/Kolkata");
      expect(instant).not.toBeNull();
      expect(instant!.isPast(new Date("2026-11-06T00:00:00Z"))).toBe(false);
      expect(instant!.isPast(new Date("2026-11-07T02:30:00.000Z"))).toBe(true);
      expect(instant!.isPast(new Date("2026-11-07T03:00:00.000Z"))).toBe(true);
    });

    it("returns null for negative or non-integer lead days", () => {
      expect(computeObservanceSendInstant("2026-11-08", -1, "08:00", "UTC")).toBeNull();
      expect(computeObservanceSendInstant("2026-11-08", 1.5, "08:00", "UTC")).toBeNull();
    });
  });
});
