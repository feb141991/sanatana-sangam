import { NextResponse } from "next/server";

/** Admin responses here carry signed image links and approval state: never cached by a browser or a proxy. */
export function noStoreJson(body: unknown, status = 200): NextResponse {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
}
