import { NextRequest, NextResponse } from 'next/server';
import { rateLimitByIp, rejectLargeRequest, asBoundedString } from '@/lib/api-security';
import { boundClientMetadata } from '@/lib/support/ticket-access';
import { performSupportDeflection, type TicketCategory, type ClientMetadata } from '@/lib/support/support-rag';

export const dynamic = 'force-dynamic';

const DEFLECT_RATE_LIMIT = {
  keyPrefix: 'support-deflect',
  limit: 20,
  windowMs: 60 * 1000, // 20 requests per minute
};

export async function POST(req: NextRequest) {
  const largeRejection = rejectLargeRequest(req, 10 * 1024);
  if (largeRejection) return largeRejection;

  const rateRejection = rateLimitByIp(req, DEFLECT_RATE_LIMIT);
  if (rateRejection) return rateRejection;

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
    }

    const query = asBoundedString(body.query, 1000)?.trim();
    if (!query || query.length < 3) {
      return NextResponse.json({ error: 'Query must be at least 3 characters' }, { status: 400 });
    }

    const category = body.category as TicketCategory | undefined;
    const clientMetadata = boundClientMetadata(body.clientMetadata) as ClientMetadata;

    const result = await performSupportDeflection({
      query,
      category,
      clientMetadata,
    });

    return NextResponse.json({
      success: true,
      query,
      ...result,
    });
  } catch (err: unknown) {
    console.error('[Support API] deflection failed:', err instanceof Error ? err.name : 'unknown');
    return NextResponse.json(
      { error: 'We could not look that up right now. You can still send us a message.' },
      { status: 500 }
    );
  }
}
