import { describe, it, expect } from "vitest";
import {
  parseMonitoringTab,
  parseModerationFilter,
  parseCronTarget,
  parseAdminStringParam,
  parseAdminQueryParam,
  buildAdminUrlWithParams,
  MONITORING_TABS,
  MODERATION_FILTERS,
  CALENDAR_GOVERNANCE_TABS,
} from "./admin-url-state";

describe("Admin Destinations Contract Tests (Prompt 1)", () => {
  describe("1. Monitoring Destination URL Contract", () => {
    it("resolves direct tab names accurately", () => {
      for (const tab of MONITORING_TABS) {
        const sp = new URLSearchParams(`tab=${tab}`);
        expect(parseMonitoringTab(sp)).toBe(tab);
      }
    });

    it("resolves legacy section alias produced by /api/admin/alerts", () => {
      const sp = new URLSearchParams("section=errors&fingerprint=fp_test_999");
      expect(parseMonitoringTab(sp)).toBe("errors");
      expect(parseAdminStringParam(sp, "fingerprint")).toBe("fp_test_999");
    });

    it("extracts requestId and severity for telemetry filtering", () => {
      const sp = new URLSearchParams("tab=telemetry&requestId=req-abc-123&severity=P1");
      expect(parseMonitoringTab(sp)).toBe("telemetry");
      expect(parseAdminStringParam(sp, "requestId")).toBe("req-abc-123");
      expect(parseAdminQueryParam(sp, "severity", ["all", "P1", "P2", "info"] as const)).toBe("P1");
    });

    it("safely defaults on invalid tab and malformed queries", () => {
      const sp = new URLSearchParams("tab=hacked_tab&section=unknown_sec");
      expect(parseMonitoringTab(sp, "apis")).toBe("apis");
      expect(parseAdminStringParam(sp, "fingerprint")).toBeNull();
    });
  });

  describe("2. Moderation Destination URL Contract", () => {
    it("resolves reportId from canonical reportId parameter", () => {
      const sp = new URLSearchParams("reportId=rep-123-xyz");
      const reportId = parseAdminStringParam(sp, "reportId") || parseAdminStringParam(sp, "report");
      expect(reportId).toBe("rep-123-xyz");
    });

    it("resolves reportId from legacy report parameter alias", () => {
      const sp = new URLSearchParams("report=rep-456-legacy");
      const reportId = parseAdminStringParam(sp, "reportId") || parseAdminStringParam(sp, "report");
      expect(reportId).toBe("rep-456-legacy");
    });

    it("resolves all canonical moderation statuses", () => {
      for (const status of MODERATION_FILTERS) {
        const sp = new URLSearchParams(`filter=${status}`);
        expect(parseModerationFilter(sp)).toBe(status);
      }
    });

    it("maps invalid legacy resolved status to canonical reviewed status", () => {
      const sp = new URLSearchParams("filter=resolved");
      expect(parseModerationFilter(sp)).toBe("reviewed");
    });

    it("defaults safely to all on invalid filter", () => {
      const sp = new URLSearchParams("filter=bad_filter");
      expect(parseModerationFilter(sp, "all")).toBe("all");
    });
  });

  describe("3. Calendar Governance Destination URL Contract", () => {
    it("parses findingId and alias finding", () => {
      const sp1 = new URLSearchParams("findingId=find-777&slug=diwali&year=2026");
      const finding1 = parseAdminStringParam(sp1, "findingId") || parseAdminStringParam(sp1, "finding");
      expect(finding1).toBe("find-777");
      expect(parseAdminStringParam(sp1, "slug")).toBe("diwali");
      expect(parseAdminStringParam(sp1, "year")).toBe("2026");

      const sp2 = new URLSearchParams("finding=find-888");
      const finding2 = parseAdminStringParam(sp2, "findingId") || parseAdminStringParam(sp2, "finding");
      expect(finding2).toBe("find-888");
    });

    it("parses calendar governance tab values safely", () => {
      const sp = new URLSearchParams("tab=integrity");
      expect(parseAdminQueryParam(sp, "tab", CALENDAR_GOVERNANCE_TABS, "coverage")).toBe("integrity");
    });
  });

  describe("4. Dharm Veer Review Destination URL Contract", () => {
    it("parses hero slug parameter accurately", () => {
      const sp = new URLSearchParams("slug=chhatrapati-shivaji-maharaj");
      expect(parseAdminStringParam(sp, "slug")).toBe("chhatrapati-shivaji-maharaj");
    });

    it("returns null on empty slug", () => {
      const sp = new URLSearchParams("slug=%20%20");
      expect(parseAdminStringParam(sp, "slug")).toBeNull();
    });
  });

  describe("5. Cron Dashboard Destination URL Contract", () => {
    it("parses routine parameter produced by Log Explorer correlation links", () => {
      const sp = new URLSearchParams("routine=materialize-occurrences");
      expect(parseCronTarget(sp)).toBe("materialize-occurrences");
    });

    it("parses job, cron, and route target parameters", () => {
      const sp1 = new URLSearchParams("job=notification-dispatch");
      const target1 = parseAdminStringParam(sp1, "job") || parseAdminStringParam(sp1, "cron");
      expect(target1).toBe("notification-dispatch");

      const sp2 = new URLSearchParams("cron=festival-occurrences");
      const target2 = parseAdminStringParam(sp2, "job") || parseAdminStringParam(sp2, "cron");
      expect(target2).toBe("festival-occurrences");
    });
  });

  describe("6. URL State Mutation and Parameter Preservation", () => {
    it("preserves unrelated query parameters when changing tabs", () => {
      const currentUrl = "/admin/monitoring?utm_source=slack&theme=dark&tab=apis";
      const nextUrl = buildAdminUrlWithParams("/admin/monitoring", currentUrl, {
        tab: "errors",
      });
      expect(nextUrl).toBe("/admin/monitoring?utm_source=slack&theme=dark&tab=errors");
    });

    it("removes specified parameters cleanly", () => {
      const currentUrl = "/admin/moderation?filter=pending&reportId=123";
      const nextUrl = buildAdminUrlWithParams("/admin/moderation", currentUrl, {
        reportId: null,
      });
      expect(nextUrl).toBe("/admin/moderation?filter=pending");
    });

    it("handles URLSearchParams instance as input", () => {
      const sp = new URLSearchParams("tab=apis&env=prod");
      const nextUrl = buildAdminUrlWithParams("/admin/monitoring", sp, {
        tab: "telemetry",
      });
      expect(nextUrl).toBe("/admin/monitoring?tab=telemetry&env=prod");
    });
  });
});
