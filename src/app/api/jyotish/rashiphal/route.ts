import { NextResponse } from 'next/server';
import { getDailyHoroscope, RASHI_LIST } from '@/lib/jyotish/rashiphal-data';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rashi = searchParams.get('rashi')?.toLowerCase();

  if (!rashi) {
    return NextResponse.json({ error: 'Missing rashi query parameter' }, { status: 400 });
  }

  const rashiExists = RASHI_LIST.some(r => r.key === rashi);
  if (!rashiExists) {
    return NextResponse.json({ error: `Invalid rashi sign. Must be one of: ${RASHI_LIST.map(r => r.key).join(', ')}` }, { status: 400 });
  }

  const dailyHoroscope = getDailyHoroscope(rashi);
  return NextResponse.json(dailyHoroscope);
}
