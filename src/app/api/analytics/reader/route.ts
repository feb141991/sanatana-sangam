import { NextResponse } from 'next/server';
import { emitEvent } from '@/lib/monitoring/events';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const event = typeof body?.event === 'string' ? body.event : '';
  const context = body?.context && typeof body.context === 'object' ? body.context : {};

  if (!event) {
    return NextResponse.json({ error: 'event is required' }, { status: 400 });
  }

  emitEvent({
    severity: 'P3',
    domain: 'app',
    route: '/api/analytics/reader',
    context: {
      event,
      ...(context as Record<string, string | number | boolean | null>),
    },
  });

  return NextResponse.json({ ok: true });
}
