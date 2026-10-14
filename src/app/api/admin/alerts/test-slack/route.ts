import { verifyAdminCookieAuth } from "@/lib/admin-auth";
import { isSlackConfigured, sendSlackMessage } from "@/lib/slack-alerts";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;

  const configured = isSlackConfigured();
  const rawUrl = process.env.SLACK_WEBHOOK_URL || "";
  let masked = null;
  if (configured && rawUrl.length > 25) {
    masked = rawUrl.slice(0, 32) + "..." + rawUrl.slice(-6);
  }

  return NextResponse.json({
    configured,
    maskedUrl: masked,
  });
}

export async function POST(request: NextRequest) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;

  if (!isSlackConfigured()) {
    return NextResponse.json(
      { ok: false, error: "SLACK_WEBHOOK_URL is not configured in environment variables." },
      { status: 400 }
    );
  }

  const adminUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.shoonaya.com";
  const now = new Date().toISOString();

  const blocks = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "⚡ Shoonaya Slack Integration Test",
        emoji: true,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "This is a verification test from the *Shoonaya Admin Portal*. Alerts for *P0/P1 system incidents* and *live user moderation reports* will arrive here automatically.",
      },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: "*Status:*\n🟢 Active & Connected" },
        { type: "mrkdwn", text: "*Environment:*\n`" + (process.env.NODE_ENV || "production") + "`" },
        { type: "mrkdwn", text: "*Triggered At:*\n" + now },
        { type: "mrkdwn", text: "*Admin Origin:*\n`/admin/settings`" },
      ],
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: { type: "plain_text", text: "📊 Open Admin Monitoring", emoji: true },
          url: adminUrl + "/admin/monitoring",
          style: "primary",
        },
        {
          type: "button",
          text: { type: "plain_text", text: "🛡️ Open Moderation Desk", emoji: true },
          url: adminUrl + "/admin/moderation",
        },
      ],
    },
  ];

  const result = await sendSlackMessage({
    blocks,
    text: "⚡ Shoonaya Slack Integration Test: Alerts and Moderation are connected!",
  });

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error || "Failed to deliver message to Slack." },
      { status: 502 }
    );
  }

  return NextResponse.json({
    ok: true,
    message: "Test alert delivered to Slack successfully!",
    timestamp: now,
  });
}
