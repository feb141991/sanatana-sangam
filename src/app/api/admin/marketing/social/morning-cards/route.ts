import { NextRequest } from "next/server";
import { verifyAdminCookieAuth } from "@/lib/admin-auth";
import { requireAdminAccess } from "@/lib/admin";
import { noStoreJson } from "@/lib/marketing/social/morning/http";
import { allBackgroundPrompts } from "@/lib/marketing/social/morning/art-direction";
import {
  checkCardDate,
  generateMorningSet,
  listMorningCards,
  MORNING_TIMEZONE,
  todayIn
} from "@/lib/marketing/social/morning/service";

export const runtime = "nodejs";
export const maxDuration = 60;

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function resolveDate(raw: unknown): { date: string } | { error: string } {
  const today = todayIn(MORNING_TIMEZONE);
  const date = typeof raw === "string" && raw.trim() ? raw.trim() : today;
  const problem = checkCardDate(date, today);
  return problem ? { error: problem } : { date };
}

/** The cards for one day (today by default), with signed image links, plus the art prompts. */
export async function GET(request: NextRequest) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;
  const admin = await requireAdminAccess(request);
  if ("response" in admin) return admin.response;

  const resolved = resolveDate(new URL(request.url).searchParams.get("date"));
  if ("error" in resolved) return noStoreJson({ error: resolved.error }, 400);

  try {
    const cards = await listMorningCards(admin.supabase, resolved.date);
    return noStoreJson({ date: resolved.date, cards, artPrompts: allBackgroundPrompts() });
  } catch {
    return noStoreJson({ error: "morning_cards_read_failed" }, 500);
  }
}

/** One click: make today's card for every tradition. Safe to repeat. */
export async function POST(request: NextRequest) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;
  const admin = await requireAdminAccess(request);
  if ("response" in admin) return admin.response;

  const body = asRecord(await request.json().catch(() => null));
  const resolved = resolveDate(body.date);
  if ("error" in resolved) return noStoreJson({ error: resolved.error }, 400);

  try {
    const outcomes = await generateMorningSet(admin.supabase, {
      date: resolved.date,
      createdBy: admin.username,
      regenerate: body.regenerate === true
    });
    const cards = await listMorningCards(admin.supabase, resolved.date);
    return noStoreJson({ date: resolved.date, outcomes, cards });
  } catch {
    return noStoreJson({ error: "morning_cards_generation_failed" }, 500);
  }
}
