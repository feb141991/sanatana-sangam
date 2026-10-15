import { NextRequest } from "next/server";
import { verifyAdminCookieAuth } from "@/lib/admin-auth";
import { requireAdminAccess } from "@/lib/admin";
import { noStoreJson } from "@/lib/marketing/social/morning/http";
import { PRODUCT_CLAIMS } from "@/lib/marketing/diaspora/claims";
import { PILLARS } from "@/lib/marketing/diaspora/pillars";
import { REGIONS } from "@/lib/marketing/diaspora/regions";
import { DIASPORA_TRADITIONS } from "@/lib/marketing/diaspora/brief";
import { DIASPORA_CHANNELS, generateDiasporaDraft, type GenerateDiasporaFailure } from "@/lib/marketing/diaspora/service";

export const runtime = "nodejs";
export const maxDuration = 60;

const STATUS: Record<GenerateDiasporaFailure, number> = {
  invalid_pillar: 400,
  invalid_region: 400,
  invalid_tradition: 400,
  invalid_channels: 400,
  occasion_required: 400,
  occasion_not_publishable: 409,
  empty_content: 502,
  generation_failed: 502,
  content_check_failed: 422,
  campaign_creation_failed: 500,
  variant_save_failed: 500
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}
function optionalString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/** What the screen needs to build the form, plus every product claim and whether it may be used. */
export async function GET(request: NextRequest) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;
  const admin = await requireAdminAccess(request);
  if ("response" in admin) return admin.response;

  return noStoreJson({
    pillars: PILLARS,
    regions: REGIONS,
    traditions: DIASPORA_TRADITIONS,
    channels: DIASPORA_CHANNELS,
    claims: PRODUCT_CLAIMS
  });
}

/** Drafts a diaspora campaign. Nothing is approved or sent: the draft opens in the normal campaign screen. */
export async function POST(request: NextRequest) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;
  const admin = await requireAdminAccess(request);
  if ("response" in admin) return admin.response;

  const body = asRecord(await request.json().catch(() => null));
  const channels = Array.isArray(body.channels) ? body.channels.filter((c): c is string => typeof c === "string") : [];

  try {
    const result = await generateDiasporaDraft(admin.supabase, {
      pillarId: optionalString(body.pillar_id) ?? "",
      regionId: optionalString(body.region_id) ?? "",
      tradition: optionalString(body.tradition),
      channels,
      occurrenceId: optionalString(body.occurrence_id),
      createdBy: admin.username
    });

    if (!result.ok) {
      return noStoreJson({ error: result.reason, detail: result.detail ?? null, violations: result.violations ?? [] }, STATUS[result.reason]);
    }
    return noStoreJson(
      {
        campaign: { id: result.campaign.id, campaign_key: result.campaign.campaign_key, title: result.campaign.title, status: result.campaign.status },
        variants: result.variants.map((v) => ({ id: v.id, channel: v.channel, subject: v.subject, body: v.body, cta_text: v.cta_text })),
        attempts: result.attempts
      },
      201
    );
  } catch {
    return noStoreJson({ error: "diaspora_generation_failed" }, 500);
  }
}
