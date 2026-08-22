import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { PATCH } from "./route";

const getApiUser = vi.fn();
vi.mock("@/lib/api-auth", () => ({ getApiUser: (...a: unknown[]) => getApiUser(...a) }));

describe("PATCH /api/native/profile - Gender Context & Profile Contract", () => {
  let updatedPayload: Record<string, unknown> | null = null;
  let updatedUserFilter: string | null = null;

  const mockSupabase = {
    from: (table: string) => ({
      update: (payload: Record<string, unknown>) => {
        updatedPayload = payload;
        return {
          eq: (col: string, val: string) => {
            if (col === "id") updatedUserFilter = val;
            return Promise.resolve({ error: null });
          },
        };
      },
    }),
  };

  beforeEach(() => {
    getApiUser.mockReset();
    updatedPayload = null;
    updatedUserFilter = null;
  });

  it("returns 401 Unauthorized when unauthenticated", async () => {
    getApiUser.mockResolvedValue({ user: null, error: new Error("Unauthorized"), supabase: null });
    const req = new NextRequest("http://localhost:3000/api/native/profile", {
      method: "PATCH",
      body: JSON.stringify({ gender_context: "female" }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(401);
  });

  it("accepts valid female gender_context and applies ownership-scoped update", async () => {
    getApiUser.mockResolvedValue({
      user: { id: "user-123" },
      error: null,
      supabase: mockSupabase,
    });
    const req = new NextRequest("http://localhost:3000/api/native/profile", {
      method: "PATCH",
      body: JSON.stringify({ gender_context: "female" }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(200);
    expect(updatedPayload).toEqual({ gender_context: "female" });
    expect(updatedUserFilter).toBe("user-123");
  });

  it("accepts valid general gender_context and updates user profile", async () => {
    getApiUser.mockResolvedValue({
      user: { id: "user-456" },
      error: null,
      supabase: mockSupabase,
    });
    const req = new NextRequest("http://localhost:3000/api/native/profile", {
      method: "PATCH",
      body: JSON.stringify({ gender_context: "general" }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(200);
    expect(updatedPayload).toEqual({ gender_context: "general" });
    expect(updatedUserFilter).toBe("user-456");
  });

  it("accepts valid null gender_context for unsetting", async () => {
    getApiUser.mockResolvedValue({
      user: { id: "user-789" },
      error: null,
      supabase: mockSupabase,
    });
    const req = new NextRequest("http://localhost:3000/api/native/profile", {
      method: "PATCH",
      body: JSON.stringify({ gender_context: null }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(200);
    expect(updatedPayload).toEqual({ gender_context: null });
    expect(updatedUserFilter).toBe("user-789");
  });

  it("rejects invalid arbitrary values like male or unknown string with 400", async () => {
    getApiUser.mockResolvedValue({
      user: { id: "user-123" },
      error: null,
      supabase: mockSupabase,
    });
    const req = new NextRequest("http://localhost:3000/api/native/profile", {
      method: "PATCH",
      body: JSON.stringify({ gender_context: "male" }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("gender_context must be one of female, general, or null");
  });
});
