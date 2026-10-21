import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, verifyAdminCookieAuth } from "@/lib/admin-auth";
import { POST } from "./route";

vi.mock("@/lib/admin-auth", () => ({
  ADMIN_COOKIE: "sangam_admin_session",
  verifyAdminCookieAuth: vi.fn(),
}));

const fetchMock = vi.fn<typeof fetch>();

function makeRequest(body: unknown, cookie?: string): NextRequest {
  return new NextRequest("https://www.shoonaya.com/api/admin/api-probe", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-request-id": "outer-probe-request-id",
      ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify(body),
  });
}

describe("admin API probe route", () => {
  beforeEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    vi.mocked(verifyAdminCookieAuth).mockResolvedValue(null);
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("requires the admin session before probing any target", async () => {
    vi.mocked(verifyAdminCookieAuth).mockResolvedValueOnce(
      NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    );

    const response = await POST(makeRequest({ endpoint: "/api/health", method: "GET" }));

    expect(response.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects unregistered targets and non-read methods", async () => {
    const invalidTarget = await POST(makeRequest({ endpoint: "/api/user/export", method: "GET" }));
    const invalidMethod = await POST(makeRequest({ endpoint: "/api/health", method: "DELETE" }));

    expect(invalidTarget.status).toBe(400);
    expect(invalidMethod.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("omits all caller cookies for public probes and returns timing and both request IDs", async () => {
    fetchMock.mockResolvedValueOnce(new Response("{\"ok\":true}", {
      status: 200,
      headers: {
        "cache-control": "public, s-maxage=1800",
        "server-timing": "profile;dur=2, occurrences_query;dur=8, total;dur=12",
        "x-request-id": "inner-route-request-id",
      },
    }));

    const response = await POST(makeRequest(
      { endpoint: "/api/calendar/upcoming?days=7", method: "GET" },
      `${ADMIN_COOKIE}=admin-token; sb-access-token=must-not-forward`,
    ));
    const fetchInit = fetchMock.mock.calls[0]?.[1];
    const forwardedHeaders = new Headers(fetchInit?.headers);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(forwardedHeaders.get("cookie")).toBeNull();
    expect(body.result.status).toBe(200);
    expect(body.result.statusSource).toBe("upstream");
    expect(body.result.probeRequestId).toBe("outer-probe-request-id");
    expect(body.result.headers.upstreamRequestId).toBe("inner-route-request-id");
    expect(body.result.headers.serverTiming).toContain("occurrences_query;dur=8");
  });

  it("forwards only the admin cookie to the explicit admin probe", async () => {
    fetchMock.mockResolvedValueOnce(new Response("{}", { status: 200 }));

    const response = await POST(makeRequest(
      { endpoint: "/api/admin/stats", method: "GET" },
      `${ADMIN_COOKIE}=admin-token; sb-access-token=must-not-forward`,
    ));
    const forwardedHeaders = new Headers(fetchMock.mock.calls[0]?.[1]?.headers);

    expect(response.status).toBe(200);
    expect(forwardedHeaders.get("cookie")).toBe(`${ADMIN_COOKIE}=admin-token`);
  });

  it("reports an upstream 504 as an upstream response, not a probe timeout", async () => {
    fetchMock.mockResolvedValueOnce(new Response("upstream unavailable", { status: 504 }));

    const response = await POST(makeRequest({ endpoint: "/api/health", method: "GET" }));
    const body = await response.json();

    expect(body.result.status).toBe(504);
    expect(body.result.statusSource).toBe("upstream");
    expect(body.result.failureKind).toBeUndefined();
  });

  it("labels its own deadline separately and keeps it active while reading the response body", async () => {
    vi.useFakeTimers();
    fetchMock.mockImplementationOnce(async (_input, init) => {
      const response = new Response("ignored", { status: 200 });
      vi.spyOn(response, "text").mockImplementation(() => new Promise<string>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
      }));
      return response;
    });

    const pending = POST(makeRequest({ endpoint: "/api/health", method: "GET" }));
    await vi.advanceTimersByTimeAsync(15_000);
    const response = await pending;
    const body = await response.json();

    expect(body.result.status).toBe(504);
    expect(body.result.statusSource).toBe("probe");
    expect(body.result.failureKind).toBe("probe_timeout");
    expect(body.result.upstreamStatus).toBe(200);
    expect(body.result.statusText).toBe("Probe timeout (15000ms)");
  });
});
