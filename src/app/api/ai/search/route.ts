import { NextRequest, NextResponse } from 'next/server';
import { performSemanticPramanaSearch, type PramanaSearchCategory } from '@/lib/ai/semantic-search';
import { rateLimitByIp, rejectLargeRequest } from '@/lib/api-security';

const SEARCH_RATE_LIMIT = { keyPrefix: 'ai-search', limit: 60, windowMs: 60_000 };

export async function POST(request: NextRequest) {
  const rejected = rejectLargeRequest(request, 16 * 1024);
  if (rejected) return rejected;

  const rateRejection = rateLimitByIp(request, SEARCH_RATE_LIMIT);
  if (rateRejection) return rateRejection;

  try {
    const body = await request.json().catch(() => ({}));
    const query = typeof body.query === 'string' ? body.query.slice(0, 500) : '';
    const category = (typeof body.category === 'string' ? body.category : 'all') as PramanaSearchCategory;
    const tradition = typeof body.tradition === 'string' ? body.tradition.slice(0, 50) : 'all';
    const limit = typeof body.limit === 'number' ? Math.min(Math.max(body.limit, 1), 50) : 10;

    const result = await performSemanticPramanaSearch({
      query,
      category,
      tradition,
      limit,
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Search failed';
    return NextResponse.json({ error: message, results: [], total: 0 }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const rateRejection = rateLimitByIp(request, SEARCH_RATE_LIMIT);
  if (rateRejection) return rateRejection;

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.slice(0, 500) || '';
  const category = (searchParams.get('category') || 'all') as PramanaSearchCategory;
  const tradition = searchParams.get('tradition') || 'all';
  const limitParam = parseInt(searchParams.get('limit') || '10', 10);
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 50) : 10;

  const result = await performSemanticPramanaSearch({
    query,
    category,
    tradition,
    limit,
  });

  return NextResponse.json(result);
}
