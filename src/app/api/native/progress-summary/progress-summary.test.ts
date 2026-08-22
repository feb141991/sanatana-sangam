import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

const getApiUser = vi.fn();
vi.mock("@/lib/api-auth", () => ({ getApiUser: (...a: unknown[]) => getApiUser(...a) }));

describe("GET /api/native/progress-summary - Truthful Profile Completion Model", () => {
  let profileRow: Record<string, unknown> | null = null;
  let sadhanaRows: Record<string, unknown>[] = [];

  const mockSupabase = {
    from: (table: string) => {
      if (table === "profiles") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: profileRow, error: null }),
            }),
          }),
        };
      }
      if (table === "daily_sadhana") {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({ limit: () => Promise.resolve({ data: sadhanaRows }) }),
            }),
          }),
        };
      }
      return {
        select: () => ({
          eq: () => ({
            eq: () => Promise.resolve({ data: [] }),
            gte: () => ({ lte: () => ({ limit: () => Promise.resolve({ data: [] }) }) }),
            maybeSingle: () => Promise.resolve({ data: null }),
            order: () => ({ limit: () => Promise.resolve({ data: [] }) }),
          }),
        }),
      };
    },
  };

  beforeEach(() => {
    getApiUser.mockReset();
    profileRow = null;
    sadhanaRows = [];
  });

  it("returns 401 Unauthorized when unauthenticated", async () => {
    getApiUser.mockResolvedValue({ user: null, error: new Error("Unauthorized"), supabase: null });
    const req = new NextRequest("http://localhost:3000/api/native/progress-summary");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("marks coreProfile complete and emits tradition-aware suggestions for Hindu profile with optional fields missing", async () => {
    profileRow = {
      id: "user-hindu-1",
      full_name: "Aarav Sharma",
      tradition: "hindu",
      app_language: "en",
      wants_festival_reminders: false,
      wants_shloka_reminders: false,
      wants_community_notifications: false,
      city: null,
      life_stage: null,
      rashi: null,
      nakshatra: null,
      gotra: null,
      calendar_profile: null,
      calendar_scope: null,
      onboarding_goal: null,
    };
    getApiUser.mockResolvedValue({
      user: { id: "user-hindu-1" },
      error: null,
      supabase: mockSupabase,
    });

    const req = new NextRequest("http://localhost:3000/api/native/progress-summary");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();

    // Core profile is 100% complete
    expect(body.coreProfile.isComplete).toBe(true);
    expect(body.completion.pct).toBe(100);

    // Suggestions include Hindu-only and all-tradition items
    const suggestionKeys = body.completion.suggestions.map((s: { key: string }) => s.key);
    expect(suggestionKeys).toContain("calendar_profile");
    expect(suggestionKeys).toContain("rashi");
    expect(suggestionKeys).toContain("nakshatra");
    expect(suggestionKeys).toContain("gotra");
    expect(suggestionKeys).toContain("calendar_scope");
    expect(suggestionKeys).toContain("city");
    expect(suggestionKeys).toContain("life_stage");
    expect(suggestionKeys).not.toContain("onboarding_goal");

    // Check routes
    for (const s of body.completion.suggestions) {
      if (["calendar_profile", "rashi", "nakshatra", "gotra", "calendar_scope", "onboarding_goal"].includes(s.key)) {
        expect(s.route).toBe("/settings/personalisation");
      } else if (["city", "life_stage"].includes(s.key)) {
        expect(s.route).toBe("/settings/personal-details");
      }
    }
  });

  it("never suggests Hindu-only fields for non-Hindu profiles (Sikh / Buddhist / Jain)", async () => {
    profileRow = {
      id: "user-sikh-1",
      full_name: "Gurpreet Singh",
      tradition: "sikh",
      app_language: "pa",
      wants_festival_reminders: false,
      city: null,
      life_stage: null,
      rashi: null,
      nakshatra: null,
      gotra: null,
      calendar_profile: null,
      calendar_scope: null,
      onboarding_goal: null,
    };
    getApiUser.mockResolvedValue({
      user: { id: "user-sikh-1" },
      error: null,
      supabase: mockSupabase,
    });

    const req = new NextRequest("http://localhost:3000/api/native/progress-summary");
    const res = await GET(req);
    const body = await res.json();

    expect(body.coreProfile.isComplete).toBe(true);
    const suggestionKeys = body.completion.suggestions.map((s: { key: string }) => s.key);
    expect(suggestionKeys).not.toContain("calendar_profile");
    expect(suggestionKeys).not.toContain("rashi");
    expect(suggestionKeys).not.toContain("nakshatra");
    expect(suggestionKeys).not.toContain("gotra");
    expect(suggestionKeys).not.toContain("calendar_scope");

    // Only general suggestions present
    expect(suggestionKeys).toEqual(["city", "life_stage"]);
  });

  it("suggests practice goals only after meaningful practice history exists", async () => {
    profileRow = {
      id: "user-practice-history",
      full_name: "Seeker",
      tradition: "sikh",
      app_language: "pa",
      city: "London",
      life_stage: "grihastha",
      onboarding_goal: null,
    };
    sadhanaRows = [{
      date: "2026-08-22",
      japa_done: true,
      quiz_done: false,
      nitya_done: false,
      pathshala_done: false,
      dharmveer_done: false,
      streak_count: 1,
    }];
    getApiUser.mockResolvedValue({
      user: { id: "user-practice-history" },
      error: null,
      supabase: mockSupabase,
    });

    const res = await GET(new NextRequest("http://localhost:3000/api/native/progress-summary"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.completion.suggestions.map((item: { key: string }) => item.key)).toEqual(["onboarding_goal"]);
  });

  it("returns zero suggestions and 100% completion for fully enriched profile", async () => {
    profileRow = {
      id: "user-hindu-full",
      full_name: "Priya Devi",
      tradition: "hindu",
      app_language: "hi",
      city: "Varanasi",
      country: "India",
      life_stage: "grihastha",
      rashi: "karka",
      nakshatra: "pushya",
      gotra: "Kashyap",
      calendar_profile: "north_indian_purnimanta",
      calendar_scope: "all_observances",
      onboarding_goal: "daily_practice,peace",
    };
    getApiUser.mockResolvedValue({
      user: { id: "user-hindu-full" },
      error: null,
      supabase: mockSupabase,
    });

    const req = new NextRequest("http://localhost:3000/api/native/progress-summary");
    const res = await GET(req);
    const body = await res.json();

    expect(body.coreProfile.isComplete).toBe(true);
    expect(body.completion.pct).toBe(100);
    expect(body.completion.suggestions).toEqual([]);
    expect(body.completion.missing).toEqual([]);
  });
});
