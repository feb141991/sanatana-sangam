import { describe, it, expect } from "vitest";
import {
  getOverviewSystemStatus,
  sortAlertsByUrgency,
  alertToInspectableRecord,
} from "./admin-overview-helpers";
import type { UrgentAlertItem } from "@/app/api/admin/alerts/route";

describe("Admin Overview Helpers", () => {
  describe("getOverviewSystemStatus", () => {
    it("returns degraded status when degraded flag is true even if alerts are empty", () => {
      const res = getOverviewSystemStatus([], true);
      expect(res.status).toBe("degraded");
      expect(res.label).toBe("Monitoring Degraded");
    });

    it("returns degraded status when degraded flag is true even with low alerts", () => {
      const alerts: UrgentAlertItem[] = [
        {
          id: "sys-1",
          title: "Notice",
          desc: "Note",
          type: "system",
          severity: "low",
          href: "/admin",
          timestamp: "2026-09-05T12:00:00Z",
        },
      ];
      const res = getOverviewSystemStatus(alerts, true);
      expect(res.status).toBe("degraded");
    });

    it("returns critical status when high severity alerts are present and not degraded", () => {
      const alerts: UrgentAlertItem[] = [
        {
          id: "crit-1",
          title: "Spike",
          desc: "Crash spike",
          type: "client_error",
          severity: "high",
          href: "/admin/monitoring",
          timestamp: "2026-09-05T12:00:00Z",
        },
      ];
      const res = getOverviewSystemStatus(alerts, false);
      expect(res.status).toBe("critical");
      expect(res.criticalCount).toBe(1);
      expect(res.label).toContain("1 Critical Issue");
    });

    it("returns warning status when only medium severity alerts are present", () => {
      const alerts: UrgentAlertItem[] = [
        {
          id: "warn-1",
          title: "Dharm Veer",
          desc: "Pending review",
          type: "dharm_veer",
          severity: "medium",
          href: "/admin/dharm-veer-review",
          timestamp: "2026-09-05T12:00:00Z",
        },
      ];
      const res = getOverviewSystemStatus(alerts, false);
      expect(res.status).toBe("warning");
      expect(res.warningCount).toBe(1);
    });

    it("returns healthy status when no actionable alerts and not degraded", () => {
      const alerts: UrgentAlertItem[] = [
        {
          id: "system-ok",
          title: "All Systems Operational",
          desc: "No issues",
          type: "system",
          severity: "low",
          href: "/admin/monitoring",
          timestamp: "2026-09-05T12:00:00Z",
        },
      ];
      const res = getOverviewSystemStatus(alerts, false);
      expect(res.status).toBe("healthy");
      expect(res.label).toBe("All Systems Operational");
      expect(res.criticalCount).toBe(0);
      expect(res.warningCount).toBe(0);
    });
  });

  describe("sortAlertsByUrgency", () => {
    it("orders high severity before medium and low", () => {
      const alerts: UrgentAlertItem[] = [
        {
          id: "low-1",
          title: "Low item",
          desc: "desc",
          type: "system",
          severity: "low",
          href: "/admin",
          timestamp: "2026-09-05T15:00:00Z",
        },
        {
          id: "high-1",
          title: "High item",
          desc: "desc",
          type: "integrity",
          severity: "high",
          href: "/admin/calendar-governance",
          timestamp: "2026-09-05T10:00:00Z",
        },
        {
          id: "med-1",
          title: "Med item",
          desc: "desc",
          type: "report",
          severity: "medium",
          href: "/admin/moderation",
          timestamp: "2026-09-05T12:00:00Z",
        },
      ];

      const sorted = sortAlertsByUrgency(alerts);
      expect(sorted.map((a) => a.id)).toEqual(["high-1", "med-1", "low-1"]);
    });

    it("orders newer timestamps first within the same severity level", () => {
      const alerts: UrgentAlertItem[] = [
        {
          id: "high-older",
          title: "High older",
          desc: "desc",
          type: "integrity",
          severity: "high",
          href: "/admin",
          timestamp: "2026-09-05T08:00:00Z",
        },
        {
          id: "high-newer",
          title: "High newer",
          desc: "desc",
          type: "integrity",
          severity: "high",
          href: "/admin",
          timestamp: "2026-09-05T12:00:00Z",
        },
      ];

      const sorted = sortAlertsByUrgency(alerts);
      expect(sorted.map((a) => a.id)).toEqual(["high-newer", "high-older"]);
    });
  });

  describe("alertToInspectableRecord", () => {
    it("returns null for system-ok fallback item", () => {
      const item: UrgentAlertItem = {
        id: "system-ok",
        title: "All Systems Operational",
        desc: "No issues",
        type: "system",
        severity: "low",
        href: "/admin",
        timestamp: "2026-09-05T12:00:00Z",
      };
      expect(alertToInspectableRecord(item)).toBeNull();
    });

    it("correctly maps a calendar integrity alert", () => {
      const item: UrgentAlertItem = {
        id: "integrity-f1",
        title: "Calendar Integrity: Diwali (2026)",
        desc: "Engine mismatch with curated date",
        type: "integrity",
        severity: "high",
        href: "/admin/calendar-governance?tab=integrity&findingId=f1",
        timestamp: "2026-09-05T12:00:00Z",
        metadata: {
          findingId: "f1",
          slug: "diwali",
          year: 2026,
          storedDate: "2026-11-08",
          engineDate: "2026-11-09",
          reason: "Tithi vyapti difference",
          isOpen: true,
        },
      };

      const record = alertToInspectableRecord(item);
      expect(record).not.toBeNull();
      expect(record?.type).toBe("calendar_finding");
      if (record?.type === "calendar_finding") {
        expect(record.id).toBe("f1");
        expect(record.slug).toBe("diwali");
        expect(record.year).toBe(2026);
        expect(record.severity).toBe("critical");
        expect(record.status).toBe("open");
        expect(record.discrepancy?.expectedDate).toBe("2026-11-08");
        expect(record.discrepancy?.calculatedDate).toBe("2026-11-09");
      }
    });

    it("correctly maps a content report alert", () => {
      const item: UrgentAlertItem = {
        id: "report-r1",
        title: "Pending Content Report",
        desc: "Inappropriate prompt",
        type: "report",
        severity: "high",
        href: "/admin/moderation?reportId=r1",
        timestamp: "2026-09-05T12:00:00Z",
        metadata: {
          reportId: "r1",
          reason: "harassment",
          reporterId: "u123",
          contentType: "ai_chat",
          details: { user_prompt: "bad text" },
        },
      };

      const record = alertToInspectableRecord(item);
      expect(record).not.toBeNull();
      expect(record?.type).toBe("content_report");
      if (record?.type === "content_report") {
        expect(record.id).toBe("r1");
        expect(record.reason).toBe("harassment");
        expect(record.reportedBy).toBe("u123");
        expect(record.status).toBe("pending");
      }
    });

    it("correctly maps a client error crash alert", () => {
      const item: UrgentAlertItem = {
        id: "client-err-fp1",
        title: "Crash Spike: TypeError on /home",
        desc: "Cannot read properties of undefined",
        type: "client_error",
        severity: "high",
        href: "/admin/monitoring?section=errors&fingerprint=fp1",
        timestamp: "2026-09-05T12:00:00Z",
        metadata: {
          fingerprint: "fp1",
          errorName: "TypeError",
          errorMessage: "Cannot read properties of undefined",
          route: "/home",
          count1h: 12,
          count24h: 30,
          distinctSessionsCount: 8,
          sampleStack: "TypeError: at line 4",
        },
      };

      const record = alertToInspectableRecord(item);
      expect(record).not.toBeNull();
      expect(record?.type).toBe("client_error");
      if (record?.type === "client_error") {
        expect(record.fingerprint).toBe("fp1");
        expect(record.errorName).toBe("TypeError");
        expect(record.count1h).toBe(12);
        expect(record.distinctSessionsCount).toBe(8);
      }
    });

    it("correctly maps a dharm veer review alert", () => {
      const item: UrgentAlertItem = {
        id: "dv-chhatrapati-shivaji",
        title: "Dharm Veer Review: Shivaji Maharaj",
        desc: "Auto-sourced biography awaiting admin verification",
        type: "dharm_veer",
        severity: "medium",
        href: "/admin/dharm-veer-review?slug=chhatrapati-shivaji",
        timestamp: "2026-09-05T12:00:00Z",
        metadata: {
          slug: "chhatrapati-shivaji",
          name: "Shivaji Maharaj",
          tradition: "Maratha / Sanatan",
          era: "1630-1680",
        },
      };

      const record = alertToInspectableRecord(item);
      expect(record).not.toBeNull();
      expect(record?.type).toBe("dharm_veer");
      if (record?.type === "dharm_veer") {
        expect(record.slug).toBe("chhatrapati-shivaji");
        expect(record.name).toBe("Shivaji Maharaj");
        expect(record.tradition).toBe("Maratha / Sanatan");
        expect(record.era).toBe("1630-1680");
      }
    });
  });
});
