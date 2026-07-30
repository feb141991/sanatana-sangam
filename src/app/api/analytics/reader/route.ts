import { NextResponse } from 'next/server';
import { rateLimitByIp, rejectLargeRequest } from '@/lib/api-security';
import { emitEvent } from '@/lib/monitoring/events';
import {
  parseReaderAnalyticsEvent,
  sanitizeReaderAnalyticsContext,
} from '@/lib/reader-analytics';

const MAX_READER_ANALYTICS_BODY_BYTES = 8_192;
const READER_ANALYTICS_RATE_LIMIT = {
  keyPrefix: 'reader-analytics',
  limit: 120,
  windowMs: 60_000,
};

export async function POST(req: Request) {
  const sizeRejection = rejectLargeRequest(req, MAX_READER_ANALYTICS_BODY_BYTES);
  if (sizeRejection) return sizeRejection;

  const rateRejection = rateLimitByIp(req, READER_ANALYTICS_RATE_LIMIT);
  if (rateRejection) return rateRejection;

  const body = await req.json().catch(() => null);
  const event = parseReaderAnalyticsEvent(body?.event);
  if (!event) {
    return NextResponse.json({ error: 'Invalid reader event' }, { status: 400 });
  }
  const context = sanitizeReaderAnalyticsContext(body?.context);

  emitEvent({
    severity: 'P3',
    domain: 'app',
    route: '/api/analytics/reader',
    context: {
      event,
      ...context,
    },
  });

  return NextResponse.json({ ok: true });
}
