/**
 * Slack Notification Dispatcher for Shoonaya Operations & Moderation.
 *
 * Safe and resilient: If SLACK_WEBHOOK_URL is not set or network fails,
 * it fails cleanly with console warnings and never interrupts critical user flows.
 *
 * Hardening (reviewed 2026-10-15):
 *   - Everything that came from a user or an error message is escaped before it goes into a Slack message. Slack
 *     treats <!channel>, <@user> and <url|text> as markup, so unescaped text let a reporter ping the whole channel
 *     or plant a phishing link in the operations channel.
 *   - A reporter's free-text notes are never sent to Slack (a third party): the card says notes exist and links to
 *     the Moderation Desk, where they are read inside the product.
 *   - The request has a timeout.
 *   - An incident that was already sent is not sent again for a few minutes, so a failing dependency that errors on
 *     every request cannot flood the channel.
 *   - Callers hand delivery to scheduleSlack(), which runs it after the response is sent: on serverless hosting an
 *     un-awaited promise may be dropped as soon as the response returns, which silently lost alerts.
 */
import { after } from "next/server";

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

const SEND_TIMEOUT_MS = 4000;
const DEDUPE_WINDOW_MS = 5 * 60 * 1000;
const DEDUPE_MAX_KEYS = 200;
const SITE_FALLBACK = "https://www.shoonaya.com";

/** Slack's own rule: only these three characters are markup, and they are escaped as HTML entities. */
export function escapeSlackText(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** For card headers, which Slack shows as plain text: drop the markup characters rather than show entities. */
function plain(text: string, max: number): string {
  return text.replace(/[<>]/g, "").slice(0, max);
}

/** For text placed inside `code` spans: escaped, and with backticks removed so it cannot break out of the span. */
function code(text: string): string {
  return escapeSlackText(text).replace(/`/g, "'");
}

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || SITE_FALLBACK;
}

/** A link target on our own site: a path starting with a single slash, never a protocol-relative or absolute URL. */
function sitePath(href: string | undefined, fallback: string): string {
  if (!href || !href.startsWith("/") || href.startsWith("//")) return `${siteUrl()}${fallback}`;
  return `${siteUrl()}${href}`;
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
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
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

/**
 * Runs Slack delivery after the response has been sent, and never lets a failure surface. Outside a request (a
 * script, a test) there is nothing to attach to, so it simply runs.
 */
export function scheduleSlack(task: () => Promise<unknown>): void {
  const run = () =>
    task().catch((err) => {
      console.warn("[slack-alerts] delivery failed", err instanceof Error ? err.message : err);
    });
  try {
    after(run);
  } catch {
    void run();
  }
}

// ── Quiet window: one message per incident ────────────────────────────────────

const recentlySent = new Map<string, number>();

export function resetSlackAlertDedupeForTests(): void {
  recentlySent.clear();
}

function alreadySentRecently(key: string, now: number): boolean {
  const sentAt = recentlySent.get(key);
  return sentAt !== undefined && now - sentAt < DEDUPE_WINDOW_MS;
}

function rememberSent(key: string, now: number): void {
  recentlySent.set(key, now);
  if (recentlySent.size > DEDUPE_MAX_KEYS) {
    for (const [k, t] of recentlySent) {
      if (now - t >= DEDUPE_WINDOW_MS) recentlySent.delete(k);
    }
    // Still too many distinct incidents: drop the oldest ones.
    while (recentlySent.size > DEDUPE_MAX_KEYS) {
      const oldest = recentlySent.keys().next().value;
      if (oldest === undefined) break;
      recentlySent.delete(oldest);
    }
  }
}

export async function postSlackOperationalAlert(alert: SlackAlertPayload): Promise<boolean> {
  // One incident is its severity, domain, route and title. New wording (a different error message) is still the
  // same incident, so it stays quiet; the first message already linked to the monitoring desk.
  const key = `${alert.severity}|${alert.domain ?? ""}|${alert.route ?? ""}|${alert.title}`;
  const now = Date.now();
  if (alreadySentRecently(key, now)) return false;

  const isP0 = alert.severity === "P0" || alert.severity === "critical";
  const icon = isP0 ? "🚨" : "⚠️";
  const severityTag = isP0 ? "*[P0 CRITICAL]*" : "*[P1 HIGH]*";
  const targetUrl = sitePath(alert.href, "/admin/monitoring");

  const title = escapeSlackText(alert.title);
  const desc = escapeSlackText(alert.desc);

  const blocks = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `${icon} Shoonaya Incident: ${plain(alert.title, 100)}`,
        emoji: true,
      },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Severity:*\n${severityTag} \`${code(alert.severity)}\`` },
        { type: "mrkdwn", text: `*Domain:*\n\`${code(alert.domain || "system")}\`` },
        { type: "mrkdwn", text: `*Route:*\n\`${code(alert.route || "general")}\`` },
        { type: "mrkdwn", text: `*Timestamp:*\n<!date^${Math.floor(now / 1000)}^{date_num} {time_secs}|${new Date(now).toISOString()}>` },
      ],
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Description:*\n>${escapeSlackText(alert.desc.slice(0, 500)).replace(/\n/g, "\n>")}`,
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

  const result = await sendSlackMessage({ blocks, text: `${icon} ${severityTag} ${title}: ${desc}`.slice(0, 600) });
  if (result.ok) rememberSent(key, now);
  return result.ok;
}

export async function postSlackModerationReport(report: SlackModerationPayload): Promise<boolean> {
  const targetUrl = `${siteUrl()}/admin/moderation?reportId=${encodeURIComponent(report.reportId)}`;

  const blocks = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `🛡️ New Moderation Report: ${plain(report.contentType, 100)}`,
        emoji: true,
      },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Content Type:*\n\`${code(report.contentType)}\`` },
        { type: "mrkdwn", text: `*Reason:*\n\`${code(report.reason)}\`` },
        { type: "mrkdwn", text: `*Report ID:*\n\`${code(report.reportId.slice(0, 18))}...\`` },
        { type: "mrkdwn", text: `*Timestamp:*\n<!date^${Math.floor(Date.now() / 1000)}^{date_num} {time_secs}|${new Date().toISOString()}>` },
      ],
    },
    // What the reporter wrote stays inside the product: free text is personal data and does not go to a third party.
    ...(report.details
      ? [
          {
            type: "section",
            text: { type: "mrkdwn", text: "*Reporter notes:* provided. Open the Moderation Desk to read them." },
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

  const result = await sendSlackMessage({
    blocks,
    text: `🛡️ New Moderation Report: ${escapeSlackText(report.contentType)} (${escapeSlackText(report.reason)})`.slice(0, 300),
  });
  return result.ok;
}
