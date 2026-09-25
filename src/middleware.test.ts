import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { middleware, shouldVerifyUserInMiddleware } from "./middleware";

describe("middleware authentication scope", () => {
  it("keeps the public website at root even when an auth cookie is present", async () => {
    const request = new NextRequest("https://www.shoonaya.com/", {
      headers: {
        cookie: "sb-test-auth-token=stale-or-slow-session",
      },
    });
    const startedAt = performance.now();

    const response = await middleware(request);

    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(response.headers.get("location")).toBeNull();
    expect(performance.now() - startedAt).toBeLessThan(250);
  });

  it("returns Home immediately even when an auth cookie is present", async () => {
    const request = new NextRequest("https://www.shoonaya.com/home", {
      headers: {
        cookie: "sb-test-auth-token=stale-or-slow-session",
      },
    });
    const startedAt = performance.now();

    const response = await middleware(request);

    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(performance.now() - startedAt).toBeLessThan(250);
  });

  it("does not perform remote auth for Home when the app is open", () => {
    expect(
      shouldVerifyUserInMiddleware({
        pathname: "/home",
        appOpen: true,
        isPublicPath: false,
      }),
    ).toBe(false);
  });

  it("does not perform remote auth for public API or admin routing", () => {
    expect(
      shouldVerifyUserInMiddleware({
        pathname: "/api/calendar/upcoming",
        appOpen: true,
        isPublicPath: true,
      }),
    ).toBe(false);
    expect(
      shouldVerifyUserInMiddleware({
        pathname: "/admin/users",
        appOpen: true,
        isPublicPath: true,
      }),
    ).toBe(false);
  });

  it("keeps the marketing root public and verifies only a closed private gate", () => {
    expect(
      shouldVerifyUserInMiddleware({
        pathname: "/",
        appOpen: true,
        isPublicPath: true,
      }),
    ).toBe(false);
    expect(
      shouldVerifyUserInMiddleware({
        pathname: "/home",
        appOpen: false,
        isPublicPath: false,
      }),
    ).toBe(true);
  });

  it("does not verify public paths when the preview gate is closed", () => {
    expect(
      shouldVerifyUserInMiddleware({
        pathname: "/privacy",
        appOpen: false,
        isPublicPath: true,
      }),
    ).toBe(false);
  });
});

describe("middleware request correlation id", () => {
  // src/lib/api-auth.ts's requestIdFor() reads this exact header and
  // validates it against this exact UUID v4 shape before trusting it --
  // if middleware ever stopped generating one, or generated a different
  // shape, api-auth.ts would silently fall back to a NEW id per call
  // instead of the one this test confirms was set here.
  const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  it("sets a valid UUID v4 x-request-id on every response", async () => {
    const response = await middleware(new NextRequest("https://www.shoonaya.com/"));
    const requestId = response.headers.get("x-request-id");
    expect(requestId).toMatch(UUID_V4);
  });

  it("sets a different id on each request, not a fixed/reused value", async () => {
    const first = await middleware(new NextRequest("https://www.shoonaya.com/"));
    const second = await middleware(new NextRequest("https://www.shoonaya.com/"));
    expect(first.headers.get("x-request-id")).not.toBe(second.headers.get("x-request-id"));
  });

  it("sets the id on API routes too, not just pages", async () => {
    const response = await middleware(new NextRequest("https://www.shoonaya.com/api/calendar/upcoming"));
    expect(response.headers.get("x-request-id")).toMatch(UUID_V4);
  });

  it("ignores a client-supplied x-request-id rather than trusting it", async () => {
    // A caller (or an attacker) sending its own x-request-id must not be
    // able to make this request masquerade as an earlier one in logs --
    // middleware is the one place this id is allowed to originate.
    const response = await middleware(new NextRequest("https://www.shoonaya.com/", {
      headers: { "x-request-id": "not-a-real-uuid" },
    }));
    expect(response.headers.get("x-request-id")).toMatch(UUID_V4);
    expect(response.headers.get("x-request-id")).not.toBe("not-a-real-uuid");
  });
});
