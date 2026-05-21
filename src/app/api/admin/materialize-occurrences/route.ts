import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin';
import { materializeOccurrencesForYears } from '@/lib/calendar/materialize';

export async function POST(req: NextRequest) {
  const adminCheck = await requireAdminAccess();
  if ('response' in adminCheck) {
    return adminCheck.response;
  }
  const supabase = adminCheck.supabase;

  let bodyYear: number | undefined;
  let bodyCommit = false;
  if (req.method === 'POST') {
    try {
      const body = await req.json();
      if (body?.year && typeof body.year === 'number') {
        bodyYear = body.year;
      }
      if (body?.commit === true) {
        bodyCommit = true;
      }
    } catch {
      // Ignore
    }
  }

  const searchParams = req.nextUrl.searchParams;
  const yearParam = searchParams.get('year');
  const commitParam = searchParams.get('commit');
  const commit = bodyCommit || commitParam === 'true';
  
  let targetYears: number[] = [];
  if (yearParam) {
    const y = parseInt(yearParam, 10);
    if (!isNaN(y) && y > 0) {
      targetYears = [y];
    }
  } else if (bodyYear) {
    targetYears = [bodyYear];
  }

  if (targetYears.length === 0) {
    const currentYear = new Date().getFullYear();
    targetYears = [currentYear, currentYear + 1, currentYear + 2];
  }

  try {
    const result = await materializeOccurrencesForYears({
      supabase,
      targetYears,
      calculatedBy: 'admin_job',
      commit,
    });

    return NextResponse.json({
      success: true,
      message: commit
        ? `Materialized occurrences for years: ${targetYears.join(', ')}`
        : `Dry-run only. Add commit=true to persist calculated occurrences.`,
      ...result,
    });
  } catch (error: any) {
    console.error('[materialize-occurrences admin] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to materialize occurrences' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
