import { NextRequest, NextResponse } from 'next/server';
import {
  generateDharmVeerSocialPost,
  generateFestivalSeoCampaign,
  generateSanctuaryNewsletter,
} from '@/lib/ai/marketing-rag';
import { rateLimitByIp, rejectLargeRequest } from '@/lib/api-security';

const MARKETING_RATE_LIMIT = { keyPrefix: 'ai-marketing', limit: 20, windowMs: 60_000 };

export async function POST(request: NextRequest) {
  const rejected = rejectLargeRequest(request, 32 * 1024);
  if (rejected) return rejected;

  const rateRejection = rateLimitByIp(request, MARKETING_RATE_LIMIT);
  if (rateRejection) return rateRejection;

  try {
    const body = await request.json().catch(() => ({}));
    const type = body.type;

    if (type === 'dharm-veer') {
      const result = await generateDharmVeerSocialPost({
        heroId: typeof body.heroId === 'string' ? body.heroId : undefined,
        date: typeof body.date === 'string' ? body.date : undefined,
        platform: body.platform === 'twitter' || body.platform === 'linkedin' ? body.platform : 'instagram',
        language: typeof body.language === 'string' ? body.language : 'en',
      });
      return NextResponse.json({ success: true, type, data: result });
    }

    if (type === 'festival-seo') {
      if (!body.festivalSlug || !body.city) {
        return NextResponse.json({ error: 'Missing festivalSlug or city' }, { status: 400 });
      }
      const result = await generateFestivalSeoCampaign({
        festivalSlug: String(body.festivalSlug),
        city: String(body.city),
        year: typeof body.year === 'number' ? body.year : undefined,
      });
      return NextResponse.json({ success: true, type, data: result });
    }

    if (type === 'newsletter') {
      const result = await generateSanctuaryNewsletter({
        weekStartDate: typeof body.weekStartDate === 'string' ? body.weekStartDate : new Date().toISOString().slice(0, 10),
        tradition: typeof body.tradition === 'string' ? body.tradition : undefined,
      });
      return NextResponse.json({ success: true, type, data: result });
    }

    return NextResponse.json(
      { error: 'Invalid marketing campaign type. Choose "dharm-veer", "festival-seo", or "newsletter".' },
      { status: 400 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Marketing generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
