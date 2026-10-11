import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchInstagramUsername,
  fetchMetaPages,
  parseMetaPagesPayload,
} from "./manual-meta-connect";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("manual Meta connection", () => {
  it("rejects malformed page payloads rather than persisting partial credentials", () => {
    expect(parseMetaPagesPayload({ data: [{ id: "page-1", name: "Shoonaya" }] })).toBeNull();
    expect(parseMetaPagesPayload({ data: "not-an-array" })).toBeNull();
  });

  it("parses complete Facebook and Instagram account references", () => {
    expect(parseMetaPagesPayload({
      data: [{
        id: "page-1",
        name: "Shoonaya",
        access_token: "page-token",
        instagram_business_account: { id: "ig-1" },
      }],
    })).toEqual([{
      id: "page-1",
      name: "Shoonaya",
      accessToken: "page-token",
      instagramBusinessAccountId: "ig-1",
    }]);
  });

  it("sends Meta credentials in an Authorization header, never in the URL", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: [] }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await fetchMetaPages("secret-user-token");

    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(url.toString()).not.toContain("secret-user-token");
    expect(init.headers).toEqual({ Authorization: "Bearer secret-user-token" });
    expect(init.cache).toBe("no-store");
  });

  it("returns a username only for a valid successful response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ username: "shoonaya" }), { status: 200 }),
    ));
    await expect(fetchInstagramUsername("ig-1", "page-token")).resolves.toBe("shoonaya");
  });
});
