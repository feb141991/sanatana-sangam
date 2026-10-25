import { NextRequest, NextResponse } from "next/server";
import { verifyAdminCookieAuth } from "@/lib/admin-auth";
import { requireAdminAccess } from "@/lib/admin";
import { maybeCompleteCampaign } from "@/lib/marketing/dispatch-start";

const CONFIRM_SENT = "CONFIRM SENT";
const CONFIRM_NOT_SENT = "CONFIRM NOT SENT";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; dispatchId: string }> }
) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;

  const admin = await requireAdminAccess(request);
  if ("response" in admin) return admin.response;

  const { id, dispatchId } = await params;
  const body = await request.json().catch(() => ({}));
  const resolution = body.resolution === "confirmed_sent" || body.resolution === "confirmed_not_sent"
    ? body.resolution
    : null;
  const confirmationPhrase = typeof body.confirmation_phrase === "string" ? body.confirmation_phrase : "";
  const providerMessageId = typeof body.provider_message_id === "string"
    ? body.provider_message_id.trim()
    : "";

  if (!resolution) {
    return NextResponse.json({ error: "Valid reconciliation resolution is required" }, { status: 400 });
  }
  const expectedPhrase = resolution === "confirmed_sent" ? CONFIRM_SENT : CONFIRM_NOT_SENT;
  if (confirmationPhrase !== expectedPhrase) {
    return NextResponse.json({ error: `Type ${expectedPhrase} to confirm this reconciliation` }, { status: 400 });
  }
  if (resolution === "confirmed_sent" && !providerMessageId) {
    return NextResponse.json({ error: "Provider message ID is required to confirm delivery" }, { status: 400 });
  }

  const { data: dispatch } = await admin.supabase
    .from("marketing_dispatches")
    .select("id, status")
    .eq("id", dispatchId)
    .eq("campaign_id", id)
    .eq("status", "outcome_unknown")
    .maybeSingle();
  if (!dispatch) {
    return NextResponse.json({ error: "Uncertain dispatch was not found" }, { status: 404 });
  }

  const { data, error } = await admin.supabase.rpc("reconcile_marketing_dispatch", {
    p_dispatch_id: dispatchId,
    p_resolution: resolution,
    p_provider_message_id: providerMessageId || null,
  });
  const reconciled = Array.isArray(data) ? data[0] : data;
  if (error || !reconciled) {
    return NextResponse.json(
      { error: "Dispatch reconciliation could not be completed", code: "MARKETING_RECONCILIATION_FAILED" },
      { status: 409 }
    );
  }

  const campaignStatus = resolution === "confirmed_sent"
    ? await maybeCompleteCampaign(admin.supabase, id)
    : null;
  return NextResponse.json({ dispatch: reconciled, campaignStatus });
}
