import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1";
const call = (path: string, userAgent: string) =>
  GET(new NextRequest(`https://www.shoonaya.com${path}`, { headers: { "user-agent": userAgent } }));

describe("GET /get", () => {
  it("redirects an iPhone to the App Store with the campaign, as a temporary redirect", () => {
    const res = call("/get?utm_source=shoonaya&utm_medium=email&utm_campaign=diwali-2026", IPHONE);
    expect(res.status).toBe(302);
    const location = new URL(res.headers.get("location")!);
    expect(location.hostname).toBe("apps.apple.com");
    expect(location.searchParams.get("ct")).toBe("diwali-2026");
  });

  it("is never cached or indexed, because the answer depends on the device", () => {
    const res = call("/get", IPHONE);
    expect(res.headers.get("cache-control")).toBe("private, no-store");
    expect(res.headers.get("vary")).toBe("User-Agent");
    expect(res.headers.get("x-robots-tag")).toBe("noindex, nofollow");
  });

  it("cannot be turned into an open redirect", () => {
    const res = call("/get?next=https://evil.example&url=https://evil.example&redirect=//evil.example&utm_source=https://evil.example", IPHONE);
    expect(new URL(res.headers.get("location")!).hostname).toBe("apps.apple.com");
  });

  it("sends a desktop visitor to the website", () => {
    const res = call("/get?utm_campaign=x", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15");
    expect(new URL(res.headers.get("location")!).hostname).toBe("www.shoonaya.com");
  });
});
