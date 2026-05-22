import { NextResponse } from 'next/server';
import { getMoodInsights } from '@/lib/mood/insights';

export async function GET() {
  try {
    const data = await getMoodInsights(30);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Monthly insights error:', error);
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to fetch insights' }, { status: 500 });
  }
}
