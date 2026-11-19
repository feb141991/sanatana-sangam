import { NextRequest, NextResponse } from 'next/server';
import { generateAstroChart, type BirthInput } from '@/lib/jyotish/astro-engine';
import { generateKundaliShastricReading } from '@/lib/jyotish/kundali-rag';
import { parseClockTime, parseIsoDate } from '@/lib/iso-date';
import { rateLimitByIp, rejectLargeRequest } from '@/lib/api-security';

const JYOTISH_READING_RATE_LIMIT = { keyPrefix: 'ai-jyotish-reading', limit: 20, windowMs: 60_000 };

export async function POST(req: NextRequest) {
  const rejected = rejectLargeRequest(req, 64 * 1024);
  if (rejected) return rejected;

  const rateRejection = rateLimitByIp(req, JYOTISH_READING_RATE_LIMIT);
  if (rateRejection) return rateRejection;

  try {
    const body = await req.json().catch(() => ({}));
    let chart = body.chart;

    // If chart not supplied directly, compute it from birth details
    if (!chart) {
      const { date_of_birth, time_of_birth, birth_lat, birth_lng, birth_timezone } = body;
      if (!date_of_birth || birth_lat === undefined || birth_lng === undefined || !birth_timezone) {
        return NextResponse.json(
          { error: 'Required: either "chart" object or { date_of_birth, birth_lat, birth_lng, birth_timezone }' },
          { status: 400 }
        );
      }

      const birthDate = parseIsoDate(date_of_birth, { minYear: 1800 });
      if (!birthDate.ok) {
        return NextResponse.json({ error: 'Invalid date_of_birth' }, { status: 400 });
      }

      let birthTime = '12:00';
      let timeUnknown = true;
      if (time_of_birth) {
        const parsedTime = parseClockTime(time_of_birth);
        if (parsedTime.ok) {
          birthTime = parsedTime.value;
          timeUnknown = false;
        }
      }

      const input: BirthInput = {
        date: birthDate.iso,
        time: birthTime,
        lat: Number(birth_lat),
        lng: Number(birth_lng),
        timezone: String(birth_timezone),
        timeUnknown,
      };

      chart = generateAstroChart(input);
    }

    const reading = await generateKundaliShastricReading({
      chart,
      language: body.language === 'hi' || body.language === 'pa' ? body.language : 'en',
      focusArea: body.focusArea,
    });

    return NextResponse.json({ success: true, reading });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Reading generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
