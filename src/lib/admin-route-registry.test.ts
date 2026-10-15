import { describe, it, expect } from "vitest";
import {
  ADMIN_ROUTES,
  ADMIN_NAV_GROUPS,
  GROUP_TITLES,
  getAdminRouteByPath,
  searchAdminRoutes,
} from "./admin-route-registry";

describe("Admin Route Registry", () => {
  describe("Structure & Coverage", () => {
    it("contains all operational routes including log explorer", () => {
      // Every console page that is meant to be reachable from the sidebar and the route search. The list is the
      // contract: adding a page means adding it here on purpose, instead of a bare count that goes stale.
      const expected = [
        "/admin",
        "/admin/moderation",
        "/admin/calendar-governance",
        "/admin/dharm-veer-review",
        "/admin/calendar-dates",
        "/admin/calendar-evidence",
        "/admin/monitoring",
        "/admin/logs",
        "/admin/rag-retrieval",
        "/admin/crons",
        "/admin/notifications",
        "/admin/observance-content",
        "/admin/users",
        "/admin/early-access",
        "/admin/tirtha",
        "/admin/marketing",
        "/admin/broadcast",
        "/admin/hindi-generator",
        "/admin/festival-quiz",
        "/admin/mandali-prompts",
        "/admin/marketing/social",
        "/admin/reports",
        "/admin/settings",
      ];
      const paths = ADMIN_ROUTES.map((r) => r.path);
      expect([...paths].sort()).toEqual([...expected].sort());
      expect(new Set(paths).size).toBe(paths.length); // no route is listed twice
    });

    it("has 5 distinct navigation groups with non-empty items", () => {
      expect(ADMIN_NAV_GROUPS.length).toBe(5);
      for (const group of ADMIN_NAV_GROUPS) {
        expect(group.items.length).toBeGreaterThan(0);
        expect(GROUP_TITLES[group.id]).toBe(group.label);
      }
    });
  });

  describe("getAdminRouteByPath", () => {
    it("matches exact /admin root route", () => {
      const match = getAdminRouteByPath("/admin");
      expect(match).not.toBeNull();
      expect(match?.route.id).toBe("overview");
      expect(match?.breadcrumb).toEqual(["Admin", "Overview"]);
    });

    it("matches /admin/calendar-governance and its sub-paths", () => {
      const match1 = getAdminRouteByPath("/admin/calendar-governance");
      expect(match1?.route.id).toBe("calendar-governance");
      expect(match1?.groupLabel).toBe("Work Queues");
      expect(match1?.breadcrumb).toEqual(["Admin", "Work Queues", "Calendar Governance"]);

      const match2 = getAdminRouteByPath("/admin/calendar-governance?tab=fixtures");
      expect(match2?.route.id).toBe("calendar-governance");
    });

    it("matches /admin/logs route", () => {
      const match = getAdminRouteByPath("/admin/logs");
      expect(match?.route.id).toBe("logs");
      expect(match?.groupLabel).toBe("Operations");
      expect(match?.breadcrumb).toEqual(["Admin", "Operations", "Logs"]);
    });

    it("matches nested dynamic sub-paths like /admin/users/[id]", () => {
      const match = getAdminRouteByPath("/admin/users/usr_123_abc");
      expect(match?.route.id).toBe("users");
      expect(match?.breadcrumb).toEqual(["Admin", "Content & Community", "Users"]);
    });

    it("returns null for non-admin paths", () => {
      expect(getAdminRouteByPath("/home")).toBeNull();
      expect(getAdminRouteByPath("/")).toBeNull();
      expect(getAdminRouteByPath(null)).toBeNull();
    });
  });

  describe("searchAdminRoutes (Command Palette)", () => {
    it("finds routes by keyword across title, description, and group", () => {
      const cronResults = searchAdminRoutes("cron");
      expect(cronResults.some((r) => r.id === "crons")).toBe(true);

      const sentryResults = searchAdminRoutes("crashes");
      expect(sentryResults.some((r) => r.id === "monitoring")).toBe(true);

      const reviewResults = searchAdminRoutes("biography");
      expect(reviewResults.some((r) => r.id === "dharm-veer-review")).toBe(true);

      const logResults = searchAdminRoutes("telemetry");
      expect(logResults.some((r) => r.id === "logs")).toBe(true);
    });

    it("returns all routes for empty query", () => {
      const all = searchAdminRoutes("");
      expect(all.length).toBe(ADMIN_ROUTES.length);
    });

    it("returns empty array for non-matching queries without errors", () => {
      const empty = searchAdminRoutes("nonexistent_random_xyz_query");
      expect(empty).toEqual([]);
    });
  });
});
