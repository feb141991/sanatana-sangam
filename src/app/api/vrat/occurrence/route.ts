import { NextRequest, NextResponse } from "next/server";
import { UUID_REGEX } from "@/lib/vrat-observation";
import { resolveObservableVratOccurrence } from "@/lib/calendar/vrat-observable-resolver";

export const runtime = "nodejs";

/**
 * Exact canonical reader lookup for Native/PWA deep links.
 * Unlike /calendar/upcoming, this endpoint is not bounded to a rolling window.
 */
export async function GET(req: NextRequest) {
  const occurrenceId = req.nextUrl.searchParams.get("occurrence_id");
  if (!occurrenceId || !UUID_REGEX.test(occurrenceId)) {
    return NextResponse.json({ error: "Invalid occurrence_id format" }, { status: 400 });
  }

  const resolution = await resolveObservableVratOccurrence(req, occurrenceId, {
    requireToday: false,
    requestedTimezone: req.nextUrl.searchParams.get("tz") || "Asia/Kolkata",
  });
  if (!resolution.success) {
    return NextResponse.json(
      { error: resolution.userMessage, code: resolution.errorCode },
      { status: resolution.statusCode },
    );
  }

  return NextResponse.json(
    { occurrence: resolution.result },
    {
      headers: {
        // The same occurrence UUID can resolve differently by the reader's
        // calendar profile and sampradaya. Never share this response through
        // a URL-keyed CDN cache.
        "Cache-Control": "private, no-store",
      },
    },
  );
}
