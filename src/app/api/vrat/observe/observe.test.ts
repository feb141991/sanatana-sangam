import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "./route";
import { localSpiritualDate } from "@/lib/sacred-time";

const mockGetApiUser = vi.fn();
const mockAssertNotBanned = vi.fn();
const mockResolveObservable = vi.fn();
const mockAdminRpc = vi.fn();

vi.mock("@/lib/api-auth", () => ({
  getApiUser: (...args: unknown[]) => mockGetApiUser(...args),
}));

vi.mock("@/lib/api-guards", () => ({
  assertNotBanned: (...args: unknown[]) => mockAssertNotBanned(...args),
}));

vi.mock("@/lib/calendar/vrat-observable-resolver", () => ({
  resolveObservableVratOccurrence: (...args: unknown[]) => mockResolveObservable(...args),
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

    it("returns 400 when canonical resolver rejects the occurrence", async () => {
      mockGetApiUser.mockResolvedValue({
        user: { id: "u-1" },
        error: null,
        supabase: {},
      });

      mockResolveObservable.mockResolvedValue({
        success: false,
        statusCode: 400,
        errorCode: "OCCURRENCE_NOT_OBSERVABLE",
        userMessage: "This observance is not active or eligible to observe today",
      });

      const req = new NextRequest("https://shoonaya.com/api/vrat/observe", {
        method: "POST",
        body: JSON.stringify({ occurrence_id: VALID_OCCURRENCE_ID }),
      });
      const res = await POST(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.code).toBe("OCCURRENCE_NOT_OBSERVABLE");
      expect(json.error).toBe("This observance is not active or eligible to observe today");
    });

    it("records valid occurrence atomically and invokes service-role RPC", async () => {
      mockGetApiUser.mockResolvedValue({
        user: { id: "u-1" },
        error: null,
        supabase: {},
      });

      mockResolveObservable.mockResolvedValue({
        success: true,
        user: {
          id: "u-1",
          timezone: "Asia/Kolkata",
          calendarProfile: "legacy-ujjain",
          tradition: "hindu",
          sampradaya: null,
        },
        occurrence: {
          id: VALID_OCCURRENCE_ID,
          date: "2026-08-23",
          vratId: "ekadashi",
          vratName: "Nirjala Ekadashi",
          calendarProfile: "legacy-ujjain",
          tradition: "hindu",
          sampradayaIdentity: "hindu",
          variantKey: null,
        },
      });

      mockAdminRpc.mockResolvedValue({
        data: {
          success: true,
          already_observed: false,
          karma_earned: 25,
          occurrence_date: "2026-08-23",
        },
        error: null,
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
        p_calendar_profile: "legacy-ujjain",
        p_tradition: "hindu",
        p_sampradaya: null,
        p_spiritual_tradition: "hindu",
        p_variant_key: null,
      });
    });

    it("handles duplicate observation idempotently with zero karma", async () => {
      mockGetApiUser.mockResolvedValue({
        user: { id: "u-1" },
        error: null,
        supabase: {},
      });

      mockResolveObservable.mockResolvedValue({
        success: true,
        user: {
          id: "u-1",
          timezone: "Asia/Kolkata",
          calendarProfile: "legacy-ujjain",
          tradition: "hindu",
          sampradaya: null,
        },
        occurrence: {
          id: VALID_OCCURRENCE_ID,
          date: "2026-08-23",
          vratId: "ekadashi",
          vratName: "Nirjala Ekadashi",
          calendarProfile: "legacy-ujjain",
          tradition: "hindu",
          sampradayaIdentity: "hindu",
          variantKey: null,
        },
      });

      mockAdminRpc.mockResolvedValue({
        data: {
          success: true,
          already_observed: true,
          karma_earned: 0,
          occurrence_date: "2026-08-23",
        },
        error: null,
      });

      const req = new NextRequest("https://shoonaya.com/api/vrat/observe", {
        method: "POST",
        body: JSON.stringify({ occurrence_id: VALID_OCCURRENCE_ID }),
      });
      const res = await POST(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.already_observed).toBe(true);
      expect(json.karma_earned).toBe(0);
    });
  });

  describe("Deterministic Spiritual Date Timezone Fixtures (4 AM Boundary)", () => {
    it("evaluates London 03:59 vs 04:00 and UTC midnight transitions", () => {
      // Frozen instant at 2026-08-23T02:59:00Z (03:59 BST, before 4 AM boundary) -> 2026-08-22
      const before4am = new Date("2026-08-23T02:59:00Z");
      expect(localSpiritualDate("Europe/London", 4, before4am)).toBe("2026-08-22");

      // Frozen instant at 2026-08-23T03:00:00Z (04:00 BST, exact 4 AM boundary) -> 2026-08-23
      const at4am = new Date("2026-08-23T03:00:00Z");
      expect(localSpiritualDate("Europe/London", 4, at4am)).toBe("2026-08-23");
    });

    it("evaluates Kolkata 03:59 vs 04:00 transitions", () => {
      // 2026-08-22T22:29:00Z (03:59 IST, before 4 AM boundary) -> 2026-08-22
      const before4am = new Date("2026-08-22T22:29:00Z");
      expect(localSpiritualDate("Asia/Kolkata", 4, before4am)).toBe("2026-08-22");

      // 2026-08-22T22:30:00Z (04:00 IST, exact 4 AM boundary) -> 2026-08-23
      const at4am = new Date("2026-08-22T22:30:00Z");
      expect(localSpiritualDate("Asia/Kolkata", 4, at4am)).toBe("2026-08-23");
    });

    it("evaluates Los Angeles 03:59 vs 04:00 transitions", () => {
      // 2026-08-23T10:59:00Z (03:59 PDT, before 4 AM boundary) -> 2026-08-22
      const before4am = new Date("2026-08-23T10:59:00Z");
      expect(localSpiritualDate("America/Los_Angeles", 4, before4am)).toBe("2026-08-22");

      // 2026-08-23T11:00:00Z (04:00 PDT, exact 4 AM boundary) -> 2026-08-23
      const at4am = new Date("2026-08-23T11:00:00Z");
      expect(localSpiritualDate("America/Los_Angeles", 4, at4am)).toBe("2026-08-23");
    });

    it("evaluates Sydney 03:59 vs 04:00 transitions", () => {
      // 2026-08-22T17:59:00Z (03:59 AEST, before 4 AM boundary) -> 2026-08-22
      const before4am = new Date("2026-08-22T17:59:00Z");
      expect(localSpiritualDate("Australia/Sydney", 4, before4am)).toBe("2026-08-22");

      // 2026-08-22T18:00:00Z (04:00 AEST, exact 4 AM boundary) -> 2026-08-23
      const at4am = new Date("2026-08-22T18:00:00Z");
      expect(localSpiritualDate("Australia/Sydney", 4, at4am)).toBe("2026-08-23");
    });

    it("handles device timezone differing from stored profile timezone with stored profile governing", async () => {
      // Stored profile timezone: Asia/Kolkata (where 2026-08-23T02:00:00Z is 07:30 IST -> spiritual date 2026-08-23)
      // Device timezone: America/Los_Angeles (where 2026-08-23T02:00:00Z is 19:00 PDT on 2026-08-22 -> spiritual date 2026-08-22)
      const frozenTime = new Date("2026-08-23T02:00:00Z");

      const profileSpiritualDate = localSpiritualDate("Asia/Kolkata", 4, frozenTime);
      const deviceSpiritualDate = localSpiritualDate("America/Los_Angeles", 4, frozenTime);

      expect(profileSpiritualDate).toBe("2026-08-23");
      expect(deviceSpiritualDate).toBe("2026-08-22");

      // Verify resolver / route reads stored profile timezone
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
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
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

      // Pass device timezone in query param, but profile timezone is stored as Asia/Kolkata
      const req = new NextRequest(`https://shoonaya.com/api/vrat/observe?occurrence_id=${VALID_OCCURRENCE_ID}&tz=America/Los_Angeles`);
      const res = await GET(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      // Server derived spiritual date matches profile timezone
      expect(json.today).toBe(localSpiritualDate("Asia/Kolkata", 4));
    });
  });
});
