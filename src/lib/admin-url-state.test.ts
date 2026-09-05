import { describe, it, expect } from "vitest";
import {
  parseAdminQueryParam,
  parseAdminStringParam,
  parseMonitoringTab,
  parseModerationFilter,
  parseCronTarget,
  buildAdminUrlWithParams,
  MONITORING_TABS,
  MODERATION_FILTERS,
} from "./admin-url-state";

describe("Admin URL-State Helpers (lib/admin-url-state.ts)", () => {
  describe("parseAdminQueryParam", () => {
    it("parses valid allowed values correctly", () => {
      const sp = new URLSearchParams("tab=telemetry&other=123");
      const result = parseAdminQueryParam(sp, "tab", MONITORING_TABS, "apis");
      expect(result).toBe("telemetry");
    });

    it("falls back safely on unknown / invalid values", () => {
      const sp = new URLSearchParams("tab=invalid_tab&other=123");
      const result = parseAdminQueryParam(sp, "tab", MONITORING_TABS, "apis");
      expect(result).toBe("apis");
    });

    it("returns null when missing and no fallback provided", () => {
      const sp = new URLSearchParams("other=123");
      const result = parseAdminQueryParam(sp, "tab", MONITORING_TABS);
      expect(result).toBeNull();
    });
  });

  describe("parseMonitoringTab (Alert Destination Deep Links)", () => {
    it("parses primary tab parameter", () => {
      const sp = new URLSearchParams("tab=errors");
      expect(parseMonitoringTab(sp)).toBe("errors");
    });

    it("parses legacy section alias from /api/admin/alerts (section=errors)", () => {
      const sp = new URLSearchParams("section=errors&fingerprint=fp-abc-123");
      expect(parseMonitoringTab(sp)).toBe("errors");
    });

    it("defaults safely to apis when invalid or omitted", () => {
      const sp = new URLSearchParams("section=unknown");
      expect(parseMonitoringTab(sp)).toBe("apis");
    });
  });


  describe("parseCronTarget (Routine and Job Deep Links)", () => {
    it("parses canonical routine parameter produced by Log Explorer", () => {
      const sp = new URLSearchParams("routine=brahma-muhurta");
      expect(parseCronTarget(sp)).toBe("brahma-muhurta");
    });

    it("parses legacy aliases job, cron, and route", () => {
      expect(parseCronTarget(new URLSearchParams("job=panchang-cache"))).toBe("panchang-cache");
      expect(parseCronTarget(new URLSearchParams("cron=festival-occurrences"))).toBe("festival-occurrences");
      expect(parseCronTarget(new URLSearchParams("route=%2Fapi%2Fcron%2Fmaterialize"))).toBe("/api/cron/materialize");
    });

    it("returns null when no cron target parameter exists or is blank", () => {
      expect(parseCronTarget(new URLSearchParams("other=value"))).toBeNull();
      expect(parseCronTarget(new URLSearchParams("routine=%20%20"))).toBeNull();
    });
  });

  describe("parseModerationFilter", () => {
    it("parses canonical moderation filter values", () => {
      const sp = new URLSearchParams("status=actioned");
      expect(parseModerationFilter(sp)).toBe("actioned");
    });

    it("maps legacy resolved status to reviewed", () => {
      const sp = new URLSearchParams("filter=resolved");
      expect(parseModerationFilter(sp)).toBe("reviewed");
    });

    it("falls back to all on empty or invalid filter", () => {
      const sp = new URLSearchParams("filter=junk");
      expect(parseModerationFilter(sp)).toBe("all");
    });
  });

  describe("parseAdminStringParam", () => {
    it("trims and returns valid non-empty strings", () => {
      const sp = new URLSearchParams("fingerprint=%20fp-999%20&slug=chhatrapati-shivaji");
      expect(parseAdminStringParam(sp, "fingerprint")).toBe("fp-999");
      expect(parseAdminStringParam(sp, "slug")).toBe("chhatrapati-shivaji");
    });

    it("returns null for empty whitespace-only strings", () => {
      const sp = new URLSearchParams("fingerprint=%20%20");
      expect(parseAdminStringParam(sp, "fingerprint")).toBeNull();
    });
  });

  describe("buildAdminUrlWithParams", () => {
    it("updates target parameter while preserving unrelated query parameters", () => {
      const original = "/admin/monitoring?section=errors&fingerprint=fp-123&keep=true";
      const updated = buildAdminUrlWithParams("/admin/monitoring", original, {
        tab: "telemetry",
        section: null, // removes section
      });

      expect(updated).toBe("/admin/monitoring?fingerprint=fp-123&keep=true&tab=telemetry");
    });

    it("removes parameter when passed null or empty string", () => {
      const original = "/admin/moderation?reportId=r-55&filter=pending";
      const updated = buildAdminUrlWithParams("/admin/moderation", original, {
        reportId: null,
      });

      expect(updated).toBe("/admin/moderation?filter=pending");
    });

    it("handles clean path without parameters", () => {
      const updated = buildAdminUrlWithParams("/admin/users", null, {
        segment: "pro",
      });
      expect(updated).toBe("/admin/users?segment=pro");
    });
  });
});
