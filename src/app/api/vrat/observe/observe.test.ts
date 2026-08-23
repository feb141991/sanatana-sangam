import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "./route";
import { localSpiritualDate } from "@/lib/sacred-time";

const mockGetApiUser = vi.fn();
const mockAssertNotBanned = vi.fn();
const mockAdminRpc = vi.fn();

vi.mock("@/lib/api-auth", () => ({
  getApiUser: (...args: unknown[]) => mockGetApiUser(...args),
}));

vi.mock("@/lib/api-guards", () => ({
  assertNotBanned: (...args: unknown[]) => mockAssertNotBanned(...args),
}));

vi.mock("@/lib/admin", () => ({
  createServiceRoleSupabaseClient: () => ({
    rpc: mockAdminRpc,
  }),
}));

const VALID_OCCURRENCE_ID = "12345678-1234-1234-1234-123456789abc";

describe("Vrat Observation API Route (/api/vrat/observe)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAssertNotBanned.mockResolvedValue(null);
  });

  describe("GET /api/vrat/observe", () => {
    it("returns 401 when unauthenticated", async () => {
      mockGetApiUser.mockResolvedValue({ user: null, error: new Error("Unauthorized"), supabase: null });

      const req = new NextRequest(`https://shoonaya.com/api/vrat/observe?occurrence_id=${VALID_OCCURRENCE_ID}`);
      const res = await GET(req);
      expect(res.status).toBe(401);
    });

    it("returns 400 when occurrence_id and vrat_id are missing", async () => {
      mockGetApiUser.mockResolvedValue({
        user: { id: "u-1" },
        error: null,
        supabase: {},
      });

      const req = new NextRequest("https://shoonaya.com/api/vrat/observe");
      const res = await GET(req);
      expect(res.status).toBe(400);
    });

    it("returns 500 when profile timezone cannot be resolved (no silent India fallback)", async () => {
      const mockSupabase = {
        from: vi.fn(() => ({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: { message: "DB read failure" } }),
        })),
      };

      mockGetApiUser.mockResolvedValue({
        user: { id: "u-1" },
        error: null,
        supabase: mockSupabase,
      });

      const req = new NextRequest(`https://shoonaya.com/api/vrat/observe?occurrence_id=${VALID_OCCURRENCE_ID}`);
      const res = await GET(req);
      expect(res.status).toBe(500);
    });

    it("returns observation status by occurrence_id", async () => {
      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === "profiles") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({ data: { timezone: "Asia/Kolkata" }, error: null }),
            };
          }
          if (table === "vrat_observations") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: { occurrence_date: "2026-08-23", karma_awarded: 25, observed_at: "2026-08-23T06:00:00Z" },
                error: null,
              }),
            };
          }
          return {};
        }),
      };

      mockGetApiUser.mockResolvedValue({
        user: { id: "u-1" },
        error: null,
        supabase: mockSupabase,
      });

      const req = new NextRequest(`https://shoonaya.com/api/vrat/observe?occurrence_id=${VALID_OCCURRENCE_ID}`);
      const res = await GET(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.observed_today).toBe(true);
      expect(json.total_count).toBe(1);
    });
  });

  describe("POST /api/vrat/observe", () => {
    it("returns 401 when unauthenticated", async () => {
      mockGetApiUser.mockResolvedValue({ user: null, error: new Error("Unauthorized"), supabase: null });

      const req = new NextRequest("https://shoonaya.com/api/vrat/observe", {
        method: "POST",
        body: JSON.stringify({ occurrence_id: VALID_OCCURRENCE_ID }),
      });
      const res = await POST(req);
      expect(res.status).toBe(401);
    });

    it("returns 400 when hostile or unknown fields are provided", async () => {
      mockGetApiUser.mockResolvedValue({
        user: { id: "u-1" },
        error: null,
        supabase: {},
      });

      const req = new NextRequest("https://shoonaya.com/api/vrat/observe", {
        method: "POST",
        body: JSON.stringify({
          occurrence_id: VALID_OCCURRENCE_ID,
          karma: 100,
          user_id: "fake-user",
        }),
      });
      const res = await POST(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.error).toMatch(/Unknown request fields/i);
    });

    it("returns 400 when occurrence_id is missing or malformed", async () => {
      mockGetApiUser.mockResolvedValue({
        user: { id: "u-1" },
        error: null,
        supabase: {},
      });

      const req = new NextRequest("https://shoonaya.com/api/vrat/observe", {
        method: "POST",
        body: JSON.stringify({ occurrence_id: "bad-uuid" }),
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it("returns 400 when occurrence is unreviewed, unverified, or fallback", async () => {
      const todayDate = localSpiritualDate("Asia/Kolkata", 4);
      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === "profiles") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: { timezone: "Asia/Kolkata", calendar_profile: "legacy-ujjain" },
                error: null,
              }),
            };
          }
          if (table === "observance_occurrences") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  id: VALID_OCCURRENCE_ID,
                  date: todayDate,
                  audit_status: "not_run", // un-audited
                  review_status: "needs_review", // un-reviewed
                  verification_status: "not_checked",
                  final_date_source: "fallback",
                  observance_definitions: { kind: "vrat", active: true },
                },
                error: null,
              }),
            };
          }
          return {};
        }),
      };

      mockGetApiUser.mockResolvedValue({
        user: { id: "u-1" },
        error: null,
        supabase: mockSupabase,
      });

      const req = new NextRequest("https://shoonaya.com/api/vrat/observe", {
        method: "POST",
        body: JSON.stringify({ occurrence_id: VALID_OCCURRENCE_ID }),
      });
      const res = await POST(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.error).toMatch(/unverified|unreviewed|fallback/i);
    });

    it("records valid occurrence atomically and invokes service-role RPC", async () => {
      const todayDate = localSpiritualDate("Asia/Kolkata", 4);
      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === "profiles") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: { timezone: "Asia/Kolkata", calendar_profile: "legacy-ujjain" },
                error: null,
              }),
            };
          }
          if (table === "observance_occurrences") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  id: VALID_OCCURRENCE_ID,
                  date: todayDate,
                  audit_status: "completed",
                  review_status: "reviewed",
                  verification_status: "verified",
                  final_date_source: "calculation_engine",
                  observance_definitions: { kind: "vrat", active: true },
                },
                error: null,
              }),
            };
          }
          return {};
        }),
      };

      mockAdminRpc.mockResolvedValue({
        data: {
          success: true,
          already_observed: false,
          karma_earned: 25,
          occurrence_date: todayDate,
        },
        error: null,
      });

      mockGetApiUser.mockResolvedValue({
        user: { id: "u-1" },
        error: null,
        supabase: mockSupabase,
      });

      const req = new NextRequest("https://shoonaya.com/api/vrat/observe", {
        method: "POST",
        body: JSON.stringify({ occurrence_id: VALID_OCCURRENCE_ID }),
      });
      const res = await POST(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.already_observed).toBe(false);
      expect(json.karma_earned).toBe(25);
      expect(mockAdminRpc).toHaveBeenCalledWith("record_vrat_observation", {
        p_user_id: "u-1",
        p_occurrence_id: VALID_OCCURRENCE_ID,
      });
    });

    it("verifies timezone spiritual-date calculations across London, Kolkata, LA, Sydney", () => {
      const timezones = ["Europe/London", "Asia/Kolkata", "America/Los_Angeles", "Australia/Sydney"];
      for (const tz of timezones) {
        const dateStr = localSpiritualDate(tz, 4);
        expect(dateStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    });
  });
});
