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

      const json = await res.json();
      expect(json.error).toBe("Unauthenticated");
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

    it("returns observation status by occurrence_id", async () => {
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

    it("returns 400 when occurrence_id is missing or not a valid UUID", async () => {
      mockGetApiUser.mockResolvedValue({
        user: { id: "u-1" },
        error: null,
        supabase: {},
      });

      const req = new NextRequest("https://shoonaya.com/api/vrat/observe", {
        method: "POST",
        body: JSON.stringify({ occurrence_id: "not-a-uuid" }),
      });
      const res = await POST(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.error).toMatch(/valid occurrence_id/i);
    });

    it("records observation atomically with occurrence_id and awards karma", async () => {
      const mockRpc = vi.fn().mockResolvedValue({
        data: {
          success: true,
          already_observed: false,
          karma_earned: 25,
          occurrence_date: "2026-08-23",
        },
        error: null,
      });

      mockGetApiUser.mockResolvedValue({
        user: { id: "u-1" },
        error: null,
        supabase: { rpc: mockRpc },
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
      expect(mockRpc).toHaveBeenCalledWith("record_vrat_observation", {
        p_occurrence_id: VALID_OCCURRENCE_ID,
      });
    });

    it("returns already_observed: true and 0 karma on duplicate occurrence", async () => {
      const mockRpc = vi.fn().mockResolvedValue({
        data: {
          success: true,
          already_observed: true,
          karma_earned: 0,
          occurrence_date: "2026-08-23",
        },
        error: null,
      });

      mockGetApiUser.mockResolvedValue({
        user: { id: "u-1" },
        error: null,
        supabase: { rpc: mockRpc },
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

    it("returns 400 when occurrence is invalid or does not match spiritual date", async () => {
      const mockRpc = vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Occurrence date does not match current spiritual date" },
      });

      mockGetApiUser.mockResolvedValue({
        user: { id: "u-1" },
        error: null,
        supabase: { rpc: mockRpc },
      });

      const req = new NextRequest("https://shoonaya.com/api/vrat/observe", {
        method: "POST",
        body: JSON.stringify({ occurrence_id: VALID_OCCURRENCE_ID }),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.error).toMatch(/does not match current spiritual date/i);
    });
  });
});
