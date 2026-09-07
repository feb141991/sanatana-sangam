import { NextRequest, NextResponse } from "next/server";
import { verifyAdminCookieAuth } from "@/lib/admin-auth";
import { requireAdminAccess } from "@/lib/admin";
import { generateMarketingDraft } from "@/lib/marketing/ai-generator";
import type { MarketingChannel } from "@/lib/marketing/types";

const VALID_CHANNELS: MarketingChannel[] = ["email", "whatsapp"];

export async function POST(request: NextRequest) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;

  const admin = await requireAdminAccess(request);
  if ("response" in admin) return admin.response;

  const body = await request.json().catch(() => ({}));
  const campaignKey = String(body.campaign_key ?? "").trim();
  const title = String(body.title ?? "").trim();
  const channels = Array.isArray(body.channels) ? body.channels.filter((c: unknown) => VALID_CHANNELS.includes(c as MarketingChannel)) : [];

  if (!campaignKey || !title) {
    return NextResponse.json({ error: "campaign_key and title are required" }, { status: 400 });
  }
  if (channels.length === 0) {
    return NextResponse.json({ error: "At least one valid channel (email or whatsapp) is required" }, { status: 400 });
  }

  const result = await generateMarketingDraft(admin.supabase, {
    campaignKey,
    title,
    campaignType: body.campaign_type ?? "newsletter",
    channels,
    createdBy: `ai (triggered by ${admin.username})`,
    sourceOccurrenceId: body.source_occurrence_id ?? null
  });

  if (!result.ok) {
    // Fails closed -- nothing was created (or, if a campaign row was inserted before a
    // later channel failed, it's left as an incomplete draft the admin can inspect and
    // either fix or delete, never silently discarded).
    return NextResponse.json({ error: result.reason }, { status: 422 });
  }

  return NextResponse.json({ campaign: result.campaign, variants: result.variants }, { status: 201 });
}
