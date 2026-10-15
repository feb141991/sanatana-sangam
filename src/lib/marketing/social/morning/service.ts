/**
 * Generating, editing, approving and rejecting morning cards. Everything here is a database or storage call on top
 * of the pure pieces in this folder; the rules that must hold regardless of who calls it are enforced by the table
 * itself (see supabase/migrations/20261015100000_social_morning_cards.sql).
 *
 * Generation is idempotent: a day and tradition that already has a card is reported, not rewritten. A tradition
 * that cannot be made today (no usable verse, a missing font, a render failure) is saved as WITHHELD with the
 * reason, so the admin screen shows why instead of a silent gap, and the other traditions are not held up.
 */
import { getDraftImageContentHash, getSignedDraftImageUrl, uploadDraftSocialImage } from "../image-storage";
import { buildMorningCaption } from "./caption";
import { CardRenderError, missingFontsFor, renderMorningCard } from "./card-renderer";
import { pickMorningVerse } from "./verse-sources";
import { MORNING_TRADITIONS, type MorningTradition, type MorningVerse, type WithheldReason } from "./types";

export interface MorningCardRow {
  id: string;
  card_date: string;
  tradition: MorningTradition;
  status: "draft" | "approved" | "rejected" | "withheld";
  withheld_reason: WithheldReason | null;
  withheld_detail: string | null;
  source_ref: string | null;
  citation: string | null;
  source_snapshot: Record<string, unknown>;
  image_path: string | null;
  image_content_hash: string | null;
  caption: string;
  hashtags: string[];
  generated_by: string;
  approved_by: string | null;
  approved_at: string | null;
  approved_image_content_hash: string | null;
  rejected_by: string | null;
  rejected_at: string | null;
  created_at: string;
  updated_at: string;
}

export type GenerateOutcome =
  | { tradition: MorningTradition; result: "created" | "regenerated" | "already_generated"; cardId: string }
  | { tradition: MorningTradition; result: "withheld"; reason: WithheldReason; detail: string }
  | { tradition: MorningTradition; result: "not_regenerated"; detail: string }
  | { tradition: MorningTradition; result: "error"; detail: string };

// ── Dates ─────────────────────────────────────────────────────────────────────

export const MORNING_TIMEZONE = "Asia/Kolkata";

/** Today's date in the given timezone, as YYYY-MM-DD. The zone is always passed in, never assumed. */
export function todayIn(timeZone: string, now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

/** A real calendar date: JavaScript rolls 2026-02-31 over to March, so check that it round-trips. */
export function isRealDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

const MAX_DAYS_BEHIND = 30;
const MAX_DAYS_AHEAD = 60;

/** A card may be prepared up to two months ahead and re-made up to a month back; nothing wilder than that. */
export function checkCardDate(date: string, today: string): string | null {
  if (!isRealDate(date)) return "date must be a real calendar date, YYYY-MM-DD";
  const diff = Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000);
  if (diff < -MAX_DAYS_BEHIND) return `date cannot be more than ${MAX_DAYS_BEHIND} days in the past`;
  if (diff > MAX_DAYS_AHEAD) return `date cannot be more than ${MAX_DAYS_AHEAD} days ahead`;
  return null;
}

// ── Generation ────────────────────────────────────────────────────────────────

function snapshotOf(verse: MorningVerse) {
  return {
    original: verse.original,
    translation: verse.translation,
    translation_credit: verse.translationCredit,
    attribution: verse.attribution,
    script: verse.script,
    citation: verse.citation
  };
}

function withheldReasonFor(error: unknown): { reason: WithheldReason; detail: string } {
  if (error instanceof CardRenderError) {
    const reason: WithheldReason = error.code === "font_missing" || error.code === "font_not_loaded" ? "font_missing" : "render_failed";
    return { reason, detail: error.message.slice(0, 1000) };
  }
  return { reason: "render_failed", detail: (error instanceof Error ? error.message : "unknown error").slice(0, 1000) };
}

async function saveWithheld(
  supabase: any,
  existing: MorningCardRow | null,
  base: { date: string; tradition: MorningTradition; createdBy: string },
  reason: WithheldReason,
  detail: string
): Promise<GenerateOutcome> {
  // A card that already exists as a draft or a rejected card (this is a regenerate that failed) keeps what it has.
  // Only a missing or already-withheld record is written, so a failed retry can never destroy a working card.
  if (existing && existing.status !== "withheld") {
    return {
      tradition: base.tradition,
      result: "withheld",
      reason,
      detail: `${detail} The existing ${existing.status} card was left as it was.`
    };
  }
  const fields = {
    status: "withheld",
    withheld_reason: reason,
    withheld_detail: detail.slice(0, 1000),
    source_ref: null,
    citation: null,
    source_snapshot: {},
    image_path: null,
    image_content_hash: null,
    caption: "",
    hashtags: [],
    approved_by: null,
    approved_at: null,
    approved_image_content_hash: null,
    rejected_by: null,
    rejected_at: null
  };
  const write = existing
    ? supabase.from("social_morning_cards").update(fields).eq("id", existing.id)
    : supabase.from("social_morning_cards").insert({ card_date: base.date, tradition: base.tradition, generated_by: base.createdBy, ...fields });
  const { error } = await write;
  if (error && error.code !== "23505") {
    return { tradition: base.tradition, result: "error", detail: `Could not save the withheld record: ${error.message}` };
  }
  return { tradition: base.tradition, result: "withheld", reason, detail };
}

async function generateOne(
  supabase: any,
  params: { date: string; tradition: MorningTradition; createdBy: string; regenerate: boolean }
): Promise<GenerateOutcome> {
  const { date, tradition, createdBy, regenerate } = params;

  const { data: existingRow, error: readError } = await supabase
    .from("social_morning_cards")
    .select("*")
    .eq("card_date", date)
    .eq("tradition", tradition)
    .maybeSingle();
  if (readError) return { tradition, result: "error", detail: `Could not read existing cards: ${readError.message}` };
  const existing = (existingRow as MorningCardRow | null) ?? null;

  // Only a withheld card is retried by a plain click (the reason may have been fixed since). A draft, an approved
  // card or a rejected one is left exactly as it is unless the admin asks to regenerate.
  if (existing && existing.status !== "withheld" && !regenerate) {
    return { tradition, result: "already_generated", cardId: existing.id };
  }
  if (existing?.status === "approved") {
    return { tradition, result: "not_regenerated", detail: "This card is approved. Reject it first if you want a new one." };
  }

  const picked = pickMorningVerse(tradition, date);
  if (!picked.ok) return saveWithheld(supabase, existing, { date, tradition, createdBy }, picked.reason, picked.detail);
  const { verse } = picked;

  let png: Buffer;
  try {
    const missing = missingFontsFor(verse);
    if (missing.length > 0) {
      throw new CardRenderError("font_missing", `Font file(s) not installed for ${tradition}: ${missing.join(", ")}`);
    }
    png = (await renderMorningCard(verse)).png;
  } catch (error) {
    const { reason, detail } = withheldReasonFor(error);
    return saveWithheld(supabase, existing, { date, tradition, createdBy }, reason, detail);
  }

  let upload: { draftPath: string; contentHash: string };
  try {
    const bytes = png.buffer.slice(png.byteOffset, png.byteOffset + png.byteLength) as ArrayBuffer;
    upload = await uploadDraftSocialImage(supabase, `morning/${date}-${tradition}`, bytes, "image/png");
  } catch (error) {
    return { tradition, result: "error", detail: error instanceof Error ? error.message : "Image upload failed" };
  }

  const { caption, hashtags } = buildMorningCaption(verse, date);
  const fields = {
    status: "draft",
    withheld_reason: null,
    withheld_detail: null,
    source_ref: verse.sourceRef,
    citation: verse.citation,
    source_snapshot: snapshotOf(verse),
    image_path: upload.draftPath,
    image_content_hash: upload.contentHash,
    caption,
    hashtags,
    approved_by: null,
    approved_at: null,
    approved_image_content_hash: null,
    rejected_by: null,
    rejected_at: null
  };

  if (existing) {
    const { data, error } = await supabase
      .from("social_morning_cards")
      .update(fields)
      .eq("id", existing.id)
      .select("id")
      .single();
    if (error || !data) return { tradition, result: "error", detail: `Could not save the card: ${error?.message ?? "not found"}` };
    return { tradition, result: "regenerated", cardId: data.id };
  }

  const { data, error } = await supabase
    .from("social_morning_cards")
    .insert({ card_date: date, tradition, generated_by: createdBy, ...fields })
    .select("id")
    .single();
  if (error) {
    // 23505: another click made this card first. The unique key makes that a no-op, not a failure.
    if (error.code === "23505") {
      const { data: winner } = await supabase.from("social_morning_cards").select("id").eq("card_date", date).eq("tradition", tradition).maybeSingle();
      if (winner) return { tradition, result: "already_generated", cardId: winner.id };
    }
    return { tradition, result: "error", detail: `Could not save the card: ${error.message}` };
  }
  return { tradition, result: "created", cardId: data.id };
}

export async function generateMorningSet(
  supabase: any,
  params: { date: string; createdBy: string; regenerate?: boolean; traditions?: readonly MorningTradition[] }
): Promise<GenerateOutcome[]> {
  const outcomes: GenerateOutcome[] = [];
  for (const tradition of params.traditions ?? MORNING_TRADITIONS) {
    try {
      outcomes.push(await generateOne(supabase, { date: params.date, tradition, createdBy: params.createdBy, regenerate: params.regenerate === true }));
    } catch (error) {
      // One tradition failing never stops the others.
      outcomes.push({ tradition, result: "error", detail: error instanceof Error ? error.message : "unexpected error" });
    }
  }
  return outcomes;
}

// ── Reading ───────────────────────────────────────────────────────────────────

export interface MorningCardView extends MorningCardRow {
  /** A signed link valid for an hour; the image is in a private bucket and never has a public address. */
  image_url: string | null;
}

export async function listMorningCards(supabase: any, date: string): Promise<MorningCardView[]> {
  const { data, error } = await supabase.from("social_morning_cards").select("*").eq("card_date", date);
  if (error) throw new Error(`Could not read morning cards: ${error.message}`);
  const rows = (data ?? []) as MorningCardRow[];
  const order = new Map(MORNING_TRADITIONS.map((t, i) => [t, i]));
  rows.sort((a, b) => (order.get(a.tradition) ?? 99) - (order.get(b.tradition) ?? 99));
  return Promise.all(
    rows.map(async (row) => {
      let image_url: string | null = null;
      if (row.image_path) {
        try {
          image_url = await getSignedDraftImageUrl(supabase, row.image_path);
        } catch {
          image_url = null;
        }
      }
      return { ...row, image_url };
    })
  );
}

// ── Editing and deciding ──────────────────────────────────────────────────────

export class MorningCardError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message);
  }
}

const MAX_CAPTION = 2200; // the strictest of the platforms (Instagram)
const MAX_HASHTAGS = 30;

export function normalizeHashtags(input: unknown): string[] | null {
  if (!Array.isArray(input)) return null;
  const tags = input.map((tag) => (typeof tag === "string" ? tag.trim().replace(/^#+/, "") : ""));
  if (tags.some((tag) => !/^[\p{L}\p{N}_]{1,60}$/u.test(tag))) return null;
  return [...new Set(tags)].slice(0, MAX_HASHTAGS);
}

async function getCard(supabase: any, id: string): Promise<MorningCardRow> {
  const { data, error } = await supabase.from("social_morning_cards").select("*").eq("id", id).maybeSingle();
  if (error) throw new MorningCardError(500, `Could not read the card: ${error.message}`);
  if (!data) throw new MorningCardError(404, "Card not found");
  return data as MorningCardRow;
}

/** Editing an approved card sends it back to draft (the table does that), so it must be approved again. */
export async function updateCaption(supabase: any, id: string, input: { caption: unknown; hashtags: unknown }): Promise<MorningCardRow> {
  if (typeof input.caption !== "string" || !input.caption.trim()) throw new MorningCardError(400, "caption is required");
  if (input.caption.length > MAX_CAPTION) throw new MorningCardError(400, `caption is longer than ${MAX_CAPTION} characters`);
  const hashtags = normalizeHashtags(input.hashtags);
  if (!hashtags) throw new MorningCardError(400, "hashtags must be words (letters, numbers or underscore)");

  const card = await getCard(supabase, id);
  if (card.status !== "draft" && card.status !== "approved") throw new MorningCardError(409, `A ${card.status} card cannot be edited`);

  const { data, error } = await supabase
    .from("social_morning_cards")
    .update({ caption: input.caption.trim(), hashtags })
    .eq("id", id)
    .in("status", ["draft", "approved"])
    .select("*")
    .single();
  if (error || !data) throw new MorningCardError(409, "The card changed while you were editing it. Reload and try again.");
  return data as MorningCardRow;
}

/**
 * Approval is bound to the exact image: the bytes are re-read from storage and hashed, and the row is only updated
 * if it is still a draft with that same hash. A card whose image was swapped or changed since it was shown cannot be
 * approved by an approval of something else.
 */
export async function approveCard(supabase: any, id: string, approvedBy: string): Promise<MorningCardRow> {
  const card = await getCard(supabase, id);
  if (card.status !== "draft") throw new MorningCardError(409, `Only a draft can be approved (this one is ${card.status})`);
  if (!card.image_path || !card.image_content_hash) throw new MorningCardError(409, "This card has no image to approve");

  let actualHash: string;
  try {
    actualHash = await getDraftImageContentHash(supabase, card.image_path);
  } catch (error) {
    throw new MorningCardError(409, `The card's image could not be read: ${error instanceof Error ? error.message : "unknown error"}`);
  }
  if (actualHash !== card.image_content_hash) {
    throw new MorningCardError(409, "The stored image no longer matches this card. Regenerate it before approving.");
  }

  const { data, error } = await supabase
    .from("social_morning_cards")
    .update({
      status: "approved",
      approved_by: approvedBy,
      approved_at: new Date().toISOString(),
      approved_image_content_hash: actualHash
    })
    .eq("id", id)
    .eq("status", "draft")
    .eq("image_content_hash", actualHash)
    .select("*")
    .single();
  if (error || !data) throw new MorningCardError(409, "The card changed while you were approving it. Reload and check it again.");
  return data as MorningCardRow;
}

export async function rejectCard(supabase: any, id: string, rejectedBy: string): Promise<MorningCardRow> {
  const card = await getCard(supabase, id);
  if (card.status !== "draft" && card.status !== "approved") throw new MorningCardError(409, `A ${card.status} card cannot be rejected`);
  const { data, error } = await supabase
    .from("social_morning_cards")
    .update({
      status: "rejected",
      rejected_by: rejectedBy,
      rejected_at: new Date().toISOString(),
      approved_by: null,
      approved_at: null,
      approved_image_content_hash: null
    })
    .eq("id", id)
    .in("status", ["draft", "approved"])
    .select("*")
    .single();
  if (error || !data) throw new MorningCardError(409, "The card changed while you were rejecting it. Reload and try again.");
  return data as MorningCardRow;
}
