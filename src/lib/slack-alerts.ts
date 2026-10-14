/**
 * Slack Notification Dispatcher for Shoonaya Operations & Moderation.
 *
 * Safe and resilient: If SLACK_WEBHOOK_URL is not set or network fails,
 * it fails cleanly with console warnings and never interrupts critical user flows.
 */

export interface SlackAlertPayload {
  title: string;
  desc: string;
  severity: "P0" | "P1" | "P2" | "critical" | "high" | "medium";
  domain?: string;
  route?: string;
  href?: string;
  timestamp?: string;
  metadata?: Record<string, unknown>;
}

export interface SlackModerationPayload {
  reportId: string;
  contentType: string;
  reason: string;
  reporterId?: string;
  details?: string;
  metadata?: Record<string, unknown>;
}

export function isSlackConfigured(): boolean {
  const url = process.env.SLACK_WEBHOOK_URL;
  return typeof url === "string" && url.trim().startsWith("https://hooks.slack.com/");
}

export async function sendSlackMessage(payload: Record<string, unknown>): Promise<{ ok: boolean; status?: number; error?: string }> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl || !webhookUrl.startsWith("https://hooks.slack.com/")) {
    return { ok: false, error: "SLACK_WEBHOOK_URL is not configured" };
  }

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, status: res.status, error: text || `HTTP ${res.status}` };
    }

    return { ok: true, status: res.status };
  } catch (err: any) {
    return { ok: false, error: err.message || "Network error posting to Slack" };
  }
}

export async function postSlackOperationalAlert(alert: SlackAlertPayload): Promise<boolean> {
  const isP0 = alert.severity === "P0" || alert.severity === "critical";
  const icon = isP0 ? "🚨" : "⚠️";
  const severityTag = isP0 ? "*[P0 CRITICAL]*" : "*[P1 HIGH]*";
  const adminUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.shoonaya.com";
  const targetUrl = alert.href ? `${adminUrl}${alert.href.startsWith("/") ? "" : "/"}${alert.href}` : `${adminUrl}/admin/monitoring`;

  const blocks = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `${icon} Shoonaya Incident: ${alert.title.slice(0, 100)}`,
        emoji: true,
      },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Severity:*\n${severityTag} \`${alert.severity}\`` },
        { type: "mrkdwn", text: `*Domain:*\n\`${alert.domain || "system"}\`` },
        { type: "mrkdwn", text: `*Route:*\n\`${alert.route || "general"}\`` },
        { type: "mrkdwn", text: `*Timestamp:*\n<!date^${Math.floor(Date.now() / 1000)}^{date_num} {time_secs}|${new Date().toISOString()}>` },
      ],
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Description:*\n>${alert.desc.slice(0, 500).replace(/\n/g, "\n>")}`,
      },
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: { type: "plain_text", text: "🔍 Inspect Incident on Admin Desk", emoji: true },
          url: targetUrl,
          style: isP0 ? "danger" : "primary",
        },
      ],
    },
  ];

  const result = await sendSlackMessage({ blocks, text: `${icon} ${severityTag} ${alert.title}: ${alert.desc}` });
  return result.ok;
}

export async function postSlackModerationReport(report: SlackModerationPayload): Promise<boolean> {
  const adminUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.shoonaya.com";
  const targetUrl = `${adminUrl}/admin/moderation?reportId=${report.reportId}`;

  const blocks = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `🛡️ New Moderation Report: ${report.contentType}`,
        emoji: true,
      },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Content Type:*\n\`${report.contentType}\`` },
        { type: "mrkdwn", text: `*Reason:*\n\`${report.reason}\`` },
        { type: "mrkdwn", text: `*Report ID:*\n\`${report.reportId.slice(0, 18)}...\`` },
        { type: "mrkdwn", text: `*Timestamp:*\n<!date^${Math.floor(Date.now() / 1000)}^{date_num} {time_secs}|${new Date().toISOString()}>` },
      ],
    },
    ...(report.details
      ? [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*Reporter Notes:*\n>${report.details.slice(0, 400).replace(/\n/g, "\n>")}`,
            },
          },
        ]
      : []),
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: { type: "plain_text", text: "⚖️ Review on Moderation Desk", emoji: true },
          url: targetUrl,
          style: "danger",
        },
      ],
    },
  ];

  const result = await sendSlackMessage({ blocks, text: `🛡️ New Moderation Report: ${report.contentType} (${report.reason})` });
  return result.ok;
}
