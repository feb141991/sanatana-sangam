import { NextResponse } from 'next/server';
import { emitEvent } from '@/lib/monitoring/events';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const events = Array.isArray(body?.events) ? body.events : [];

  if (events.length === 0) {
    return NextResponse.json({ error: 'events are required' }, { status: 400 });
  }

  for (const item of events) {
    const event = typeof item?.event === 'string' ? item.event : '';
    const context = item?.context && typeof item.context === 'object' ? item.context : {};
    if (!event) continue;

    emitEvent({
      severity: 'P3',
      domain: 'app',
      route: '/api/analytics/reader/batch',
      context: {
        event,
        ...(context as Record<string, string | number | boolean | null>),
      },
    });
  }

  return NextResponse.json({ ok: true, count: events.length });
}
