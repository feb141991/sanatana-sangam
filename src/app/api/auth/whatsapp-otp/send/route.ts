import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { rejectLargeRequest, asBoundedString, rateLimitByIp, checkDurableRateLimit } from "@/lib/api-security";
import { createAdminClient } from "@/lib/supabase-admin";

const MAX_BODY_BYTES = 4 * 1024;
const IP_RATE_LIMIT = { keyPrefix: "whatsapp-otp:ip", limit: 10, windowMs: 10 * 60_000 };
const PHONE_RATE_LIMIT = 5;
const PHONE_WINDOW_MS = 10 * 60_000;

export async function POST(request: NextRequest) {
  const sizeError = rejectLargeRequest(request, MAX_BODY_BYTES);
  if (sizeError) return sizeError;

  const ipRejection = rateLimitByIp(request, IP_RATE_LIMIT);
  if (ipRejection) return ipRejection;

  const body = await request.json().catch(() => ({}));
  const rawPhone = asBoundedString(body?.phone, 25);
  if (!rawPhone) {
    return NextResponse.json({ error: "Valid phone number is required" }, { status: 400 });
  }

  // Sanitize phone digits
  const cleanPhone = rawPhone.replace(/[^+\d]/g, "");
  if (cleanPhone.length < 8 || cleanPhone.length > 20) {
    return NextResponse.json({ error: "Invalid phone number format" }, { status: 400 });
  }

  const phoneRejection = await checkDurableRateLimit(
    "whatsapp-otp:phone:" + cleanPhone,
    PHONE_RATE_LIMIT,
    PHONE_WINDOW_MS,
    createAdminClient()
  );
  if (phoneRejection) return phoneRejection;

  const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
  try {
    await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SID!)
      .verifications.create({ to: cleanPhone, channel: "whatsapp" });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
