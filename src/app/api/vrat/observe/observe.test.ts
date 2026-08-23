import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "./route";

const mockGetApiUser = vi.fn();
const mockAssertNotBanned = vi.fn();

vi.mock("@/lib/api-auth", () => ({
  getApiUser: (...args: unknown[]) => mockGetApiUser(...args),
}));

vi.mock("@/lib/api-guards", () => ({
  assertNotBanned: (...args: unknown[]) => mockAssertNotBanned(...args),
}));

describe("Vrat Observation API Route (/api/vrat/observe)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAssertNotBanned.mockResolvedValue(null);
  });

  describe("GET /api/vrat/observe", () => {
    it("returns 401 when unauthenticated", async () => {
      mockGetApiUser.mockResolvedValue({ user: null, error: new Error("Unauthorized"), supabase: null });

      const req = new NextRequest("https://shoonaya.com/api/vrat/observe?vrat_id=ekadashi");
      const res = await GET(req);
      expect(res.status).toBe(401);

      const json = await res.json();
      expect(json.error).toBe("Unauthenticated");
    });

    it("returns 400 when vrat_id is missing", async () => {
      mockGetApiUser.mockResolvedValue({
        user: { id: "u-1" },
        error: null,
        supabase: {
          from: () => ({ select: () => ({ eq: () => ({ maybeSingle: vi.fn() }) }) }),
        },
      });

      const req = new NextRequest("https://shoonaya.com/api/vrat/observe");
      const res = await GET(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.error).toBe("Missing vrat_id");
    });

    it("returns observed_today and total_count for authenticated user", async () => {
      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === "profiles") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({ data: { timezone: "Asia/Kolkata" } }),
            };
          }
          if (table === "vrat_observations") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              order: vi.fn().mockResolvedValue({
                data: [{ occurrence_date: "2026-08-23" }, { occurrence_date: "2026-08-10" }],
              }),
            };
          }
          if (table === "recommendations") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              order: vi.fn().mockResolvedValue({ data: [] }),
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

      const req = new NextRequest("https://shoonaya.com/api/vrat/observe?vrat_id=ekadashi");
      const res = await GET(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.total_count).toBe(2);
      expect(typeof json.observed_today).toBe("boolean");
      expect(typeof json.today).toBe("string");
    });
  });

  describe("POST /api/vrat/observe", () => {
    it("returns 401 when unauthenticated", async () => {
      mockGetApiUser.mockResolvedValue({ user: null, error: new Error("Unauthorized"), supabase: null });

      const req = new NextRequest("https://shoonaya.com/api/vrat/observe", {
        method: "POST",
        body: JSON.stringify({ vrat_id: "ekadashi" }),
      });
      const res = await POST(req);
      expect(res.status).toBe(401);
    });

    it("returns 400 when vrat_id is missing or empty", async () => {
      mockGetApiUser.mockResolvedValue({
        user: { id: "u-1" },
        error: null,
        supabase: {},
      });

      const req = new NextRequest("https://shoonaya.com/api/vrat/observe", {
        method: "POST",
        body: JSON.stringify({ vrat_id: "" }),
      });
      const res = await POST(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.error).toBe("Missing or invalid vrat_id");
    });

    it("records observation via RPC atomically and returns karma earned", async () => {
      const mockRpc = vi.fn().mockResolvedValue({
        data: {
          success: true,
          already_observed: false,
          karma_earned: 25,
          occurrence_date: "2026-08-23",
        },
        error: null,
      });

      const mockSupabase = {
        from: vi.fn(() => ({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: { timezone: "Asia/Kolkata", calendar_profile: "surya_siddhanta", tradition: "hindu" },
          }),
        })),
        rpc: mockRpc,
      };

      mockGetApiUser.mockResolvedValue({
        user: { id: "u-1" },
        error: null,
        supabase: mockSupabase,
      });

      const req = new NextRequest("https://shoonaya.com/api/vrat/observe", {
        method: "POST",
        body: JSON.stringify({
          vrat_id: "ekadashi",
          vrat_name: "Ekadashi",
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.already_observed).toBe(false);
      expect(json.karma_earned).toBe(25);
      expect(mockRpc).toHaveBeenCalledWith("record_vrat_observation", expect.objectContaining({
        p_vrat_id: "ekadashi",
        p_vrat_name: "Ekadashi",
        p_karma: 25,
      }));
    });

    it("returns already_observed: true and 0 karma on duplicate call", async () => {
      const mockRpc = vi.fn().mockResolvedValue({
        data: {
          success: true,
          already_observed: true,
          karma_earned: 0,
          occurrence_date: "2026-08-23",
        },
        error: null,
      });

      const mockSupabase = {
        from: vi.fn(() => ({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: { timezone: "Asia/Kolkata" } }),
        })),
        rpc: mockRpc,
      };

      mockGetApiUser.mockResolvedValue({
        user: { id: "u-1" },
        error: null,
        supabase: mockSupabase,
      });

      const req = new NextRequest("https://shoonaya.com/api/vrat/observe", {
        method: "POST",
        body: JSON.stringify({ vrat_id: "ekadashi" }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.already_observed).toBe(true);
      expect(json.karma_earned).toBe(0);
    });
  });
});
