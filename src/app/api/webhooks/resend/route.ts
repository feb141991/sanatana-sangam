import { NextResponse } from 'next/server';

import { createServiceRoleSupabaseClient } from '@/lib/admin';
import { hashEmailAddress } from '@/lib/email-outbox';
import { readResendSuppressionEvent, verifyResendWebhookSignature } from '@/lib/resend-webhook';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_BODY_BYTES = 128_000;

async function readBoundedBody(request: Request, maxBytes: number) {
  const contentLength = request.headers.get('content-length');
  if (contentLength && /^\d+$/.test(contentLength) && Number(contentLength) > maxBytes) {
    return { tooLarge: true as const };
  }

  if (!request.body) return { tooLarge: false as const, bytes: new Uint8Array(), text: '' };
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > maxBytes) {
      await reader.cancel().catch(() => undefined);
      return { tooLarge: true as const };
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return { tooLarge: false as const, bytes, text: new TextDecoder('utf-8', { fatal: true }).decode(bytes) };
  } catch {
    return { tooLarge: false as const, bytes, text: null };
  }
}

export async function POST(request: Request) {
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
  const suppressionKey = process.env.EMAIL_SUPPRESSION_HMAC_KEY;
  if (!webhookSecret || !suppressionKey) {
    return NextResponse.json({ error: 'Email webhook is not configured' }, { status: 503 });
  }

  const body = await readBoundedBody(request, MAX_BODY_BYTES);
  if (body.tooLarge) return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
  if (body.text === null) return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 });

  const headers = {
    id: request.headers.get('svix-id'),
    timestamp: request.headers.get('svix-timestamp'),
    signature: request.headers.get('svix-signature'),
  };
  if (!verifyResendWebhookSignature(body.bytes, headers, webhookSecret)) {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(body.text);
  } catch {
    return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 });
  }

  const event = readResendSuppressionEvent(payload);
  if (!event || !headers.id) return NextResponse.json({ error: 'Invalid webhook event' }, { status: 400 });
  let emailHashes: string[];
  try {
    emailHashes = event.reason ? event.recipients.map((email) => hashEmailAddress(email, suppressionKey)) : [];
  } catch {
    return NextResponse.json({ error: 'Could not process email event' }, { status: 503 });
  }

  const { data, error } = await createServiceRoleSupabaseClient().rpc('process_resend_email_suppression_event', {
    p_event_id: headers.id,
    p_event_type: event.eventType,
    p_suppression_reason: event.reason,
    p_email_hashes: emailHashes,
  });
  if (error) {
    console.error('[resend-webhook] event persistence failed', error.code ?? 'unknown');
    return NextResponse.json({ error: 'Could not record email event' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, duplicate: data === false });
}
