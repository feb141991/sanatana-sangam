import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { PATCH } from "./route";

const getApiUser = vi.fn();
vi.mock("@/lib/api-auth", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/api-auth")>(),
  getApiUser: (...a: unknown[]) => getApiUser(...a),
}));

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
    getApiUser.mockResolvedValue({ user: null, error: Object.assign(new Error("Unauthorized"), { status: 401 }), supabase: null });
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

  it("accepts the distinct activity-consent and Sankalpa reminder preferences", async () => {
    getApiUser.mockResolvedValue({
      user: { id: "user-preferences" },
      error: null,
      supabase: mockSupabase,
    });

    const res = await PATCH(new NextRequest("http://localhost:3000/api/native/profile", {
      method: "PATCH",
      body: JSON.stringify({
        consent_activity_personalization: true,
        wants_sankalpa_midpoint_reminders: true,
      }),
    }));

    expect(res.status).toBe(200);
    expect(updatedPayload).toEqual({
      consent_activity_personalization: true,
      wants_sankalpa_midpoint_reminders: true,
    });
    expect(updatedUserFilter).toBe("user-preferences");
  });

  it("accepts product analytics consent as a separate opt-in setting", async () => {
    getApiUser.mockResolvedValue({
      user: { id: "user-analytics-consent" },
      error: null,
      supabase: mockSupabase,
    });

    const res = await PATCH(new NextRequest("http://localhost:3000/api/native/profile", {
      method: "PATCH",
      body: JSON.stringify({ consent_product_analytics: true }),
    }));

    expect(res.status).toBe(200);
    expect(updatedPayload).toEqual({ consent_product_analytics: true });
    expect(updatedUserFilter).toBe("user-analytics-consent");
    expect((await res.json()).persisted).toEqual({ consent_product_analytics: true });
  });

  it("persists Japa reminder opt-in and its validated local time for the authenticated owner", async () => {
    getApiUser.mockResolvedValue({
      user: { id: "user-japa" },
      error: null,
      supabase: mockSupabase,
    });

    const res = await PATCH(new NextRequest("http://localhost:3000/api/native/profile", {
      method: "PATCH",
      body: JSON.stringify({ japa_reminder_enabled: true, japa_reminder_time: "06:45" }),
    }));

    expect(res.status).toBe(200);
    expect(updatedPayload).toEqual({ japa_reminder_enabled: true, japa_reminder_time: "06:45" });
    expect(updatedUserFilter).toBe("user-japa");
  });

  it("persists Daily Quiz reminder opt-in and its validated local time", async () => {
    getApiUser.mockResolvedValue({
      user: { id: "user-quiz" },
      error: null,
      supabase: mockSupabase,
    });

    const res = await PATCH(new NextRequest("http://localhost:3000/api/native/profile", {
      method: "PATCH",
      body: JSON.stringify({ quiz_reminder_enabled: true, quiz_reminder_time: "08:30" }),
    }));

    expect(res.status).toBe(200);
    expect(updatedPayload).toEqual({ quiz_reminder_enabled: true, quiz_reminder_time: "08:30" });
    expect(updatedUserFilter).toBe("user-quiz");
  });

  it.each(["8:30", "06:59", "15:01", "24:00", "12:60", 830])("rejects invalid Daily Quiz reminder time %s", async (time) => {
    getApiUser.mockResolvedValue({ user: { id: "user-quiz" }, error: null, supabase: mockSupabase });

    const res = await PATCH(new NextRequest("http://localhost:3000/api/native/profile", {
      method: "PATCH",
      body: JSON.stringify({ quiz_reminder_time: time }),
    }));

    expect(res.status).toBe(400);
    expect(updatedPayload).toBeNull();
  });

  it("accepts the final supported Daily Quiz reminder minute at 15:00", async () => {
    getApiUser.mockResolvedValue({ user: { id: "user-quiz" }, error: null, supabase: mockSupabase });

    const res = await PATCH(new NextRequest("http://localhost:3000/api/native/profile", {
      method: "PATCH",
      body: JSON.stringify({ quiz_reminder_time: "15:00" }),
    }));

    expect(res.status).toBe(200);
    expect(updatedPayload).toEqual({ quiz_reminder_time: "15:00" });
  });

  it.each(["7:00", "24:00", "12:60", 700])("rejects invalid Japa reminder time %s", async (time) => {
    getApiUser.mockResolvedValue({ user: { id: "user-japa" }, error: null, supabase: mockSupabase });

    const res = await PATCH(new NextRequest("http://localhost:3000/api/native/profile", {
      method: "PATCH",
      body: JSON.stringify({ japa_reminder_time: time }),
    }));

    expect(res.status).toBe(400);
    expect(updatedPayload).toBeNull();
  });

  it("rejects a non-boolean Japa reminder opt-in", async () => {
    getApiUser.mockResolvedValue({ user: { id: "user-japa" }, error: null, supabase: mockSupabase });

    const res = await PATCH(new NextRequest("http://localhost:3000/api/native/profile", {
      method: "PATCH",
      body: JSON.stringify({ japa_reminder_enabled: "true" }),
    }));

    expect(res.status).toBe(400);
    expect(updatedPayload).toBeNull();
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

  it("accepts valid observance preferences (vrats, tithis, lead days, reminder time)", async () => {
    getApiUser.mockResolvedValue({
      user: { id: "usr_obs_123" },
      error: null,
      supabase: mockSupabase,
    });

    const req = new NextRequest("http://localhost:3000/api/native/profile", {
      method: "PATCH",
      body: JSON.stringify({
        wants_vrat_reminders: true,
        wants_tithi_reminders: false,
        observance_reminder_lead_days: [0, 1, 7],
        observance_reminder_time: "07:30",
      }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(200);
    expect(updatedPayload).toMatchObject({
      wants_vrat_reminders: true,
      wants_tithi_reminders: false,
      observance_reminder_lead_days: [0, 1, 7],
      observance_reminder_time: "07:30",
    });
    expect(updatedUserFilter).toBe("usr_obs_123");
  });

  it("rejects invalid observance reminder time or lead days with 400", async () => {
    getApiUser.mockResolvedValue({
      user: { id: "usr_obs_123" },
      error: null,
      supabase: mockSupabase,
    });

    // Invalid time
    const res1 = await PATCH(new NextRequest("http://localhost:3000/api/native/profile", {
      method: "PATCH",
      body: JSON.stringify({ observance_reminder_time: "25:00" }),
    }));
    expect(res1.status).toBe(400);

    // Invalid lead days (non-array)
    const res2 = await PATCH(new NextRequest("http://localhost:3000/api/native/profile", {
      method: "PATCH",
      body: JSON.stringify({ observance_reminder_lead_days: "invalid" }),
    }));
    expect(res2.status).toBe(400);
  });

  // ── date_of_birth (Android incident 2026-10-09) ─────────────────────────────
  // `new Date("2025-02-31T00:00:00Z")` is a valid Date (JavaScript rolls it to 3 March), so a shape
  // check plus a NaN check accepted days that do not exist, and Postgres then rejected them with 22008
  // and the route answered 500 with the raw database message.
  const dobRequest = (value: unknown) => new NextRequest("http://localhost:3000/api/native/profile", {
    method: "PATCH",
    body: JSON.stringify({ date_of_birth: value }),
  });

  it("persists a valid date_of_birth and lets null clear it", async () => {
    getApiUser.mockResolvedValue({ user: { id: "user-dob" }, error: null, supabase: mockSupabase });

    const ok = await PATCH(dobRequest("1991-08-18"));
    expect(ok.status).toBe(200);
    expect(updatedPayload).toEqual({ date_of_birth: "1991-08-18" });

    updatedPayload = null;
    const cleared = await PATCH(dobRequest(null));
    expect(cleared.status).toBe(200);
    expect(updatedPayload).toEqual({ date_of_birth: null });
  });

  it("trims surrounding whitespace before saving", async () => {
    getApiUser.mockResolvedValue({ user: { id: "user-dob" }, error: null, supabase: mockSupabase });
    expect((await PATCH(dobRequest(" 1991-08-18 "))).status).toBe(200);
    expect(updatedPayload).toEqual({ date_of_birth: "1991-08-18" });
  });

  it.each([
    ["2025-02-31", "calendar"],
    ["2023-02-29", "calendar"],
    ["2025-04-31", "calendar"],
    ["2025-13-45", "calendar"],
    ["18081991", "format"],
    ["18/08/1991", "format"],
    ["", "format"],
    [19910818, "format"],
    ["1899-12-31", "too_old"],
    ["0001-01-01", "too_old"],
    ["2999-01-01", "future"],
  ])("rejects date_of_birth %j with a 400 that names the reason (%s) and saves nothing", async (value, reason) => {
    getApiUser.mockResolvedValue({ user: { id: "user-dob" }, error: null, supabase: mockSupabase });
    const res = await PATCH(dobRequest(value));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.code).toBe("INVALID_DATE_OF_BIRTH");
    expect(json.reason).toBe(reason);
    expect(updatedPayload).toBeNull();
  });

  describe("database errors", () => {
    const failingSupabase = (error: { code?: string; message: string }) => ({
      from: () => ({
        update: () => ({ eq: () => ({ select: () => ({ single: async () => ({ data: null, error }) }) }) }),
      }),
    });

    it("answers a data-exception from the database (22008) with a 400, not a 500, and never echoes its text", async () => {
      getApiUser.mockResolvedValue({
        user: { id: "user-dob" },
        error: null,
        supabase: failingSupabase({ code: "22008", message: 'date/time field value out of range: "2025-02-31" on profiles.date_of_birth' }),
      });
      const res = await PATCH(new NextRequest("http://localhost:3000/api/native/profile", { method: "PATCH", body: JSON.stringify({ wants_shloka_reminders: false }) }));
      expect(res.status).toBe(400);
      const text = JSON.stringify(await res.json());
      expect(text).toContain("INVALID_VALUE");
      expect(text).not.toMatch(/date\/time field|profiles|date_of_birth|2025-02-31/);
    });

    it("answers any other database failure with a generic 500 and never echoes its text", async () => {
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});
      getApiUser.mockResolvedValue({
        user: { id: "user-dob" },
        error: null,
        supabase: failingSupabase({ code: "XX000", message: 'internal detail: relation "profiles" column "secret"' }),
      });
      const res = await PATCH(new NextRequest("http://localhost:3000/api/native/profile", { method: "PATCH", body: JSON.stringify({ wants_shloka_reminders: false }) }));
      expect(res.status).toBe(500);
      const text = JSON.stringify(await res.json());
      expect(text).not.toMatch(/internal detail|profiles|secret/);
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });
});
