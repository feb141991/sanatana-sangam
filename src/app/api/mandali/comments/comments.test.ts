import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "./route";

type Row = { id: string; post_id: string; author_id: string; parent_id: string | null; client_operation_id: string | null };

let rows: Row[] = [];
let insertCount = 0;
let nextId = 1;
let forceUniqueViolationOnce = false;

const getApiUser = vi.fn();
const loadPostComments = vi.fn();
const loadSingleComment = vi.fn();
vi.mock("@/lib/api-auth", () => ({ getApiUser: (...a: unknown[]) => getApiUser(...a) }));
vi.mock("@/lib/api-guards", () => ({ assertNotBanned: async () => null }));
vi.mock("@/lib/api-security", () => ({ rejectLargeRequest: () => null, rateLimitByIp: () => null }));
vi.mock("@/lib/mandali-data-server", () => ({
  loadPostComments: (...a: unknown[]) => loadPostComments(...a),
  loadSingleComment: (...a: unknown[]) => loadSingleComment(...a),
}));

const mockAdmin = {
  from: (table: string) => {
    if (table === "posts") {
      return {
        select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { id: "post-1", author_id: "post-author" }, error: null }) }) }),
      };
    }
    if (table === "user_blocked_profiles") {
      return { select: () => ({ or: () => ({ limit: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) }) };
    }
    if (table !== "post_comments") return {};
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
            const id = `comment-${nextId++}`;
            rows.push({
              id,
              post_id: payload.post_id as string,
              author_id: payload.author_id as string,
              parent_id: (payload.parent_id as string) ?? null,
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

describe("POST /api/mandali/comments -- idempotency", () => {
  beforeEach(() => {
    getApiUser.mockReset();
    getApiUser.mockResolvedValue({ user: { id: "user-1" } });
    loadPostComments.mockReset();
    loadPostComments.mockResolvedValue({ comments: [], nextCursor: null });
    loadSingleComment.mockReset();
    loadSingleComment.mockResolvedValue(null);
    rows = [];
    insertCount = 0;
    nextId = 1;
    forceUniqueViolationOnce = false;
  });

  function req(body: Record<string, unknown>) {
    return new NextRequest("http://localhost:3000/api/mandali/comments", { method: "POST", body: JSON.stringify(body) });
  }

  it("inserts once for a fresh clientOperationId", async () => {
    const res = await POST(req({ postId: "post-1", body: "Namaste", clientOperationId: "11111111-1111-1111-1111-111111111111" }));
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.id).toBe("comment-1");
    expect(json.idempotentReplay).toBeUndefined();
    expect(insertCount).toBe(1);
  });

  it("a retry with the same clientOperationId returns the existing comment instead of creating a duplicate", async () => {
    const opId = "22222222-2222-2222-2222-222222222222";
    const first = await POST(req({ postId: "post-1", body: "Sat Sri Akal", clientOperationId: opId }));
    const firstJson = await first.json();

    const retry = await POST(req({ postId: "post-1", body: "Sat Sri Akal", clientOperationId: opId }));
    const retryJson = await retry.json();

    expect(retry.status).toBe(201);
    expect(retryJson.id).toBe(firstJson.id);
    expect(retryJson.idempotentReplay).toBe(true);
    expect(insertCount).toBe(1);
  });

  it("a concurrent race that hits the unique constraint still returns the existing comment, not a 500", async () => {
    const opId = "33333333-3333-3333-3333-333333333333";
    rows.push({ id: "comment-raced", post_id: "post-1", author_id: "user-1", parent_id: null, client_operation_id: opId });
    const res = await POST(req({ postId: "post-1", body: "Race", clientOperationId: opId }));
    const json = await res.json();
    expect(res.status).toBe(201);
    expect(json.id).toBe("comment-raced");
    expect(json.idempotentReplay).toBe(true);
  });

  it("still works with no clientOperationId at all (backward compatible, e.g. web)", async () => {
    const res = await POST(req({ postId: "post-1", body: "No op id" }));
    expect(res.status).toBe(201);
    expect(insertCount).toBe(1);
  });

  it("rejects a non-UUID clientOperationId", async () => {
    const res = await POST(req({ postId: "post-1", body: "Bad id", clientOperationId: "not-a-uuid" }));
    expect(res.status).toBe(400);
    expect(insertCount).toBe(0);
  });
});

// Comment-thread pagination and the single-comment lookup path (fix for
// realtime new-comment events re-fetching the whole thread -- see
// app/(tabs)/mandali.tsx's handleCommentRealtimeChange, native repo).
describe("GET /api/mandali/comments", () => {
  beforeEach(() => {
    getApiUser.mockReset();
    getApiUser.mockResolvedValue({ user: { id: "user-1" } });
    loadPostComments.mockReset();
    loadPostComments.mockResolvedValue({ comments: [], nextCursor: null });
    loadSingleComment.mockReset();
    loadSingleComment.mockResolvedValue(null);
  });

  function getReq(query: string) {
    return new NextRequest(`http://localhost:3000/api/mandali/comments${query}`);
  }

  it("401s when unauthenticated, without ever calling loadPostComments", async () => {
    getApiUser.mockResolvedValue({ user: null });
    const res = await GET(getReq("?postId=post-1"));
    expect(res.status).toBe(401);
    expect(loadPostComments).not.toHaveBeenCalled();
  });

  it("400s when postId is missing", async () => {
    const res = await GET(getReq(""));
    expect(res.status).toBe(400);
    expect(loadPostComments).not.toHaveBeenCalled();
  });

  it("paginates: passes cursor and limit through to loadPostComments and returns its page shape as-is", async () => {
    loadPostComments.mockResolvedValue({ comments: [{ id: "c1" }], nextCursor: "opaque-cursor-abc" });
    const res = await GET(getReq("?postId=post-1&cursor=prev-cursor&limit=10"));
    expect(loadPostComments).toHaveBeenCalledWith("user-1", "post-1", { cursor: "prev-cursor", limit: 10 });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ comments: [{ id: "c1" }], nextCursor: "opaque-cursor-abc" });
  });

  it("first page (no cursor) passes cursor as null, not the string 'null'", async () => {
    await GET(getReq("?postId=post-1"));
    expect(loadPostComments).toHaveBeenCalledWith("user-1", "post-1", { cursor: null, limit: undefined });
  });

  it("commentId present: looks up a single comment via loadSingleComment instead of paginating the thread", async () => {
    loadSingleComment.mockResolvedValue({ id: "comment-42", body: "Namaste" });
    const res = await GET(getReq("?postId=post-1&commentId=comment-42"));
    expect(loadSingleComment).toHaveBeenCalledWith("user-1", "post-1", "comment-42");
    expect(loadPostComments).not.toHaveBeenCalled();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ comment: { id: "comment-42", body: "Namaste" } });
  });

  it("commentId for a missing/filtered comment returns { comment: null }, not a 404 -- the caller treats it as nothing to add", async () => {
    loadSingleComment.mockResolvedValue(null);
    const res = await GET(getReq("?postId=post-1&commentId=comment-missing"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ comment: null });
  });

  it("surfaces a thrown error from loadPostComments as a 500, not an unhandled rejection", async () => {
    loadPostComments.mockRejectedValue(new Error("db down"));
    const res = await GET(getReq("?postId=post-1"));
    expect(res.status).toBe(500);
  });
});
