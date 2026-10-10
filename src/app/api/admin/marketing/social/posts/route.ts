import { NextRequest, NextResponse } from "next/server";
import { verifyAdminCookieAuth } from "@/lib/admin-auth";
import { requireAdminAccess } from "@/lib/admin";
import { reserveSocialPost } from "@/lib/marketing/social/reservation";

const DEFAULT_TIMEZONE = "Asia/Kolkata";

type CustomThemeInput = {
  title: string;
  promptSeed?: string;
  groundingMaterial: string;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function optionalString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function parseCustomTheme(value: unknown): CustomThemeInput | null {
  if (value == null) return null;
  const input = asRecord(value);
  const title = optionalString(input.title);
  const groundingMaterial = optionalString(input.grounding_material);
  const promptSeed = optionalString(input.prompt_seed);
  if (!title || !groundingMaterial) return null;
  return { title, groundingMaterial, ...(promptSeed ? { promptSeed } : {}) };
}

export async function GET(request: NextRequest) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;
  const admin = await requireAdminAccess(request);
  if ("response" in admin) return admin.response;

  const url = new URL(request.url);
  const stage = url.searchParams.get("stage");
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 50) || 50, 200);

  let query = admin.supabase
    .from("social_posts")
    .select("id, post_key, theme_type, internal_label, pipeline_stage, objective, frozen_scheduled_publish_at, approved_by, created_at, updated_at")
    .order("frozen_scheduled_publish_at", { ascending: false })
    .limit(limit);

  if (stage) query = query.eq("pipeline_stage", stage);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ posts: data ?? [] });
}

/**
 * Manual reservation, for an admin adding an extra post outside the daily
 * tick (e.g. a special campaign day). Goes through the exact same
 * reserveSocialPost path the tick uses -- same idempotency, same pause
 * checks, same policy freeze -- just triggered synchronously instead of on
 * a schedule.
 */
export async function POST(request: NextRequest) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;
  const admin = await requireAdminAccess(request);
  if ("response" in admin) return admin.response;

  const body = asRecord(await request.json().catch(() => null));
  const contentType = body.content_type;
  const targetDate = optionalString(body.target_date);
  if (contentType !== "festival" && contentType !== "general") {
    return NextResponse.json({ error: "content_type must be 'festival' or 'general'" }, { status: 400 });
  }
  if (!targetDate || !/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
    return NextResponse.json({ error: "target_date must be 'YYYY-MM-DD'" }, { status: 400 });
  }

  const customThemeRequested = body.custom_theme != null;
  const customTheme = parseCustomTheme(body.custom_theme);
  if (customThemeRequested && !customTheme) {
    return NextResponse.json({ error: "custom_theme requires a non-empty title and grounding_material" }, { status: 400 });
  }

  try {
    const outcome = await reserveSocialPost(admin.supabase, {
      contentType,
      targetDate,
      targetTimezone: optionalString(body.target_timezone) ?? DEFAULT_TIMEZONE,
      targetRegion: optionalString(body.target_region),
      targetTradition: optionalString(body.target_tradition),
      objective: "awareness",
      createdBy: admin.username,
      themeId: optionalString(body.theme_id),
      customTheme
    });
    return NextResponse.json(outcome);
  } catch {
    return NextResponse.json({ error: "social_post_reservation_failed", retryable: true }, { status: 500 });
  }
}
