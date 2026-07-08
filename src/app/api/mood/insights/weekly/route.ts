import { NextResponse, NextRequest } from 'next/server';
import { getApiUser } from '@/lib/api-auth';
import { getMoodInsights } from '@/lib/mood/insights';

export async function GET(request: NextRequest) {
  try {
    const { user, error: authError, supabase } = await getApiUser(request);
    if (!user || !supabase) {
      return NextResponse.json({ error: authError?.message ?? 'Unauthorized' }, { status: 401 });
    }
    const data = await getMoodInsights(7, supabase, user.id);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Weekly insights error:', error);
    return NextResponse.json({ error: 'Failed to fetch insights' }, { status: 500 });
  }
}
