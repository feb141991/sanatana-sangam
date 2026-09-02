import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";

type Row = { id: string; author_id: string; mandali_id: string; client_operation_id: string | null };

let rows: Row[] = [];
let insertCount = 0;
let nextId = 1;
let forceUniqueViolationOnce = false;

const getApiUser = vi.fn();
vi.mock("@/lib/api-auth", () => ({ getApiUser: (...a: unknown[]) => getApiUser(...a) }));
vi.mock("@/lib/api-guards", () => ({ assertNotBanned: async () => null }));
vi.mock("@/lib/api-security", () => ({ rejectLargeRequest: () => null, rateLimitByIp: () => null }));

const mockAdmin = {
  from: (table: string) => {
    if (table === "profiles") {
      return {
        select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { mandali_id: "mandali-1" }, error: null }) }) }),
      };
    }
    if (table !== "posts") return {};
    return {
      select: (_cols: string) => ({
        eq: (col: string, val: string) => ({
          maybeSingle: async () => {
            const match = rows.find((r) => (r as any)[col] === val);
            return { data: match ?? null, error: null };
          },
        }),
      }),
      insert: (payload: Record<string, unknown>) => ({
        select: (_cols: string) => ({
          single: async () => {
            insertCount += 1;
            if (forceUniqueViolationOnce) {
              forceUniqueViolationOnce = false;
              return { data: null, error: { code: "23505", message: "duplicate key" } };
            }
            const id = `post-${nextId++}`;
            rows.push({
              id,
              author_id: payload.author_id as string,
              mandali_id: payload.mandali_id as string,
              client_operation_id: (payload.client_operation_id as string) ?? null,
            });
            return { data: { id }, error: null };
          },
        }),
      }),
    };
  },
};

vi.mock("@/lib/supabase-admin", () => ({ createAdminClient: () => mockAdmin }));

describe("POST /api/mandali/posts -- idempotency", () => {
  beforeEach(() => {
    getApiUser.mockReset();
    getApiUser.mockResolvedValue({ user: { id: "user-1" } });
    rows = [];
    insertCount = 0;
    nextId = 1;
    forceUniqueViolationOnce = false;
  });

  function req(body: Record<string, unknown>) {
    return new NextRequest("http://localhost:3000/api/mandali/posts", { method: "POST", body: JSON.stringify(body) });
  }

  it("inserts once for a fresh clientOperationId", async () => {
    const res = await POST(req({ content: "Namaste", postType: "update", clientOperationId: "11111111-1111-1111-1111-111111111111" }));
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.id).toBe("post-1");
    expect(json.idempotentReplay).toBeUndefined();
    expect(insertCount).toBe(1);
  });

  it("a retry with the same clientOperationId returns the existing post instead of creating a duplicate", async () => {
    const opId = "22222222-2222-2222-2222-222222222222";
    const first = await POST(req({ content: "Sat Sri Akal", postType: "update", clientOperationId: opId }));
    const firstJson = await first.json();

    const retry = await POST(req({ content: "Sat Sri Akal", postType: "update", clientOperationId: opId }));
    const retryJson = await retry.json();

    expect(retry.status).toBe(201);
    expect(retryJson.id).toBe(firstJson.id);
    expect(retryJson.idempotentReplay).toBe(true);
    expect(insertCount).toBe(1);
  });

  it("a concurrent race that hits the unique constraint still returns the existing post, not a 500", async () => {
    const opId = "33333333-3333-3333-3333-333333333333";
    // Simulate: another in-flight request already inserted this exact
    // operation id between this request's own lookup and its insert.
    rows.push({ id: "post-raced", author_id: "user-1", mandali_id: "mandali-1", client_operation_id: opId });
    const res = await POST(req({ content: "Race", postType: "update", clientOperationId: opId }));
    const json = await res.json();
    expect(res.status).toBe(201);
    expect(json.id).toBe("post-raced");
    expect(json.idempotentReplay).toBe(true);
  });

  it("still works with no clientOperationId at all (backward compatible, e.g. web)", async () => {
    const res = await POST(req({ content: "No op id", postType: "update" }));
    expect(res.status).toBe(201);
    expect(insertCount).toBe(1);
  });

  it("rejects a non-UUID clientOperationId", async () => {
    const res = await POST(req({ content: "Bad id", postType: "update", clientOperationId: "not-a-uuid" }));
    expect(res.status).toBe(400);
    expect(insertCount).toBe(0);
  });
});
