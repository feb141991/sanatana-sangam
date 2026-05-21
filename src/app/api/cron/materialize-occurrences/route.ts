import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { materializeOccurrencesForYears } from '@/lib/calendar/materialize';

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const supabase = createAdminClient() as any;

  const searchParams = request.nextUrl.searchParams;
  const yearParam = searchParams.get('year');
  
  let targetYears: number[] = [];
  if (yearParam) {
    const y = parseInt(yearParam, 10);
    if (!isNaN(y) && y > 0) {
      targetYears = [y];
    }
  }

  if (targetYears.length === 0) {
    const currentYear = new Date().getFullYear();
    targetYears = [currentYear, currentYear + 1, currentYear + 2];
  }

  try {
    const commit = process.env.ENABLE_OBSERVANCE_MATERIALIZATION === 'true';
    const result = await materializeOccurrencesForYears({
      supabase,
      targetYears,
      calculatedBy: 'cron_job',
      commit,
    });

    return NextResponse.json({
      success: true,
      message: commit
        ? `Materialized occurrences for years: ${targetYears.join(', ')}`
        : 'Materialization is disabled by default. Set ENABLE_OBSERVANCE_MATERIALIZATION=true to persist generated rows.',
      ...result,
    });
  } catch (error: any) {
    console.error('[materialize-occurrences cron] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to materialize occurrences' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
