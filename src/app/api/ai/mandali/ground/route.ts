import { NextRequest, NextResponse } from 'next/server';
import { groundMandaliQuestion } from '@/lib/ai/mandali-rag';
import { rateLimitByIp, rejectLargeRequest } from '@/lib/api-security';

const MANDALI_GROUND_RATE_LIMIT = { keyPrefix: 'ai-mandali-ground', limit: 30, windowMs: 60_000 };

export async function POST(request: NextRequest) {
  const rejected = rejectLargeRequest(request, 16 * 1024);
  if (rejected) return rejected;

  const rateRejection = rateLimitByIp(request, MANDALI_GROUND_RATE_LIMIT);
  if (rateRejection) return rateRejection;

  try {
    const body = await request.json().catch(() => ({}));
    const question = typeof body.question === 'string' ? body.question.slice(0, 1000) : '';

    if (!question) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    const result = await groundMandaliQuestion({
      question,
      tradition: typeof body.tradition === 'string' ? body.tradition : null,
      language: typeof body.language === 'string' ? body.language : 'en',
      threadContext: typeof body.threadContext === 'string' ? body.threadContext.slice(0, 1000) : undefined,
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Grounding failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
