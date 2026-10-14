import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  isSlackConfigured,
  sendSlackMessage,
  postSlackOperationalAlert,
  postSlackModerationReport,
} from "./slack-alerts";

describe("Slack Alerting System", () => {
  const originalEnv = process.env.SLACK_WEBHOOK_URL;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env.SLACK_WEBHOOK_URL = originalEnv;
  });

  it("identifies when Slack webhook is configured or missing", () => {
    process.env.SLACK_WEBHOOK_URL = "";
    expect(isSlackConfigured()).toBe(false);

    process.env.SLACK_WEBHOOK_URL = "http://malicious.com";
    expect(isSlackConfigured()).toBe(false);

    process.env.SLACK_WEBHOOK_URL = "https://hooks.slack.com/services/T123/B456/789";
    expect(isSlackConfigured()).toBe(true);
  });

  it("aborts cleanly without throwing when webhook is not set", async () => {
    delete process.env.SLACK_WEBHOOK_URL;
    const res = await sendSlackMessage({ text: "Hello" });
    expect(res.ok).toBe(false);
    expect(res.error).toContain("SLACK_WEBHOOK_URL is not configured");
  });

  it("dispatches operational alerts with correct Slack Block Kit format", async () => {
    process.env.SLACK_WEBHOOK_URL = "https://hooks.slack.com/services/T123/B456/789";

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
    } as Response);

    const success = await postSlackOperationalAlert({
      severity: "P0",
      domain: "ai",
      title: "OpenAI 500 Outage",
      desc: "Upstream completions returned Internal Server Error 500",
      route: "/api/chat",
    });

    expect(success).toBe(true);
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    const callArgs = fetchSpy.mock.calls[0];
    expect(callArgs[0]).toBe("https://hooks.slack.com/services/T123/B456/789");
    const sentBody = JSON.parse(callArgs[1]?.body as string);
    expect(sentBody.blocks[0].text.text).toContain("Shoonaya Incident: OpenAI 500 Outage");
    expect(sentBody.text).toContain("[P0 CRITICAL]");
  });

  it("dispatches moderation reports with direct review buttons", async () => {
    process.env.SLACK_WEBHOOK_URL = "https://hooks.slack.com/services/T123/B456/789";

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
    } as Response);

    const success = await postSlackModerationReport({
      reportId: "rep-12345",
      contentType: "Mandali Post",
      reason: "hate_speech",
      reporterId: "usr-999",
      details: "Spam advertising links",
    });

    expect(success).toBe(true);
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    const callArgs = fetchSpy.mock.calls[0];
    const sentBody = JSON.parse(callArgs[1]?.body as string);
    expect(sentBody.blocks[0].text.text).toContain("New Moderation Report: Mandali Post");
    expect(sentBody.blocks.some((b: any) => b.type === "actions")).toBe(true);
  });
});
