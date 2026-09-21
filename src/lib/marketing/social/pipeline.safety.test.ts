/**
 * Phase 2 safety test matrix (approved Marketing Studio social pipeline
 * plan, section 12, step 2) -- required before the first real Facebook
 * send in manual mode. Runs pipeline.ts's real orchestration logic against
 * an in-memory fake Supabase client and fake publisher modules, so a
 * concurrency/lease/pause/staleness/expiry/window bug shows up as a wrong
 * *call count or status transition*, not just a wrong SQL string.
 *
 * The fake publisher call counts are the "controlled fake publisher
 * endpoint's own received-request count" the plan calls for -- assertions
 * here check `publishToFacebookPage`'s mock call count directly, never the
 * database attempt log alone (the log itself is what a concurrency bug
 * could corrupt).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("./publishers/meta", () => ({
  publishToFacebookPage: vi.fn(),
  publishToInstagram: vi.fn()
}));
vi.mock("./publishers/linkedin", () => ({
  publishToLinkedIn: vi.fn()
}));
vi.mock("./token-crypto", () => ({
  decryptSocialToken: vi.fn(() => "fake-decrypted-access-token")
}));
vi.mock("./image-storage", async () => {
  const actual = await vi.importActual<typeof import("./image-storage")>("./image-storage");
  return {
    ...actual,
    uploadDraftSocialImage: vi.fn(async () => ({ draftPath: "fake/draft.webp", contentHash: "fixed-draft-hash" })),
    getSignedDraftImageUrl: vi.fn(async () => "https://example.com/signed-draft.webp"),
    getDraftImageContentHash: vi.fn(async () => "fixed-draft-hash"),
    releaseApprovedSocialImage: vi.fn(async () => ({ publicUrl: "https://example.com/public.webp", contentHash: "fixed-draft-hash" }))
  };
});
vi.mock("./caption-generator", async () => {
  const actual = await vi.importActual<typeof import("./caption-generator")>("./caption-generator");
  return {
    ...actual,
    draftSocialCaption: vi.fn(async () => ({
      caption: "A generated caption",
      hashtags: ["dharma"],
      ctaUrl: "https://www.shoonaya.com",
      modelUsed: "fake-model",
      provider: "fake-provider"
    }))
  };
});

import { publishApprovedPost, advancePostCaptions } from "./pipeline";
import { publishToFacebookPage } from "./publishers/meta";
import { publishToLinkedIn } from "./publishers/linkedin";
import { draftSocialCaption, GenerationPausedError } from "./caption-generator";
import { computeSocialVariantContentHash } from "./content-hash";

// ─── Minimal in-memory fake Supabase client, purpose-built for exactly the
// query shapes pipeline.ts issues (see the file for the full list). Not a
// general-purpose fake -- a thin double whose whole job is making the real
// orchestration logic in pipeline.ts observable and controllable.

type Row = Record<string, any>;
type Db = Map<string, Row[]>;

function table(db: Db, name: string): Row[] {
  if (!db.has(name)) db.set(name, []);
  return db.get(name)!;
}

class FakeQuery implements PromiseLike<{ data: any; error: any }> {
  private filters: Array<{ col: string; val: any; op: "eq" | "in" }> = [];
  private patch: Row | null = null;
  private selectStr = "*";

  constructor(private rows: Row[]) {}

  select(s?: string) {
    this.selectStr = s ?? "*";
    return this;
  }
  update(patch: Row) {
    this.patch = patch;
    return this;
  }
  eq(col: string, val: any) {
    this.filters.push({ col, val, op: "eq" });
    return this;
  }
  in(col: string, val: any[]) {
    this.filters.push({ col, val, op: "in" });
    return this;
  }

  private matched(): Row[] {
    return this.rows.filter(r => this.filters.every(f => (f.op === "eq" ? r[f.col] === f.val : f.val.includes(r[f.col]))));
  }

  private run(): Row[] {
    let rows = this.matched();
    if (this.patch) {
      rows.forEach(r => Object.assign(r, this.patch));
    }
    if (this.selectStr.includes("social_platform_accounts:approved_platform_account_id")) {
      const accounts = table(GLOBAL_DB, "social_platform_accounts");
      rows = rows.map(r => ({ ...r, social_platform_accounts: accounts.find(a => a.id === r.approved_platform_account_id) ?? null }));
    }
    return rows;
  }

  async single() {
    const rows = this.run();
    if (rows.length !== 1) return { data: null, error: { message: "not found or not unique" } };
    return { data: rows[0], error: null };
  }

  async maybeSingle() {
    const rows = this.run();
    return { data: rows[0] ?? null, error: null };
  }

  then<TResult1 = { data: any; error: any }, TResult2 = never>(
    onfulfilled?: ((value: { data: any; error: any }) => TResult1 | PromiseLike<TResult1>) | null
  ): PromiseLike<TResult1 | TResult2> {
    const result = { data: this.run(), error: null };
    return Promise.resolve(onfulfilled ? onfulfilled(result) : (result as any));
  }
}

let GLOBAL_DB: Db;

function rpc(db: Db, name: string, params: Record<string, any>) {
  if (name === "claim_social_post_stage") {
    const posts = table(db, "social_posts");
    const post = posts.find(p => p.id === params.p_post_id);
    const now = new Date();
    if (!post || post.pipeline_stage !== params.p_expected_stage) return { data: null, error: null };
    if (post.lease_expires_at && new Date(post.lease_expires_at) >= now) return { data: null, error: null };
    post.claimed_by = params.p_worker_token;
    post.lease_expires_at = new Date(now.getTime() + params.p_lease_seconds * 1000).toISOString();
    return { data: { ...post }, error: null };
  }

  if (name === "start_social_publish_attempt") {
    const attempts = table(db, "social_publish_attempts");
    const unresolved = attempts.some(
      a =>
        a.variant_id === params.p_variant_id &&
        a.event_type === "started" &&
        !attempts.some(t => t.attempt_id === a.attempt_id && ["succeeded", "rejected", "unknown"].includes(t.event_type))
    );
    if (unresolved) {
      return { data: null, error: { message: `variant ${params.p_variant_id} already has an unresolved started attempt` } };
    }
    attempts.push({ attempt_id: params.p_attempt_id, variant_id: params.p_variant_id, event_type: "started" });
    const variant = table(db, "social_post_variants").find(v => v.id === params.p_variant_id);
    if (variant) variant.publish_status = "publishing";
    return { data: null, error: null };
  }

  if (name === "record_social_publish_result") {
    table(db, "social_publish_attempts").push({ attempt_id: params.p_attempt_id, variant_id: params.p_variant_id, event_type: params.p_event_type });
    const statusMap: Record<string, string> = { succeeded: "published", rejected: "failed", unknown: "outcome_unknown" };
    const variant = table(db, "social_post_variants").find(v => v.id === params.p_variant_id);
    if (variant) {
      variant.publish_status = statusMap[params.p_event_type];
      variant.attempt_count = (variant.attempt_count ?? 0) + 1;
    }
    return { data: null, error: null };
  }

  throw new Error(`FakeSupabase: unhandled rpc "${name}"`);
}

function makeFakeSupabase(db: Db) {
  GLOBAL_DB = db;
  return {
    from(name: string) {
      return new FakeQuery(table(db, name));
    },
    async rpc(name: string, params: Record<string, any>) {
      return rpc(db, name, params);
    }
  };
}

// ─── Fixtures ────────────────────────────────────────────────────────────

const SCHEDULED_AT = "2026-09-25T03:30:00.000Z"; // 09:00 IST

function baseCaption() {
  return {
    platform: "facebook" as const,
    caption: "Approved caption",
    hashtags: ["dharma"],
    cta_url: "https://www.shoonaya.com",
    source_citations: [] as unknown[]
  };
}

function seedApprovedPost(db: Db, overrides: Partial<Row> = {}) {
  const manifestHash = computeSocialVariantContentHash(baseCaption());
  const post: Row = {
    id: "post-1",
    pipeline_stage: "approved",
    frozen_scheduled_publish_at: SCHEDULED_AT,
    image_asset_url: "post-1/draft.webp",
    source_snapshot: { theme_title: "Test theme" },
    claimed_by: null,
    lease_expires_at: null,
    ...overrides
  };
  table(db, "social_posts").push(post);

  const variant: Row = {
    id: "variant-1",
    post_id: "post-1",
    platform: "facebook",
    caption: baseCaption().caption,
    hashtags: baseCaption().hashtags,
    cta_url: baseCaption().cta_url,
    source_citations: baseCaption().source_citations,
    publish_status: "pending",
    approved_manifest_hash: manifestHash,
    approved_image_content_hash: "fixed-draft-hash",
    approved_source_content_hash: require("crypto").createHash("sha256").update(JSON.stringify(post.source_snapshot)).digest("hex"),
    approved_platform_account_id: "account-1",
    attempt_count: 0
  };
  table(db, "social_post_variants").push(variant);

  table(db, "social_platform_accounts").push({
    id: "account-1",
    platform: "facebook",
    access_token_enc: "irrelevant-mocked",
    key_version: 1
  });

  table(db, "social_publishing_global_pause").push({ id: true, generation_paused: false, publishing_paused: false });

  return { post, variant };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-09-25T04:00:00.000Z")); // after scheduled time by default
  (publishToFacebookPage as any).mockResolvedValue({ outcome: "succeeded", externalPostId: "fb-123", permalinkUrl: "https://facebook.com/fb-123" });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("Phase 2 safety matrix -- concurrency", () => {
  it("two overlapping publish calls for the same post produce exactly one external send", async () => {
    const db: Db = new Map();
    seedApprovedPost(db);
    const supabase = makeFakeSupabase(db);

    const [a, b] = await Promise.all([
      publishApprovedPost(supabase, "post-1", { manualPublishNow: false, triggeredBy: "worker-a" }),
      publishApprovedPost(supabase, "post-1", { manualPublishNow: false, triggeredBy: "worker-b" })
    ]);

    expect(publishToFacebookPage).toHaveBeenCalledTimes(1);
    const attempted = [a, b].filter(r => r.attempted).length;
    expect(attempted).toBe(1);
    const variant = table(db, "social_post_variants")[0];
    expect(variant.publish_status).toBe("published");
  });
});

describe("Phase 2 safety matrix -- lease expiry mid-send", () => {
  it("a post reclaimed after lease expiry never re-sends a variant already mid-flight", async () => {
    const db: Db = new Map();
    const { variant } = seedApprovedPost(db, {
      // Simulate: worker A already claimed and moved the post to 'publishing',
      // started a send for the variant (publish_status flipped to
      // 'publishing' by start_social_publish_attempt), then its lease
      // expired before the send resolved.
      pipeline_stage: "approved",
      lease_expires_at: "2026-09-25T03:35:00.000Z" // already expired relative to fake "now"
    });
    variant.publish_status = "publishing"; // in-flight from the presumed-dead worker A
    table(db, "social_publish_attempts").push({ attempt_id: "attempt-a", variant_id: "variant-1", event_type: "started" });

    const supabase = makeFakeSupabase(db);
    const result = await publishApprovedPost(supabase, "post-1", { manualPublishNow: false, triggeredBy: "worker-b" });

    expect(result.attempted).toBe(true); // worker B does claim and process the post...
    expect(publishToFacebookPage).not.toHaveBeenCalled(); // ...but never re-sends this variant
    expect(variant.publish_status).toBe("publishing"); // left exactly as-is, not silently resolved
  });
});

describe("Phase 2 safety matrix -- pause switches", () => {
  it("publishing_paused stops the send and leaves the variant pending", async () => {
    const db: Db = new Map();
    const { variant } = seedApprovedPost(db);
    table(db, "social_publishing_global_pause")[0].publishing_paused = true;
    const supabase = makeFakeSupabase(db);

    await publishApprovedPost(supabase, "post-1", { manualPublishNow: false, triggeredBy: "worker-a" });

    expect(publishToFacebookPage).not.toHaveBeenCalled();
    expect(variant.publish_status).toBe("pending");
  });

  it("generation_paused stops caption drafting and releases the lease without advancing the stage", async () => {
    const db: Db = new Map();
    table(db, "social_posts").push({
      id: "post-2",
      pipeline_stage: "image_ready",
      source_type: "general_theme",
      source_snapshot: {},
      claimed_by: null,
      lease_expires_at: null
    });
    table(db, "social_post_variants").push({ id: "variant-2", post_id: "post-2", platform: "facebook", caption: "", generation_attempt_count: 0 });
    (draftSocialCaption as any).mockRejectedValueOnce(new GenerationPausedError());
    const supabase = makeFakeSupabase(db);

    const result = await advancePostCaptions(supabase, "post-2");

    expect(result).toEqual({ advanced: false, reason: "generation_paused" });
    const post = table(db, "social_posts")[0];
    expect(post.pipeline_stage).toBe("image_ready"); // never advanced past image_ready
    expect(post.claimed_by).toBeNull(); // lease released, not held for 5 minutes while paused
  });
});

describe("Phase 2 safety matrix -- stale approval", () => {
  it("a caption changed after approval is caught before publish, never sent", async () => {
    const db: Db = new Map();
    const { variant } = seedApprovedPost(db);
    variant.caption = "This caption was edited after approval"; // content_hash on the row is now stale
    const supabase = makeFakeSupabase(db);

    await publishApprovedPost(supabase, "post-1", { manualPublishNow: false, triggeredBy: "worker-a" });

    expect(publishToFacebookPage).not.toHaveBeenCalled();
    expect(variant.publish_status).toBe("skipped");
    expect(variant.last_error_code).toBe("caption_or_hashtags_changed_since_approval");
  });

  it("a source content change since approval is caught before publish", async () => {
    const db: Db = new Map();
    const { post } = seedApprovedPost(db);
    post.source_snapshot = { theme_title: "A different theme entirely" };
    const supabase = makeFakeSupabase(db);

    await publishApprovedPost(supabase, "post-1", { manualPublishNow: false, triggeredBy: "worker-a" });

    expect(publishToFacebookPage).not.toHaveBeenCalled();
    const variant = table(db, "social_post_variants")[0];
    expect(variant.publish_status).toBe("skipped");
    expect(variant.last_error_code).toBe("source_content_changed_since_approval");
  });
});

describe("Phase 2 safety matrix -- per-destination expiry", () => {
  it("a pending variant past the expiry deadline is marked expired when nothing was attempted", async () => {
    const db: Db = new Map();
    const { variant } = seedApprovedPost(db);
    vi.setSystemTime(new Date("2026-09-26T10:00:00.000Z")); // well past scheduled + 20h grace
    const supabase = makeFakeSupabase(db);

    await publishApprovedPost(supabase, "post-1", { manualPublishNow: false, triggeredBy: "worker-a" });

    expect(publishToFacebookPage).not.toHaveBeenCalled();
    expect(variant.publish_status).toBe("expired");
  });

  it("an outcome_unknown variant past the deadline is never overwritten by expiry", async () => {
    const db: Db = new Map();
    const { variant } = seedApprovedPost(db);
    variant.publish_status = "outcome_unknown"; // a genuinely unresolved prior attempt
    vi.setSystemTime(new Date("2026-09-26T10:00:00.000Z")); // well past the deadline
    const supabase = makeFakeSupabase(db);

    await publishApprovedPost(supabase, "post-1", { manualPublishNow: false, triggeredBy: "worker-a" });

    expect(publishToFacebookPage).not.toHaveBeenCalled();
    expect(variant.publish_status).toBe("outcome_unknown"); // untouched, never silently relabeled expired
  });
});

describe("Phase 2 safety matrix -- scheduled window and Publish now", () => {
  it("does not attempt a tick-driven publish before the scheduled time", async () => {
    const db: Db = new Map();
    seedApprovedPost(db);
    vi.setSystemTime(new Date("2026-09-25T02:00:00.000Z")); // before 03:30 scheduled time
    const supabase = makeFakeSupabase(db);

    const result = await publishApprovedPost(supabase, "post-1", { manualPublishNow: false, triggeredBy: "worker-a" });

    expect(result).toEqual({ attempted: false, reason: "not_yet_scheduled_time" });
    expect(publishToFacebookPage).not.toHaveBeenCalled();
  });

  it("Publish now bypasses the not-before-scheduled-time check", async () => {
    const db: Db = new Map();
    seedApprovedPost(db);
    vi.setSystemTime(new Date("2026-09-25T02:00:00.000Z")); // before scheduled time
    const supabase = makeFakeSupabase(db);

    const result = await publishApprovedPost(supabase, "post-1", { manualPublishNow: true, triggeredBy: "admin" });

    expect(result.attempted).toBe(true);
    expect(publishToFacebookPage).toHaveBeenCalledTimes(1);
  });

  it("Publish now bypasses the expiry deadline instead of marking the variant expired", async () => {
    const db: Db = new Map();
    const { variant } = seedApprovedPost(db);
    vi.setSystemTime(new Date("2026-09-26T10:00:00.000Z")); // well past the deadline
    const supabase = makeFakeSupabase(db);

    await publishApprovedPost(supabase, "post-1", { manualPublishNow: true, triggeredBy: "admin" });

    expect(publishToFacebookPage).toHaveBeenCalledTimes(1);
    expect(variant.publish_status).toBe("published");
  });
});

describe("Phase 2 safety matrix -- LinkedIn publisher is never invoked for a Facebook variant", () => {
  it("routes strictly by platform", async () => {
    const db: Db = new Map();
    seedApprovedPost(db);
    const supabase = makeFakeSupabase(db);

    await publishApprovedPost(supabase, "post-1", { manualPublishNow: false, triggeredBy: "worker-a" });

    expect(publishToLinkedIn).not.toHaveBeenCalled();
  });
});
