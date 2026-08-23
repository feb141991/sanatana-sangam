import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

const mockResolveOccurrence = vi.fn();

vi.mock("@/lib/calendar/vrat-observable-resolver", () => ({
  resolveObservableVratOccurrence: (...args: unknown[]) => mockResolveOccurrence(...args),
}));

const OCCURRENCE_ID = "12345678-1234-1234-1234-123456789abc";

describe("GET /api/vrat/occurrence", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects malformed occurrence IDs before database resolution", async () => {
    const response = await GET(new NextRequest(
      "https://shoonaya.com/api/vrat/occurrence?occurrence_id=not-a-uuid",
    ));

    expect(response.status).toBe(400);
    expect(mockResolveOccurrence).not.toHaveBeenCalled();
  });

  it("performs an exact reader lookup without the Today restriction", async () => {
    const occurrence = {
      id: OCCURRENCE_ID,
      slug: "ekadashi",
      kind: "vrat",
      status: "resolved",
      isPrimary: true,
      reviewStatus: "reviewed",
      civilDate: "2025-01-10",
    };
    mockResolveOccurrence.mockResolvedValue({
      success: true,
      result: occurrence,
      user: {},
      occurrence: {},
    });

    const request = new NextRequest(
      `https://shoonaya.com/api/vrat/occurrence?occurrence_id=${OCCURRENCE_ID}`,
    );
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(mockResolveOccurrence).toHaveBeenCalledWith(request, OCCURRENCE_ID, {
      requireToday: false,
      requestedTimezone: "Asia/Kolkata",
    });
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    await expect(response.json()).resolves.toEqual({ occurrence });
  });

  it("preserves canonical resolver failures", async () => {
    mockResolveOccurrence.mockResolvedValue({
      success: false,
      statusCode: 404,
      errorCode: "OCCURRENCE_NOT_FOUND",
      userMessage: "This observance occurrence is unavailable",
    });

    const response = await GET(new NextRequest(
      `https://shoonaya.com/api/vrat/occurrence?occurrence_id=${OCCURRENCE_ID}`,
    ));

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      code: "OCCURRENCE_NOT_FOUND",
    });
  });
});
