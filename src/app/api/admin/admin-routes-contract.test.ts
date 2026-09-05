import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET as getAlerts } from "./alerts/route";
import { GET as exportReports } from "./reports/export/route";
import { GET as getUser, DELETE as deleteUser } from "./users/[userId]/route";
import { submitReport } from "@/lib/moderation";
import { getPendingReports, resolveReport } from "@/lib/moderation-admin";
import { resolveContentReport } from "@/app/admin/monitoring/actions";

// Mock next/headers and next/cache for Server Actions
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (_key: string) => ({ value: "valid_admin_token" }),
  }),
}));
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Mock admin auth helpers
const mockVerifyAdminCookieAuth = vi.fn();
vi.mock("@/lib/admin-auth", () => ({
  verifyAdminCookieAuth: (...args: any[]) => mockVerifyAdminCookieAuth(...args),
  verifyAdminToken: vi.fn().mockResolvedValue({ username: "admin_test", role: "admin" }),
  ADMIN_COOKIE: "admin_token",
}));

// Mock requireAdminAccess for admin routes
let mockAdminClient: any;
vi.mock("@/lib/admin", () => ({
  requireAdminAccess: vi.fn().mockImplementation(async () => ({
    username: "admin_test",
    role: "super_admin",
    supabase: mockAdminClient,
  })),
}));

// Mock client error metrics
const mockFetchClientErrorMonitoringMetrics = vi.fn();
vi.mock("@/lib/monitoring/client-error-aggregator", () => ({
  fetchClientErrorMonitoringMetrics: () => mockFetchClientErrorMonitoringMetrics(),
}));

// Mock supabase admin client
vi.mock("@/lib/supabase-admin", () => ({
  createAdminClient: () => mockAdminClient,
}));

describe("Admin Route Contracts & Schema Integrity", () => {
  beforeEach(() => {
    mockVerifyAdminCookieAuth.mockReset();
    mockVerifyAdminCookieAuth.mockResolvedValue(null); // auth ok
    mockFetchClientErrorMonitoringMetrics.mockReset();
    mockFetchClientErrorMonitoringMetrics.mockResolvedValue({ fingerprints: [] });
  });

  describe("GET /api/admin/alerts", () => {
    it("returns 401 when admin auth fails", async () => {
      const authErrorResponse = new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
      mockVerifyAdminCookieAuth.mockResolvedValueOnce(authErrorResponse);

      const req = new NextRequest("http://localhost:3000/api/admin/alerts");
      const res = await getAlerts(req);
      expect(res.status).toBe(401);
    });

    it("returns active alerts from content_reports, dharm_veers, calendar_integrity_findings", async () => {
      mockAdminClient = {
        from: (table: string) => {
          if (table === "calendar_integrity_findings") {
            return {
              select: () => ({
                eq: () => ({
                  in: () => ({
                    order: () => ({
                      limit: async () => ({
                        data: [{ id: "f-1", display_name: "Diwali", slug: "diwali", year: 2026, issue_type: "engine_curated_mismatch", reason: "Date discrepancy" }],
                        error: null,
                      }),
                    }),
                  }),
                }),
              }),
            };
          }
          if (table === "content_reports") {
            return {
              select: (cols: string) => {
                expect(cols).toContain("reported_by");
                expect(cols).not.toContain("reporter_id");
                return {
                  eq: () => ({
                    order: () => ({
                      limit: async () => ({
                        data: [{ id: "r-1", reason: "hate", created_at: "2026-09-05T00:00:00Z", reported_by: "u-1", content_type: "post", metadata: { details: "Spam" } }],
                        error: null,
                      }),
                    }),
                  }),
                };
              },
            };
          }
          if (table === "dharm_veers") {
            return {
              select: (cols: string) => {
                expect(cols).toContain("created_at");
                expect(cols).toContain("reviewed_at");
                return {
                  eq: () => ({
                    limit: async () => ({
                      data: [{ slug: "chhatrapati-shivaji", name: "Chhatrapati Shivaji Maharaj", created_at: "2026-09-05T00:00:00Z", reviewed_at: null, tradition: "Maratha", era: "17th Century" }],
                      error: null,
                    }),
                  }),
                };
              },
            };
          }
          return { select: () => ({ error: null, data: [] }) };
        },
      };

      const req = new NextRequest("http://localhost:3000/api/admin/alerts");
      const res = await getAlerts(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.count).toBe(3);
      expect(json.alerts.some((a: any) => a.id === "integrity-f-1")).toBe(true);
      expect(json.alerts.some((a: any) => a.id === "report-r-1")).toBe(true);
      expect(json.alerts.some((a: any) => a.id === "dv-chhatrapati-shivaji")).toBe(true);
      expect(json.degraded).toBe(false);
    });

    it("surfaces diagnostic alerts when database queries fail and avoids false operational fallback", async () => {
      mockAdminClient = {
        from: (table: string) => {
          if (table === "content_reports") {
            return {
              select: () => ({
                eq: () => ({
                  order: () => ({
                    limit: async () => ({ data: null, error: { message: "column resolved_at does not exist" } }),
                  }),
                }),
              }),
            };
          }
          return {
            select: () => ({
              eq: () => ({
                in: () => ({ order: () => ({ limit: async () => ({ data: [], error: null }) }) }),
                limit: async () => ({ data: [], error: null }),
              }),
            }),
          };
        },
      };

      const req = new NextRequest("http://localhost:3000/api/admin/alerts");
      const res = await getAlerts(req);
      expect(res.status).toBe(200);
      const json = await res.json();

      expect(json.degraded).toBe(true);
      expect(json.alerts.some((a: any) => a.id === "system-reports-query-error")).toBe(true);
      expect(json.alerts.some((a: any) => a.id === "system-ok")).toBe(false);
    });

    it("returns All Systems Operational only when clean with no errors", async () => {
      mockAdminClient = {
        from: () => ({
          select: () => ({
            eq: () => ({
              in: () => ({ order: () => ({ limit: async () => ({ data: [], error: null }) }) }),
              limit: async () => ({ data: [], error: null }),
              order: () => ({ limit: async () => ({ data: [], error: null }) }),
            }),
          }),
        }),
      };

      const req = new NextRequest("http://localhost:3000/api/admin/alerts");
      const res = await getAlerts(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.degraded).toBe(false);
      expect(json.alerts).toHaveLength(1);
      expect(json.alerts[0].id).toBe("system-ok");
      expect(json.alerts[0].title).toBe("All Systems Operational");
    });
  });

  describe("GET /api/admin/reports/export", () => {
    it("selects canonical content_reports columns (reported_by, content_type, reason, status, created_at) and outputs valid CSV", async () => {
      let queriedColumns = "";
      mockAdminClient = {
        from: (table: string) => {
          expect(table).toBe("content_reports");
          return {
            select: (cols: string) => {
              queriedColumns = cols;
              return {
                order: async () => ({
                  data: [
                    {
                      id: "rep-101",
                      created_at: "2026-09-05T10:00:00Z",
                      content_type: "post",
                      reported_by: "user-1",
                      reason: "harassment",
                      status: "reviewed",
                    },
                  ],
                  error: null,
                }),
              };
            },
          };
        },
      };

      const req = new NextRequest("http://localhost:3000/api/admin/reports/export?type=moderation");
      const res = await exportReports(req);
      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toContain("text/csv");

      expect(queriedColumns).toContain("reported_by");
      expect(queriedColumns).toContain("content_type");
      expect(queriedColumns).toContain("reason");
      expect(queriedColumns).not.toContain("reporter_id");

      const csvText = await res.text();
      expect(csvText).toContain("Report ID,Reporter ID,Content Type,Reason,Status,Created At");
      expect(csvText).toContain("rep-101");
      expect(csvText).toContain("user-1");
      expect(csvText).toContain("reviewed");
    });
  });

  describe("GET & DELETE /api/admin/users/[userId]", () => {
    it("GET /api/admin/users/[userId] queries user dossier with correct content_reports columns", async () => {
      const filters: Record<string, any> = {};
      const createGenericQuery = (defaultData: any = []) => {
        const chain: any = {
          eq: (col: string, val: string) => {
            filters[col] = val;
            return chain;
          },
          or: (filterStr: string) => {
            filters["or"] = filterStr;
            return chain;
          },
          order: () => chain,
          limit: () => chain,
          single: async () => ({ data: defaultData, error: null }),
          maybeSingle: async () => ({ data: defaultData, error: null }),
          then: (resolve: any) => resolve({ data: defaultData, error: null }),
        };
        return chain;
      };

      mockAdminClient = {
        from: (table: string) => {
          if (table === "profiles") {
            return {
              select: () => createGenericQuery({ id: "u-target", username: "seeker1", full_name: "Seeker One" }),
            };
          }
          if (table === "content_reports") {
            return {
              select: (cols: string) => {
                expect(cols).not.toContain("reporter_id");
                return createGenericQuery([]);
              },
            };
          }
          return {
            select: () => createGenericQuery([]),
          };
        },
      };

      const req = new NextRequest("http://localhost:3000/api/admin/users/u-target");
      const res = await getUser(req, { params: Promise.resolve({ userId: "u-target" }) });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.profile.username).toBe("seeker1");
    });

    it("DELETE /api/admin/users/[userId] cleans up user_activity_log using actor_id", async () => {
      const deletedTables: string[] = [];
      const orFilters: Record<string, string> = {};

      mockAdminClient = {
        from: (table: string) => ({
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: { id: "u-target", username: "seeker1" }, error: null }),
            }),
          }),
          delete: () => {
            deletedTables.push(table);
            return {
              eq: async () => ({ error: null }),
              or: async (filterStr: string) => {
                orFilters[table] = filterStr;
                return { error: null };
              },
            };
          },
        }),
        storage: {
          from: () => ({
            list: async () => ({ data: [] }),
            remove: async () => ({ error: null }),
          }),
        },
        auth: {
          admin: {
            deleteUser: async () => ({ error: null }),
          },
        },
      };

      const req = new NextRequest("http://localhost:3000/api/admin/users/u-target", { method: "DELETE" });
      const res = await deleteUser(req, { params: Promise.resolve({ userId: "u-target" }) });
      expect(res.status).toBe(200);

      expect(deletedTables).toContain("user_activity_log");
      expect(orFilters["user_activity_log"]).toBe("actor_id.eq.u-target,target_id.eq.u-target");
      expect(orFilters["user_activity_log"]).not.toContain("user_id.eq.");
    });
  });

  describe("Client Moderation Module Contract (lib/moderation.ts)", () => {
    it("submitReport sends normalized payload to /api/mandali/report and derives identity server-side", async () => {
      const originalFetch = global.fetch;
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ ok: true, reportId: "cr-123" }),
      });
      global.fetch = mockFetch;

      try {
        await submitReport("post-1", "post", "Hate Speech / Harassment", "Harassing message");
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/mandali/report",
          expect.objectContaining({
            method: "POST",
            body: JSON.stringify({
              targetId: "post-1",
              targetType: "post",
              reason: "harassment",
              details: "Harassing message",
            }),
          })
        );
      } finally {
        global.fetch = originalFetch;
      }
    });

    it("submitReport correctly maps profile to user_profile and rejects unsupported target types", async () => {
      const originalFetch = global.fetch;
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ ok: true, reportId: "cr-124" }),
      });
      global.fetch = mockFetch;

      try {
        await submitReport("user-99", "profile", "Spam / Misleading");
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/mandali/report",
          expect.objectContaining({
            body: JSON.stringify({
              targetId: "user-99",
              targetType: "user_profile",
              reason: "spam",
              details: undefined,
            }),
          })
        );

        // Rejects unsupported target types like "kul" instead of silently misrouting
        await expect(submitReport("kul-1", "kul" as any, "other")).rejects.toThrow("Unsupported report target type: kul");
      } finally {
        global.fetch = originalFetch;
      }
    });
  });

  describe("Server Admin Moderation Module (lib/moderation-admin.ts)", () => {
    it("getPendingReports queries content_reports with status pending", async () => {
      mockAdminClient = {
        from: (table: string) => {
          expect(table).toBe("content_reports");
          return {
            select: (_cols: string) => ({
              eq: (col: string, val: string) => {
                expect(col).toBe("status");
                expect(val).toBe("pending");
                return {
                  order: async () => ({
                    data: [{ id: "rep-1", status: "pending", reason: "spam", reported_by: "u-1" }],
                    error: null,
                  }),
                };
              },
            }),
          };
        },
      };

      const pending = await getPendingReports();
      expect(pending).toHaveLength(1);
      expect((pending as any)[0].id).toBe("rep-1");
    });

    it("resolveReport strictly accepts reviewed/actioned/dismissed and uses compare-and-set concurrency guard", async () => {
      let updatedTable = "";
      let updatedPayload: any = null;
      const eqConditions: Record<string, string> = {};

      mockAdminClient = {
        from: (table: string) => {
          updatedTable = table;
          return {
            update: (payload: any) => {
              updatedPayload = payload;
              const chain: any = {
                eq: (col: string, val: string) => {
                  eqConditions[col] = val;
                  return chain;
                },
                select: async () => ({
                  data: [{ id: eqConditions["id"], status: payload.status }],
                  error: null,
                }),
              };
              return chain;
            },
          };
        },
      };

      // Valid reviewed status write with CAS guard
      await resolveReport("rep-1", "reviewed", "Verified and resolved");
      expect(updatedTable).toBe("content_reports");
      expect(updatedPayload).toEqual({ status: "reviewed", admin_note: "Verified and resolved" });
      expect(eqConditions["status"]).toBe("pending");
      expect(eqConditions["id"]).toBe("rep-1");

      // Valid actioned status write
      await resolveReport("rep-2", "actioned", "Content taken down");
      expect(updatedPayload).toEqual({ status: "actioned", admin_note: "Content taken down" });

      // Rejects invalid resolved status write (violating database CHECK constraint)
      await expect(resolveReport("rep-3", "resolved" as any)).rejects.toThrow(/Invalid moderation action status/);

      // Throws conflict when report is already non-pending (0 rows updated)
      mockAdminClient = {
        from: () => ({
          update: () => {
            const chain: any = {
              eq: () => chain,
              select: async () => ({ data: [], error: null }),
            };
            return chain;
          },
        }),
      };
      await expect(resolveReport("rep-already-acted", "reviewed")).rejects.toThrow(/Report conflict/);
    });
  });

  describe("Admin Monitoring Actions (app/admin/monitoring/actions.ts)", () => {
    it("resolveContentReport uses compare-and-set concurrency guard and rejects invalid status", async () => {
      let updateTable = "";
      let updateValues: any = null;
      const eqConditions: Record<string, string> = {};

      mockAdminClient = {
        from: (table: string) => {
          updateTable = table;
          return {
            update: (values: any) => {
              updateValues = values;
              const chain: any = {
                eq: (col: string, val: string) => {
                  eqConditions[col] = val;
                  return chain;
                },
                select: async () => ({
                  data: [{ id: eqConditions["id"], status: values.status }],
                  error: null,
                }),
              };
              return chain;
            },
          };
        },
      };

      await resolveContentReport("cr-999", "reviewed", "Approved response");
      expect(updateTable).toBe("content_reports");
      expect(updateValues).toEqual({ status: "reviewed", admin_note: "Approved response" });
      expect(eqConditions["status"]).toBe("pending");
      expect(eqConditions["id"]).toBe("cr-999");

      await resolveContentReport("cr-999", "dismissed");
      expect(updateValues).toEqual({ status: "dismissed" });

      // Rejects invalid status
      await expect(resolveContentReport("cr-999", "resolved" as any)).rejects.toThrow(/Invalid report status/);

      // Throws conflict when 0 rows updated
      mockAdminClient = {
        from: () => ({
          update: () => {
            const chain: any = {
              eq: () => chain,
              select: async () => ({ data: [], error: null }),
            };
            return chain;
          },
        }),
      };
      await expect(resolveContentReport("cr-already-resolved", "reviewed")).rejects.toThrow(/Report conflict/);
    });
  });
});
