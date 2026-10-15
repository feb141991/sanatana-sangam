import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

type Call = { table: string; op: string; payload?: unknown };

const mocks = vi.hoisted(() => ({
  verifyAdminCookieAuth: vi.fn(),
  verifyAdminToken: vi.fn(),
  generateWithProvider: vi.fn(),
  tables: {} as Record<string, { rows?: unknown[]; single?: unknown; error?: { message: string } | null }>,
  calls: [] as Call[],
}));

vi.mock("@/lib/admin-auth", () => ({
  ADMIN_COOKIE: "sangam_admin_session",
  verifyAdminCookieAuth: mocks.verifyAdminCookieAuth,
  verifyAdminToken: mocks.verifyAdminToken,
}));
vi.mock("@/lib/ai/providers/inference", () => ({ generateWithProvider: mocks.generateWithProvider }));

// A chainable stand-in for the database: every select/filter returns itself, and awaiting it yields the table's canned result.
vi.mock("@/lib/supabase-admin", () => ({
  createAdminClient: () => ({
    from(table: string) {
      const entry = () => mocks.tables[table] ?? {};
      let op = "select";
      const chain: any = {
        select: () => chain,
        eq: () => chain,
        order: () => chain,
        limit: () => chain,
        insert: (payload: unknown) => { op = "insert"; mocks.calls.push({ table, op, payload }); return chain; },
        update: (payload: unknown) => { op = "update"; mocks.calls.push({ table, op, payload }); return chain; },
        upsert: (payload: unknown) => { op = "upsert"; mocks.calls.push({ table, op, payload }); return chain; },
        delete: () => { op = "delete"; mocks.calls.push({ table, op }); return chain; },
        single: () => Promise.resolve({ data: entry().single ?? null, error: entry().error ?? null }),
        maybeSingle: () => Promise.resolve({ data: entry().single ?? null, error: entry().error ?? null }),
        then: (resolve: (v: unknown) => unknown) => resolve({ data: entry().rows ?? [], error: op === "select" ? null : entry().error ?? null }),
      };
      return chain;
    },
  }),
}));

import { POST } from "./route";

const post = (body: unknown) =>
  new NextRequest("https://www.shoonaya.com/api/admin/observance-content", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

const inserted = (table: string) => mocks.calls.filter((c) => c.table === table && c.op === "insert");

beforeEach(() => {
  vi.clearAllMocks();
  mocks.calls.length = 0;
  mocks.tables = {};
  mocks.verifyAdminCookieAuth.mockResolvedValue(null);
  mocks.verifyAdminToken.mockResolvedValue({ username: "meera" });
});

describe("generate_draft needs a source a person approved", () => {
  it("refuses with 409 and never calls the model when no approved source exists, even if an earlier draft exists", async () => {
    mocks.tables = {
      observance_definitions: { single: { id: "d1", slug: "ekadashi", display_name: "Ekadashi", tradition: "hindu" } },
      observance_content_sources: { rows: [] },
      // An earlier AI draft exists. It must not be turned into a source.
      observance_story_versions: { rows: [{ version: 1, id: "s1" }] },
      observance_story_translations: { rows: [{ language: "en", teaser: "t", origin: "o", significance: "s" }] },
    };
    const response = await POST(post({ action: "generate_draft", definitionId: "d1" }));
    expect(response.status).toBe(409);
    expect((await response.json()).error).toMatch(/approved source/i);
    expect(mocks.generateWithProvider).not.toHaveBeenCalled();
    expect(inserted("observance_content_sources")).toHaveLength(0);
  });

  it("asks the model for no minimum length, so it is never pushed to pad beyond its sources", async () => {
    mocks.tables = {
      observance_definitions: { single: { id: "d1", slug: "ekadashi", display_name: "Ekadashi", tradition: "hindu" } },
      observance_content_sources: { rows: [{ id: "src1", title: "T", citation: "C", excerpt: "E" }] },
      observance_story_versions: { rows: [], single: { id: "new-story" } },
    };
    mocks.generateWithProvider.mockResolvedValue({ text: "not json" });
    await POST(post({ action: "generate_draft", definitionId: "d1" })).catch(() => undefined);
    const prompt = JSON.stringify(mocks.generateWithProvider.mock.calls[0]?.[0] ?? "");
    expect(prompt).toContain("Use only supplied excerpts");
    expect(prompt).not.toMatch(/minimum\s+\d+/i);
    expect(prompt).not.toMatch(/\d+\s*-\s*\d+\s+words/i);
  });
});

describe("enrich_translations is a faithful translation", () => {
  const setup = () => {
    mocks.tables = {
      observance_story_versions: { single: { id: "s1" } },
      observance_definitions: { single: { id: "d1", display_name: "Ekadashi", tradition: "hindu" } },
      observance_story_translations: { rows: [{ language: "en", teaser: "T", origin: "O", significance: "S", rituals: [] }] },
    };
  };

  it("tells the model to add nothing and sets no minimum length", async () => {
    setup();
    mocks.generateWithProvider.mockResolvedValue({ text: JSON.stringify({ translations: { hi: { origin: "x", significance: "y" } } }) });
    await POST(post({ action: "enrich_translations", storyId: "s1", definitionId: "d1", targetLanguages: ["hi"] }));
    const prompt = JSON.stringify(mocks.generateWithProvider.mock.calls[0][0]);
    expect(prompt).toMatch(/Never add story, ritual, history/i);
    expect(prompt).not.toMatch(/minimum\s+\d+/i);
    expect(prompt).not.toMatch(/\bexpand\b/i);
  });

  it("reports the languages that were actually stored, and fails when none were", async () => {
    setup();
    mocks.generateWithProvider.mockResolvedValue({ text: JSON.stringify({ translations: { hi: { origin: "x", significance: "y" }, pa: { origin: "", significance: "" } } }) });
    const ok = await POST(post({ action: "enrich_translations", storyId: "s1", definitionId: "d1", targetLanguages: ["hi", "pa"] }));
    expect((await ok.json()).languages).toEqual(["hi"]);

    mocks.generateWithProvider.mockResolvedValue({ text: JSON.stringify({ translations: { hi: { origin: "", significance: "" } } }) });
    const none = await POST(post({ action: "enrich_translations", storyId: "s1", definitionId: "d1", targetLanguages: ["hi"] }));
    expect(none.status).toBe(502);
  });

  it("returns an error instead of success when the database refuses the write", async () => {
    setup();
    mocks.tables.observance_story_translations = { rows: [{ language: "en", teaser: "T", origin: "O", significance: "S" }], error: { message: "boom" } };
    mocks.generateWithProvider.mockResolvedValue({ text: JSON.stringify({ translations: { hi: { origin: "x", significance: "y" } } }) });
    const response = await POST(post({ action: "enrich_translations", storyId: "s1", definitionId: "d1", targetLanguages: ["hi"] }));
    expect(response.status).toBe(500);
  });
});

describe("the review trail names the person who acted", () => {
  it("records the signed-in admin's name when a draft is rejected", async () => {
    await POST(post({ action: "reject_draft", storyId: "s1", reviewNotes: "needs a source" }));
    const updates = mocks.calls.filter((c) => c.op === "update");
    expect(updates.length).toBe(3);
    for (const u of updates) expect(u.payload).toMatchObject({ reviewed_by: "meera" });
  });

  it("falls back to 'admin' only when the session carries no name", async () => {
    mocks.verifyAdminToken.mockResolvedValue(null);
    await POST(post({ action: "reject_draft", storyId: "s1" }));
    for (const u of mocks.calls.filter((c) => c.op === "update")) expect(u.payload).toMatchObject({ reviewed_by: "admin" });
  });

  it("refuses a request with no admin cookie before reading the body", async () => {
    mocks.verifyAdminCookieAuth.mockResolvedValue(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));
    expect((await POST(post({ action: "reject_draft", storyId: "s1" }))).status).toBe(401);
    expect(mocks.calls).toHaveLength(0);
  });
});
