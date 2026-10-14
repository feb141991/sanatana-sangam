import { NextRequest, NextResponse } from "next/server";
import { readTrackingParams, resolveGetDestination } from "@/lib/app-store-links";

/**
 * The one link every campaign points at when it just wants people to get Shoonaya.
 * iPhone and iPad go to the App Store, Android to Google Play (or the beta page until Play is live),
 * everyone else, and every crawler or link-preview bot, to the website. UTM values ride along so the
 * stores' own campaign reports can show which message brought an install.
 *
 * The destination is never taken from the request: only the sanitised tracking values are, so this
 * cannot be used as an open redirect.
 */
export function GET(request: NextRequest) {
  const destination = resolveGetDestination({
    userAgent: request.headers.get("user-agent"),
    tracking: readTrackingParams(request.nextUrl.searchParams),
    env: process.env
  });
  const response = NextResponse.redirect(destination, 302);
  // The answer depends on the device, so it must not be cached or indexed.
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Vary", "User-Agent");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}
