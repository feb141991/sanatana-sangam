import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "node:crypto";

// The renderer is real unless a test says otherwise, so Hindu cards are genuinely drawn.
let renderOverride: null | (() => Promise<never>) = null;
vi.mock("./card-renderer", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./card-renderer")>();
  return {
    ...actual,
    renderMorningCard: (...args: Parameters<typeof actual.renderMorningCard>) =>
      renderOverride ? renderOverride() : actual.renderMorningCard(...args)
  };
});

import { CardRenderError } from "./card-renderer";
import {
  approveCard,
  checkCardDate,
  generateMorningSet,
  isRealDate,
  listMorningCards,
  MorningCardError,
  normalizeHashtags,
  rejectCard,
  todayIn,
  updateCaption,
  type MorningCardRow
} from "./service";

// ── In-memory stand-in for the table and the private bucket ───────────────────

interface Fake {
  rows: MorningCardRow[];
  files: Map<string, Buffer>;
  uploadFails: boolean;
  /** Insert a competing row just before the next insert, as a second click would. */
  raceOnNextInsert: boolean;
  client: any;
}

function makeFake(): Fake {
  const state: Fake = { rows: [], files: new Map(), uploadFails: false, raceOnNextInsert: false, client: null };
  let counter = 0;

  /** Mirrors social_morning_cards_guard (the SQL test proves the real one). */
  function applyGuard(before: MorningCardRow | null, after: MorningCardRow): MorningCardRow {
    if (before && before.status === "approved" && after.status === "approved") {
      if (before.caption !== after.caption || JSON.stringify(before.hashtags) !== JSON.stringify(after.hashtags) ||
          before.image_path !== after.image_path || before.image_content_hash !== after.image_content_hash) {
        return { ...after, status: "draft", approved_by: null, approved_at: null, approved_image_content_hash: null };
      }
    }
    return after;
  }

  function table() {
    const filters: Array<[string, any]> = [];
    const inFilters: Array<[string, any[]]> = [];
    let mode: "select" | "insert" | "update" = "select";
    let payload: any;
    const matching = () => state.rows.filter((r) => filters.every(([k, v]) => (r as any)[k] === v) && inFilters.every(([k, v]) => v.includes((r as any)[k])));
    const run = (): { data: any; error: any } => {
      if (mode === "insert") {
        if (state.raceOnNextInsert) {
          state.raceOnNextInsert = false;
          state.rows.push({ ...payload, id: `row-${++counter}`, status: "draft" } as MorningCardRow);
        }
        if (state.rows.some((r) => r.card_date === payload.card_date && r.tradition === payload.tradition)) {
          return { data: null, error: { code: "23505", message: "duplicate key value" } };
        }
        const row = { ...payload, id: `row-${++counter}`, created_at: "now", updated_at: "now" } as MorningCardRow;
        state.rows.push(row);
        return { data: [row], error: null };
      }
      if (mode === "update") {
        const hit = matching();
        hit.forEach((r) => {
          const next = applyGuard(r, { ...r, ...payload });
          Object.assign(r, next);
        });
        return { data: hit.map((r) => ({ ...r })), error: null };
      }
      return { data: matching().map((r) => ({ ...r })), error: null };
    };
    const builder: any = {
      select() { return builder; },
      insert(p: any) { mode = "insert"; payload = p; return builder; },
      update(p: any) { mode = "update"; payload = p; return builder; },
      eq(k: string, v: any) { filters.push([k, v]); return builder; },
      in(k: string, v: any[]) { inFilters.push([k, v]); return builder; },
      single: async () => {
        const r = run();
        const row = r.data?.[0];
        return { data: row ?? null, error: r.error ?? (row ? null : { message: "no rows" }) };
      },
      maybeSingle: async () => {
        const r = run();
        return { data: r.data?.[0] ?? null, error: r.error };
      },
      then(resolve: any, reject: any) { return Promise.resolve(run()).then(resolve, reject); }
    };
    return builder;
  }

  state.client = {
    from: (name: string) => {
      if (name !== "social_morning_cards") throw new Error(`unexpected table ${name}`);
      return table();
    },
    storage: {
      createBucket: () => Promise.resolve({ error: null }),
      from: () => ({
        upload: async (path: string, bytes: ArrayBuffer) => {
          if (state.uploadFails) return { error: { message: "storage offline" } };
          state.files.set(path, Buffer.from(bytes));
          return { error: null };
        },
        download: async (path: string) => {
          const file = state.files.get(path);
          return file ? { data: { arrayBuffer: async () => file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength) }, error: null } : { data: null, error: { message: "not found" } };
        },
        createSignedUrl: async (path: string) => ({ data: { signedUrl: `https://signed.example/${path}?token=t` }, error: null })
      })
    }
  };
  return state;
}

const DATE = "2026-10-16";
let db: Fake;
beforeEach(() => {
  db = makeFake();
  renderOverride = null;
});
const row = (tradition: string) => db.rows.find((r) => r.tradition === tradition)!;

describe("generateMorningSet", () => {
  it("one click: Hindu is made, and each other tradition is withheld with its own reason", async () => {
    const outcomes = await generateMorningSet(db.client, { date: DATE, createdBy: "founder" });
    const by = Object.fromEntries(outcomes.map((o) => [o.tradition, o]));

    expect(by.hindu.result).toBe("created");
    expect(row("hindu")).toMatchObject({ status: "draft", card_date: DATE, generated_by: "founder", source_ref: expect.stringMatching(/^gita-/) });
    expect(row("hindu").image_path).toMatch(/^morning\/2026-10-16-hindu\/[0-9a-f]{64}\.png$/);
    expect(row("hindu").image_content_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(row("hindu").caption).toContain("Good morning from Shoonaya.");
    expect(row("hindu").hashtags).toContain("SanatanDharma");
    expect(row("hindu").source_snapshot).toMatchObject({ script: "devanagari", translation_credit: "Translation: Annie Besant (public domain)" });

    // Buddhist and Jain: the corpora are unfit, and the row says exactly why.
    for (const t of ["buddhist", "jain"]) {
      expect(by[t]).toMatchObject({ result: "withheld", reason: "corpus_not_usable" });
      expect(row(t)).toMatchObject({ status: "withheld", withheld_reason: "corpus_not_usable", image_path: null, caption: "" });
      expect(row(t).withheld_detail).toMatch(/have /);
    }
    // Sikh: the text is usable but the Gurmukhi font is not installed.
    expect(by.sikh).toMatchObject({ result: "withheld", reason: "font_missing" });
    expect(row("sikh").withheld_detail).toMatch(/gurmukhi/i);
    expect(db.rows).toHaveLength(4);
  }, 60_000);

  it("the stored image is the card: its hash is the hash of the bytes in the bucket", async () => {
    await generateMorningSet(db.client, { date: DATE, createdBy: "founder", traditions: ["hindu"] });
    const bytes = db.files.get(row("hindu").image_path!)!;
    expect(crypto.createHash("sha256").update(bytes).digest("hex")).toBe(row("hindu").image_content_hash);
    expect(bytes.subarray(0, 4).toString("hex")).toBe("89504e47");
  });

  it("is idempotent: a second click changes nothing and makes no duplicate", async () => {
    await generateMorningSet(db.client, { date: DATE, createdBy: "founder" });
    const before = JSON.stringify(db.rows.map((r) => [r.id, r.status, r.image_content_hash, r.caption]));
    const again = await generateMorningSet(db.client, { date: DATE, createdBy: "founder" });
    expect(again.find((o) => o.tradition === "hindu")).toMatchObject({ result: "already_generated" });
    expect(db.rows).toHaveLength(4);
    expect(JSON.stringify(db.rows.map((r) => [r.id, r.status, r.image_content_hash, r.caption]))).toBe(before);
  }, 60_000);

  it("a second click racing the first is reported as already generated, not as a failure", async () => {
    db.raceOnNextInsert = true;
    const [outcome] = await generateMorningSet(db.client, { date: DATE, createdBy: "founder", traditions: ["hindu"] });
    expect(outcome.result).toBe("already_generated");
    expect(db.rows).toHaveLength(1);
  });

  it("a plain click leaves a rejected card rejected, and regenerate brings it back as a draft", async () => {
    await generateMorningSet(db.client, { date: DATE, createdBy: "founder", traditions: ["hindu"] });
    await rejectCard(db.client, row("hindu").id, "founder");
    const [plain] = await generateMorningSet(db.client, { date: DATE, createdBy: "founder", traditions: ["hindu"] });
    expect(plain.result).toBe("already_generated");
    expect(row("hindu").status).toBe("rejected");

    const [again] = await generateMorningSet(db.client, { date: DATE, createdBy: "founder", traditions: ["hindu"], regenerate: true });
    expect(again.result).toBe("regenerated");
    expect(row("hindu")).toMatchObject({ status: "draft", rejected_by: null, rejected_at: null });
  });

  it("an approved card is never overwritten, even by regenerate", async () => {
    await generateMorningSet(db.client, { date: DATE, createdBy: "founder", traditions: ["hindu"] });
    await approveCard(db.client, row("hindu").id, "founder");
    const hashBefore = row("hindu").image_content_hash;
    const [outcome] = await generateMorningSet(db.client, { date: DATE, createdBy: "founder", traditions: ["hindu"], regenerate: true });
    expect(outcome.result).toBe("not_regenerated");
    expect(row("hindu")).toMatchObject({ status: "approved", image_content_hash: hashBefore });
  });

  it("a failed regenerate never destroys the card that was already there", async () => {
    await generateMorningSet(db.client, { date: DATE, createdBy: "founder", traditions: ["hindu"] });
    const before = { ...row("hindu") };
    renderOverride = () => Promise.reject(new CardRenderError("font_not_loaded", "Mukta did not load"));

    const [outcome] = await generateMorningSet(db.client, { date: DATE, createdBy: "founder", traditions: ["hindu"], regenerate: true });

    expect(outcome).toMatchObject({ tradition: "hindu", result: "withheld", reason: "font_missing" });
    expect(db.rows).toHaveLength(1);
    expect(row("hindu")).toMatchObject({
      status: "draft",
      image_path: before.image_path,
      image_content_hash: before.image_content_hash,
      caption: before.caption
    });
  });

  it("the same holds for a rejected card: a failed regenerate leaves it rejected, with its image", async () => {
    await generateMorningSet(db.client, { date: DATE, createdBy: "founder", traditions: ["hindu"] });
    await rejectCard(db.client, row("hindu").id, "founder");
    const imageBefore = row("hindu").image_path;
    renderOverride = () => Promise.reject(new CardRenderError("content_too_long", "does not fit"));
    const [outcome] = await generateMorningSet(db.client, { date: DATE, createdBy: "founder", traditions: ["hindu"], regenerate: true });
    expect(outcome).toMatchObject({ result: "withheld", reason: "render_failed" });
    expect(row("hindu")).toMatchObject({ status: "rejected", image_path: imageBefore });
  });

  it("an upload failure during regenerate also leaves the existing card alone", async () => {
    await generateMorningSet(db.client, { date: DATE, createdBy: "founder", traditions: ["hindu"] });
    const before = { ...row("hindu") };
    db.uploadFails = true;
    const [outcome] = await generateMorningSet(db.client, { date: DATE, createdBy: "founder", traditions: ["hindu"], regenerate: true });
    expect(outcome.result).toBe("error");
    expect(row("hindu")).toMatchObject({ status: "draft", image_content_hash: before.image_content_hash });
  });

  it("a withheld card is retried by the next plain click, so fixing the cause needs no extra step", async () => {
    await generateMorningSet(db.client, { date: DATE, createdBy: "founder", traditions: ["jain"] });
    expect(row("jain").status).toBe("withheld");
    const [outcome] = await generateMorningSet(db.client, { date: DATE, createdBy: "founder", traditions: ["jain"] });
    expect(outcome).toMatchObject({ result: "withheld" });
    expect(db.rows.filter((r) => r.tradition === "jain")).toHaveLength(1);
  });

  it("a render failure withholds that card with the reason and does not stop the others", async () => {
    renderOverride = () => Promise.reject(new CardRenderError("content_too_long", "does not fit"));
    const outcomes = await generateMorningSet(db.client, { date: DATE, createdBy: "founder", traditions: ["hindu", "jain"] });
    expect(outcomes[0]).toMatchObject({ tradition: "hindu", result: "withheld", reason: "render_failed" });
    expect(outcomes[1]).toMatchObject({ tradition: "jain", result: "withheld", reason: "corpus_not_usable" });
    expect(row("hindu")).toMatchObject({ status: "withheld", image_path: null });
  });

  it("a font that did not load is reported as a font problem", async () => {
    renderOverride = () => Promise.reject(new CardRenderError("font_not_loaded", "Mukta did not load"));
    const [outcome] = await generateMorningSet(db.client, { date: DATE, createdBy: "founder", traditions: ["hindu"] });
    expect(outcome).toMatchObject({ result: "withheld", reason: "font_missing" });
  });

  it("an upload failure saves nothing, so the next click simply tries again", async () => {
    db.uploadFails = true;
    const [outcome] = await generateMorningSet(db.client, { date: DATE, createdBy: "founder", traditions: ["hindu"] });
    expect(outcome.result).toBe("error");
    expect(db.rows).toHaveLength(0);
    db.uploadFails = false;
    const [retry] = await generateMorningSet(db.client, { date: DATE, createdBy: "founder", traditions: ["hindu"] });
    expect(retry.result).toBe("created");
  });

  it("an unexpected error in one tradition is contained", async () => {
    const original = db.client.from;
    let calls = 0;
    db.client.from = (name: string) => {
      if (++calls === 1) throw new Error("database exploded");
      return original(name);
    };
    const outcomes = await generateMorningSet(db.client, { date: DATE, createdBy: "founder", traditions: ["hindu", "jain"] });
    expect(outcomes[0]).toMatchObject({ tradition: "hindu", result: "error", detail: "database exploded" });
    expect(outcomes[1].result).toBe("withheld");
  });
});

describe("listMorningCards", () => {
  it("returns the day's cards in tradition order, with a signed link only for those that have an image", async () => {
    await generateMorningSet(db.client, { date: DATE, createdBy: "founder" });
    const cards = await listMorningCards(db.client, DATE);
    expect(cards.map((c) => c.tradition)).toEqual(["hindu", "sikh", "buddhist", "jain"]);
    expect(cards[0].image_url).toMatch(/^https:\/\/signed\.example\/morning\//);
    expect(cards.slice(1).every((c) => c.image_url === null)).toBe(true);
  }, 60_000);
});

describe("updateCaption", () => {
  async function draft() {
    await generateMorningSet(db.client, { date: DATE, createdBy: "founder", traditions: ["hindu"] });
    return row("hindu");
  }

  it("saves a new caption and cleaned-up hashtags", async () => {
    const card = await draft();
    const updated = await updateCaption(db.client, card.id, { caption: "  A new line  ", hashtags: ["#One", "Two", "Two"] });
    expect(updated).toMatchObject({ caption: "A new line", hashtags: ["One", "Two"] });
  });

  it.each([
    [{ caption: "", hashtags: [] }, "caption is required"],
    [{ caption: "   ", hashtags: [] }, "caption is required"],
    [{ caption: "x".repeat(2201), hashtags: [] }, "longer than 2200"],
    [{ caption: "ok", hashtags: ["bad tag"] }, "hashtags must be words"],
    [{ caption: "ok", hashtags: "nope" }, "hashtags must be words"]
  ])("refuses bad input %#", async (input, message) => {
    const card = await draft();
    await expect(updateCaption(db.client, card.id, input)).rejects.toMatchObject({ status: 400, message: expect.stringContaining(message) });
  });

  it("editing an approved card sends it back to draft: the approval cannot survive the edit", async () => {
    const card = await draft();
    await approveCard(db.client, card.id, "founder");
    expect(row("hindu").status).toBe("approved");
    await updateCaption(db.client, card.id, { caption: "Changed after approval", hashtags: ["One"] });
    expect(row("hindu")).toMatchObject({ status: "draft", approved_by: null, approved_at: null, approved_image_content_hash: null });
  });

  it("a withheld or rejected card cannot be edited", async () => {
    await generateMorningSet(db.client, { date: DATE, createdBy: "founder", traditions: ["jain"] });
    await expect(updateCaption(db.client, row("jain").id, { caption: "x", hashtags: [] })).rejects.toMatchObject({ status: 409 });
  });

  it("an unknown card is a 404", async () => {
    await expect(updateCaption(db.client, "nope", { caption: "x", hashtags: [] })).rejects.toMatchObject({ status: 404 });
  });
});

describe("approveCard", () => {
  async function draft() {
    await generateMorningSet(db.client, { date: DATE, createdBy: "founder", traditions: ["hindu"] });
    return row("hindu");
  }

  it("approves a draft and binds the approval to the exact image", async () => {
    const card = await draft();
    const approved = await approveCard(db.client, card.id, "founder");
    expect(approved).toMatchObject({ status: "approved", approved_by: "founder", approved_image_content_hash: card.image_content_hash });
    expect(approved.approved_at).toBeTruthy();
  });

  it("will not approve twice", async () => {
    const card = await draft();
    await approveCard(db.client, card.id, "founder");
    await expect(approveCard(db.client, card.id, "founder")).rejects.toMatchObject({ status: 409, message: expect.stringContaining("Only a draft") });
  });

  it("refuses when the stored image is not the one the card says it is", async () => {
    const card = await draft();
    db.files.set(card.image_path!, Buffer.from("a different file"));
    await expect(approveCard(db.client, card.id, "founder")).rejects.toMatchObject({ status: 409, message: expect.stringContaining("no longer matches") });
    expect(row("hindu").status).toBe("draft");
  });

  it("refuses when the image cannot be read at all", async () => {
    const card = await draft();
    db.files.delete(card.image_path!);
    await expect(approveCard(db.client, card.id, "founder")).rejects.toMatchObject({ status: 409 });
    expect(row("hindu").status).toBe("draft");
  });

  it("refuses a card that was withheld: there is nothing to approve", async () => {
    await generateMorningSet(db.client, { date: DATE, createdBy: "founder", traditions: ["buddhist"] });
    await expect(approveCard(db.client, row("buddhist").id, "founder")).rejects.toMatchObject({ status: 409 });
    expect(row("buddhist").status).toBe("withheld");
  });

  it("refuses a rejected card", async () => {
    const card = await draft();
    await rejectCard(db.client, card.id, "founder");
    await expect(approveCard(db.client, card.id, "founder")).rejects.toMatchObject({ status: 409 });
  });
});

describe("rejectCard", () => {
  it("rejects a draft or an approved card, clearing any approval", async () => {
    await generateMorningSet(db.client, { date: DATE, createdBy: "founder", traditions: ["hindu"] });
    const id = row("hindu").id;
    await approveCard(db.client, id, "founder");
    const rejected = await rejectCard(db.client, id, "reviewer");
    expect(rejected).toMatchObject({ status: "rejected", rejected_by: "reviewer", approved_by: null, approved_image_content_hash: null });
  });

  it("cannot reject a withheld card", async () => {
    await generateMorningSet(db.client, { date: DATE, createdBy: "founder", traditions: ["jain"] });
    await expect(rejectCard(db.client, row("jain").id, "founder")).rejects.toBeInstanceOf(MorningCardError);
  });
});

describe("dates", () => {
  it("isRealDate rejects impossible dates that JavaScript would roll over", () => {
    expect(isRealDate("2026-10-16")).toBe(true);
    expect(isRealDate("2026-02-31")).toBe(false);
    expect(isRealDate("2026-13-01")).toBe(false);
    expect(isRealDate("26-10-16")).toBe(false);
    expect(isRealDate("2028-02-29")).toBe(true);
    expect(isRealDate("2026-02-29")).toBe(false);
  });

  it("checkCardDate allows a month back and two months ahead, nothing wilder", () => {
    expect(checkCardDate("2026-10-16", "2026-10-16")).toBeNull();
    expect(checkCardDate("2026-09-16", "2026-10-16")).toBeNull();
    expect(checkCardDate("2026-09-15", "2026-10-16")).toMatch(/past/);
    expect(checkCardDate("2026-12-15", "2026-10-16")).toBeNull();
    expect(checkCardDate("2026-12-16", "2026-10-16")).toMatch(/ahead/);
    expect(checkCardDate("2026-02-31", "2026-10-16")).toMatch(/real calendar date/);
  });

  it("todayIn gives the date in India, not UTC", () => {
    expect(todayIn("Asia/Kolkata", new Date("2026-10-15T20:00:00Z"))).toBe("2026-10-16");
    expect(todayIn("Asia/Kolkata", new Date("2026-10-15T10:00:00Z"))).toBe("2026-10-15");
  });
});

describe("normalizeHashtags", () => {
  it("strips # and duplicates, and rejects anything that is not a word", () => {
    expect(normalizeHashtags(["#A", "A", "b_1"])).toEqual(["A", "b_1"]);
    expect(normalizeHashtags(["a b"])).toBeNull();
    expect(normalizeHashtags([""])).toBeNull();
    expect(normalizeHashtags("x")).toBeNull();
    expect(normalizeHashtags([])).toEqual([]);
  });
});
