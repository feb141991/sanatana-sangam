import { NextRequest, NextResponse } from 'next/server';
import { rateLimitByIp, rejectLargeRequest, asBoundedString } from '@/lib/api-security';
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
    const clientMetadata = (body.clientMetadata || {}) as ClientMetadata;

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
    const message = err instanceof Error ? err.message : 'Unknown deflection error';
    return NextResponse.json(
      { error: 'Failed to process support deflection', details: message },
      { status: 500 }
    );
  }
}
