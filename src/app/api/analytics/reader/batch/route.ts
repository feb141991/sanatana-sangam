import { NextResponse } from 'next/server';
import { rateLimitByIp, rejectLargeRequest } from '@/lib/api-security';
import { emitEvent } from '@/lib/monitoring/events';
import {
  parseReaderAnalyticsEvent,
  sanitizeReaderAnalyticsContext,
} from '@/lib/reader-analytics';

const MAX_READER_ANALYTICS_BATCH_BODY_BYTES = 32_768;
const MAX_READER_ANALYTICS_BATCH_SIZE = 25;
const READER_ANALYTICS_BATCH_RATE_LIMIT = {
  keyPrefix: 'reader-analytics-batch',
  limit: 30,
  windowMs: 60_000,
};

export async function POST(req: Request) {
  const sizeRejection = rejectLargeRequest(req, MAX_READER_ANALYTICS_BATCH_BODY_BYTES);
  if (sizeRejection) return sizeRejection;

  const rateRejection = rateLimitByIp(req, READER_ANALYTICS_BATCH_RATE_LIMIT);
  if (rateRejection) return rateRejection;

  const body = await req.json().catch(() => null);
  const events: unknown[] = Array.isArray(body?.events) ? body.events : [];

  if (events.length === 0 || events.length > MAX_READER_ANALYTICS_BATCH_SIZE) {
    return NextResponse.json(
      { error: `events must contain between 1 and ${MAX_READER_ANALYTICS_BATCH_SIZE} items` },
      { status: 400 },
    );
  }

  const validatedEvents = events.map((item) => {
    const input = item && typeof item === 'object'
      ? item as Record<string, unknown>
      : {};
    return {
      event: parseReaderAnalyticsEvent(input.event),
      context: sanitizeReaderAnalyticsContext(input.context),
    };
  });

  if (validatedEvents.some((item) => !item.event)) {
    return NextResponse.json({ error: 'Batch contains an invalid reader event' }, { status: 400 });
  }

  for (const item of validatedEvents) {
    if (!item.event) continue;
    emitEvent({
      severity: 'P3',
      domain: 'app',
      route: '/api/analytics/reader/batch',
      context: {
        event: item.event,
        ...item.context,
      },
    });
  }

  return NextResponse.json({ ok: true, count: validatedEvents.length });
}
