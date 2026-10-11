import { NextRequest, NextResponse } from "next/server";
import { verifyAdminCookieAuth } from "@/lib/admin-auth";
import { requireAdminAccess } from "@/lib/admin";
import { sendShoonayaEmail } from "@/lib/email";

function noStoreJson(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;

  const admin = await requireAdminAccess(request);
  if ("response" in admin) return admin.response;

  const { id } = await params;
  const body: unknown = await request.json().catch(() => null);
  const recipientEmail = typeof body === "object" && body !== null
    && "recipientEmail" in body && typeof body.recipientEmail === "string"
    ? body.recipientEmail.trim().toLowerCase()
    : "";

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!recipientEmail || recipientEmail.length > 254 || !emailRegex.test(recipientEmail)) {
    return noStoreJson({ error: "A valid test recipient email address is required" }, 400);
  }

  // Fetch campaign and email variant
  const { data: campaign, error: campError } = await admin.supabase
    .from("marketing_campaigns")
    .select("*, marketing_campaign_variants(*)")
    .eq("id", id)
    .single();

  if (campError || !campaign) {
    return noStoreJson({ error: "Campaign not found" }, 404);
  }

  const variants: unknown[] = Array.isArray(campaign.marketing_campaign_variants)
    ? campaign.marketing_campaign_variants
    : [];
  const emailVariant = variants.find((value): value is Record<string, unknown> => (
    typeof value === "object" && value !== null && "channel" in value && value.channel === "email"
  ));
  const emailBody = emailVariant && typeof emailVariant.body === "string" ? emailVariant.body.trim() : "";
  if (!emailVariant || !emailBody) {
    return noStoreJson(
      { error: "No email copy found for this campaign. Please write/generate and save an email variant first." },
      400
    );
  }

  const subject = typeof emailVariant.subject === "string" && emailVariant.subject.trim()
    ? emailVariant.subject.trim()
    : String(campaign.title);
  const ctaText = typeof emailVariant.cta_text === "string" && emailVariant.cta_text.trim()
    ? emailVariant.cta_text.trim()
    : "Open Shoonaya";
  const ctaUrl = typeof emailVariant.cta_url === "string" && emailVariant.cta_url.trim()
    ? emailVariant.cta_url.trim()
    : "https://www.shoonaya.com";

  try {
    const sendResult = await sendShoonayaEmail({
      to: recipientEmail,
      subject: `[PREVIEW TEST] ${subject}`,
      shloka: "",
      meaning: "",
      title: subject,
      body: emailBody,
      ctaText,
      ctaUrl,
      unsubType: campaign.campaign_type === "festival_reminder" ? "festivals" : "newsletter",
    }, { idempotencyKey: `test-email:${id}:${Date.now()}` });

    if (!sendResult.success) {
      return noStoreJson({ error: "The email provider could not send this preview." }, 502);
    }

    return noStoreJson({
      success: true,
      recipient: recipientEmail,
      messageId: sendResult.id ?? null,
      sentAt: new Date().toISOString(),
    });
  } catch {
    return noStoreJson({ error: "Failed to dispatch test email" }, 500);
  }
}
