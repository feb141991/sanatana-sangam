import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { PATCH } from "./route";

const getApiUser = vi.fn();
vi.mock("@/lib/api-auth", () => ({ getApiUser: (...a: unknown[]) => getApiUser(...a) }));

describe("PATCH /api/native/profile - Complete Contract & Personalisation Suite", () => {
  let updatedPayload: Record<string, unknown> | null = null;
  let updatedUserFilter: string | null = null;
  let userTradition = "hindu";

  const mockSupabase = {
    from: (table: string) => {
      if (table === "profiles") {
        return {
          select: (_cols: string) => ({
            eq: (_col: string, _val: string) => ({
              single: async () => ({ data: { tradition: userTradition }, error: null }),
            }),
          }),
          update: (payload: Record<string, unknown>) => {
            updatedPayload = payload;
            return {
              eq: (col: string, val: string) => {
                if (col === "id") updatedUserFilter = val;
                return {
                  select: (_cols: string) => ({
                    single: async () => ({
                      data: { ...payload, updated_at: "2026-08-31T12:00:00.000Z" },
                      error: null,
                    }),
                  }),
                };
              },
            };
          },
        };
      }
      return {};
    },
  };

  beforeEach(() => {
    getApiUser.mockReset();
    updatedPayload = null;
    updatedUserFilter = null;
    userTradition = "hindu";
  });

  it("returns 401 Unauthorized when unauthenticated", async () => {
    getApiUser.mockResolvedValue({ user: null, error: new Error("Unauthorized"), supabase: null });
    const req = new NextRequest("http://localhost:3000/api/native/profile", {
      method: "PATCH",
      body: JSON.stringify({ rashi: "karka" }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(401);
  });

  it.each(["female", "general", null])(
    "accepts canonical gender_context value %s with an ownership-scoped update",
    async (genderContext) => {
      getApiUser.mockResolvedValue({
        user: { id: "user-gender" },
        error: null,
        supabase: mockSupabase,
      });
      const res = await PATCH(new NextRequest("http://localhost:3000/api/native/profile", {
        method: "PATCH",
        body: JSON.stringify({ gender_context: genderContext }),
      }));

      expect(res.status).toBe(200);
      expect(updatedPayload).toEqual({ gender_context: genderContext });
      expect(updatedUserFilter).toBe("user-gender");
    },
  );

  it("returns the persisted values and updatedAt for write-acknowledgment", async () => {
    getApiUser.mockResolvedValue({
      user: { id: "user-ack" },
      error: null,
      supabase: mockSupabase,
    });
    const res = await PATCH(new NextRequest("http://localhost:3000/api/native/profile", {
      method: "PATCH",
      body: JSON.stringify({ wants_shloka_reminders: false }),
    }));

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.persisted).toEqual({ wants_shloka_reminders: false });
    expect(json.updatedAt).toBe("2026-08-31T12:00:00.000Z");
    // updated_at must never leak into `persisted` as if it were an
    // editable settings field.
    expect(json.persisted.updated_at).toBeUndefined();
  });

  it.each(["male", "prefer_not", "unknown"])(
    "rejects non-canonical gender_context value %s",
    async (genderContext) => {
      getApiUser.mockResolvedValue({
        user: { id: "user-gender" },
        error: null,
        supabase: mockSupabase,
      });
      const res = await PATCH(new NextRequest("http://localhost:3000/api/native/profile", {
        method: "PATCH",
        body: JSON.stringify({ gender_context: genderContext }),
      }));
      expect(res.status).toBe(400);
    },
  );

  it("preserves independent English, Hindi, and Punjabi language fields", async () => {
    getApiUser.mockResolvedValue({
      user: { id: "user-language" },
      error: null,
      supabase: mockSupabase,
    });
    const res = await PATCH(new NextRequest("http://localhost:3000/api/native/profile", {
      method: "PATCH",
      body: JSON.stringify({
        app_language: "pa",
        meaning_language: "hi",
        transliteration_language: "en",
      }),
    }));

    expect(res.status).toBe(200);
    expect(updatedPayload).toEqual({
      app_language: "pa",
      meaning_language: "hi",
      transliteration_language: "en",
    });
  });

  it("rejects an unsupported profile language", async () => {
    getApiUser.mockResolvedValue({
      user: { id: "user-language" },
      error: null,
      supabase: mockSupabase,
    });
    const res = await PATCH(new NextRequest("http://localhost:3000/api/native/profile", {
      method: "PATCH",
      body: JSON.stringify({ app_language: "fr" }),
    }));
    expect(res.status).toBe(400);
  });

  it("does not overwrite language fields during an unrelated profile update", async () => {
    getApiUser.mockResolvedValue({
      user: { id: "user-language" },
      error: null,
      supabase: mockSupabase,
    });
    const res = await PATCH(new NextRequest("http://localhost:3000/api/native/profile", {
      method: "PATCH",
      body: JSON.stringify({ city: "Bedford" }),
    }));

    expect(res.status).toBe(200);
    expect(updatedPayload).toEqual({ city: "Bedford" });
    expect(updatedPayload).not.toHaveProperty("app_language");
    expect(updatedPayload).not.toHaveProperty("meaning_language");
    expect(updatedPayload).not.toHaveProperty("transliteration_language");
  });

  it("accepts valid personalisation fields for Hindu profile", async () => {
    getApiUser.mockResolvedValue({
      user: { id: "user-hindu-1" },
      error: null,
      supabase: mockSupabase,
    });
    const req = new NextRequest("http://localhost:3000/api/native/profile", {
      method: "PATCH",
      body: JSON.stringify({
        rashi: "karka",
        nakshatra: "pushya",
        gotra: "  Kashyap  ",
        calendar_profile: "north_indian_purnimanta",
        calendar_scope: "all_observances",
        onboarding_goal: ["daily_practice", "peace"],
      }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(200);
    expect(updatedPayload).toEqual({
      rashi: "karka",
      nakshatra: "pushya",
      gotra: "Kashyap",
      calendar_profile: "north_indian_purnimanta",
      calendar_scope: "all_observances",
      onboarding_goal: "daily_practice,peace",
    });
    expect(updatedUserFilter).toBe("user-hindu-1");
  });

  it("rejects non-null Hindu-only fields for non-Hindu profiles with 400", async () => {
    userTradition = "sikh";
    getApiUser.mockResolvedValue({
      user: { id: "user-sikh-1" },
      error: null,
      supabase: mockSupabase,
    });
    const req = new NextRequest("http://localhost:3000/api/native/profile", {
      method: "PATCH",
      body: JSON.stringify({ rashi: "mesha" }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("is only available for Hindu tradition profiles");
  });

  it("allows non-Hindu profiles to explicitly clear Hindu-only fields with null", async () => {
    userTradition = "buddhist";
    getApiUser.mockResolvedValue({
      user: { id: "user-buddhist-1" },
      error: null,
      supabase: mockSupabase,
    });
    const validReq = new NextRequest("http://localhost:3000/api/native/profile", {
      method: "PATCH",
      body: JSON.stringify({
        rashi: null,
        nakshatra: null,
        gotra: null,
        calendar_profile: null,
        calendar_scope: null,
        onboarding_goal: "peace,knowledge",
      }),
    });
    const res = await PATCH(validReq);
    expect(res.status).toBe(200);
    expect(updatedPayload).toEqual({
      rashi: null,
      nakshatra: null,
      gotra: null,
      calendar_profile: null,
      calendar_scope: null,
      onboarding_goal: "peace,knowledge",
    });
  });

  it("trims and limits gotra length, persisting empty input as null", async () => {
    getApiUser.mockResolvedValue({
      user: { id: "user-hindu-2" },
      error: null,
      supabase: mockSupabase,
    });
    const reqEmpty = new NextRequest("http://localhost:3000/api/native/profile", {
      method: "PATCH",
      body: JSON.stringify({ gotra: "   " }),
    });
    const resEmpty = await PATCH(reqEmpty);
    expect(resEmpty.status).toBe(200);
    expect(updatedPayload).toEqual({ gotra: null });

    const longGotra = "A".repeat(100);
    const reqLong = new NextRequest("http://localhost:3000/api/native/profile", {
      method: "PATCH",
      body: JSON.stringify({ gotra: longGotra }),
    });
    const resLong = await PATCH(reqLong);
    expect(resLong.status).toBe(200);
    expect(updatedPayload?.gotra).toBe("A".repeat(64));
  });

  it("rejects invalid enum values for rashi, nakshatra, calendar_profile, calendar_scope, and goals", async () => {
    getApiUser.mockResolvedValue({
      user: { id: "user-hindu-3" },
      error: null,
      supabase: mockSupabase,
    });

    // Invalid rashi
    const res1 = await PATCH(new NextRequest("http://localhost:3000/api/native/profile", {
      method: "PATCH",
      body: JSON.stringify({ rashi: "invalid_rashi" }),
    }));
    expect(res1.status).toBe(400);

    // Invalid nakshatra
    const res2 = await PATCH(new NextRequest("http://localhost:3000/api/native/profile", {
      method: "PATCH",
      body: JSON.stringify({ nakshatra: "invalid_nakshatra" }),
    }));
    expect(res2.status).toBe(400);

    // Invalid calendar_profile
    const res3 = await PATCH(new NextRequest("http://localhost:3000/api/native/profile", {
      method: "PATCH",
      body: JSON.stringify({ calendar_profile: "unsupported_cal" }),
    }));
    expect(res3.status).toBe(400);

    // Invalid calendar_scope
    const res4 = await PATCH(new NextRequest("http://localhost:3000/api/native/profile", {
      method: "PATCH",
      body: JSON.stringify({ calendar_scope: "random_scope" }),
    }));
    expect(res4.status).toBe(400);

    // Invalid goal
    const res5 = await PATCH(new NextRequest("http://localhost:3000/api/native/profile", {
      method: "PATCH",
      body: JSON.stringify({ onboarding_goal: "make_money,peace" }),
    }));
    expect(res5.status).toBe(400);
  });
});
