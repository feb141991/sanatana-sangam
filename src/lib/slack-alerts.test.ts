import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  escapeSlackText,
  isSlackConfigured,
  resetSlackAlertDedupeForTests,
  scheduleSlack,
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

describe("Slack alerts: user-controlled text cannot ping or phish the channel", () => {
  const url = "https://hooks.slack.com/services/T123/B456/789";
  let original: string | undefined;
  beforeEach(() => {
    original = process.env.SLACK_WEBHOOK_URL;
    process.env.SLACK_WEBHOOK_URL = url;
    resetSlackAlertDedupeForTests();
    vi.restoreAllMocks();
  });
  afterEach(() => {
    process.env.SLACK_WEBHOOK_URL = original;
  });

  const send = async (fn: () => Promise<boolean>) => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue({ ok: true, status: 200 } as Response);
    await fn();
    return { spy, body: JSON.parse(spy.mock.calls[0][1]?.body as string), raw: spy.mock.calls[0][1]?.body as string };
  };

  it("escapes the three characters Slack treats as markup", () => {
    expect(escapeSlackText("a & b <c> <!channel> <https://evil.example|click>")).toBe("a &amp; b &lt;c&gt; &lt;!channel&gt; &lt;https://evil.example|click&gt;");
  });

  it("a report whose text tries to mention the channel or plant a link reaches Slack inert, in every field", async () => {
    const hostile = "<!channel> <!here> <@U123> <https://evil.example|verify your account>";
    const { raw } = await send(() => postSlackModerationReport({ reportId: "r1", contentType: hostile, reason: hostile, details: hostile }));
    expect(raw).not.toMatch(/<!channel>|<!here>|<@U123>|<https:\/\/evil/);
    expect(raw).toContain("&lt;!channel&gt;");
  });

  it("an incident whose title, description, domain or route carry markup is inert too, including the plain-text fallback", async () => {
    const hostile = "<!channel> <https://evil.example|x>";
    const { body, raw } = await send(() => postSlackOperationalAlert({ severity: "P1", domain: hostile, title: hostile, desc: hostile, route: hostile }));
    expect(raw).not.toMatch(/<!channel>|<https:\/\/evil/);
    expect(body.text).not.toContain("<!channel>");
  });

  it("the reporter's free-text notes are NOT sent to Slack; the card only says notes exist", async () => {
    const { raw } = await send(() => postSlackModerationReport({ reportId: "r1", contentType: "Mandali Post", reason: "spam", details: "my phone number is 07700 900123" }));
    expect(raw).not.toContain("07700");
    expect(raw).toMatch(/Reporter notes/);
    expect(raw).toMatch(/Moderation Desk/);
  });

  it("without notes there is no notes line at all", async () => {
    const { raw } = await send(() => postSlackModerationReport({ reportId: "r1", contentType: "Mandali Post", reason: "spam" }));
    expect(raw).not.toMatch(/Reporter notes/);
  });

  it("the review link is built safely from the report id", async () => {
    const { body } = await send(() => postSlackModerationReport({ reportId: "a b&c=1", contentType: "Post", reason: "spam" }));
    const button = body.blocks.find((b: any) => b.type === "actions").elements[0];
    expect(button.url).toContain("reportId=a%20b%26c%3D1");
  });

  it("a link path that is not a path on our own site cannot redirect the button elsewhere", async () => {
    const { body } = await send(() => postSlackOperationalAlert({ severity: "P0", domain: "ai", title: "t", desc: "d", href: "//evil.example/x" }));
    const button = body.blocks.find((b: any) => b.type === "actions").elements[0];
    expect(new URL(button.url).hostname).toBe("www.shoonaya.com");
  });
});

describe("Slack alerts: delivery behaviour", () => {
  const url = "https://hooks.slack.com/services/T123/B456/789";
  let original: string | undefined;
  beforeEach(() => {
    original = process.env.SLACK_WEBHOOK_URL;
    process.env.SLACK_WEBHOOK_URL = url;
    resetSlackAlertDedupeForTests();
    vi.restoreAllMocks();
  });
  afterEach(() => {
    process.env.SLACK_WEBHOOK_URL = original;
  });

  it("the request has a timeout, so a slow Slack cannot hold anything open", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue({ ok: true, status: 200 } as Response);
    await sendSlackMessage({ text: "x" });
    expect(spy.mock.calls[0][1]?.signal).toBeInstanceOf(AbortSignal);
  });

  it("the same incident is sent once within the quiet window, and a different one is still sent", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue({ ok: true, status: 200 } as Response);
    const alert = { severity: "P1" as const, domain: "ai", title: "OpenAI 500", desc: "boom", route: "/api/chat" };
    expect(await postSlackOperationalAlert(alert)).toBe(true);
    expect(await postSlackOperationalAlert(alert)).toBe(false);
    expect(await postSlackOperationalAlert({ ...alert, desc: "boom again" })).toBe(false); // same incident, new wording
    expect(await postSlackOperationalAlert({ ...alert, title: "Gemini 500" })).toBe(true);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it("an incident is sent again once the quiet window has passed", async () => {
    vi.useFakeTimers();
    try {
      const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue({ ok: true, status: 200 } as Response);
      const alert = { severity: "P0" as const, domain: "db", title: "Down", desc: "x" };
      await postSlackOperationalAlert(alert);
      vi.advanceTimersByTime(6 * 60 * 1000);
      await postSlackOperationalAlert(alert);
      expect(spy).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it("a failed send is not counted as sent, so the next attempt is not suppressed", async () => {
    const alert = { severity: "P1" as const, domain: "ai", title: "Retry me", desc: "x" };
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({ ok: false, status: 500, text: async () => "no" } as Response);
    expect(await postSlackOperationalAlert(alert)).toBe(false);
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({ ok: true, status: 200 } as Response);
    expect(await postSlackOperationalAlert(alert)).toBe(true);
  });

  it("scheduleSlack never throws, even when the task fails or there is no request to attach it to", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    let ran = false;
    expect(() => scheduleSlack(async () => { ran = true; throw new Error("slack down"); })).not.toThrow();
    await new Promise((r) => setTimeout(r, 20));
    expect(ran).toBe(true);
    expect(warn).toHaveBeenCalled();
  });
});
