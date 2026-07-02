import { NextResponse } from 'next/server';
import { getDailyHoroscope, RASHI_LIST } from '@/lib/jyotish/rashiphal-data';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rashi = searchParams.get('rashi')?.toLowerCase();
  const dateParam = searchParams.get('date');
  const timeZone = searchParams.get('tz') ?? 'Asia/Kolkata';

  if (!rashi) {
    return NextResponse.json({ error: 'Missing rashi query parameter' }, { status: 400 });
  }

  const rashiExists = RASHI_LIST.some(r => r.key === rashi);
  if (!rashiExists) {
    return NextResponse.json({ error: `Invalid rashi sign. Must be one of: ${RASHI_LIST.map(r => r.key).join(', ')}` }, { status: 400 });
  }

  const parsedDate = dateParam ? new Date(dateParam) : new Date();
  if (Number.isNaN(parsedDate.getTime())) {
    return NextResponse.json({ error: 'Invalid date query parameter' }, { status: 400 });
  }

  const dailyHoroscope = getDailyHoroscope(rashi, parsedDate, timeZone);
  return NextResponse.json(dailyHoroscope);
}
