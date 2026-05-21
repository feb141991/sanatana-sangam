import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin';
import {
  attachFestivalTrust,
  getFallbackFestivalCalendar,
  type Festival,
  type FestivalSourceRow,
} from '@/lib/festivals';
import { resolveVratSlug } from '@/lib/vrat-data';
import type { Database } from '@/types/database';

type FestivalRow = Pick<
  Database['public']['Tables']['festivals']['Row'],
  | 'id'
  | 'name'
  | 'date'
  | 'emoji'
  | 'description'
  | 'type'
  | 'tradition'
  | 'year'
  | 'source_name'
  | 'source_kind'
  | 'review_status'
  | 'verification_status'
  | 'verification_confidence'
  | 'verification_note'
  | 'suggested_date'
  | 'verification_run_at'
  | 'verification_type'
>;

type FestivalAdminStats = {
  total: number;
  reviewed: number;
  pendingReview: number;
  aiVerified: number;
  aiMismatches: number;
  aiUncertain: number;
  aiManualReview: number;
  suggestedDatePending: number;
  unsafeObservanceRoutes: number;
  lastVerificationRunAt: string | null;
};

function buildFestivalAdminStats(festivals: Festival[]): FestivalAdminStats {
  const unsafeObservanceRoutes = festivals.filter((festival) => {
    if (festival.type !== 'vrat') return false;
    return resolveVratSlug(festival.name) === null;
  }).length;

  const verificationRuns = festivals
    .map((festival) => festival.verification_run_at)
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => b.localeCompare(a));

  return {
    total: festivals.length,
    reviewed: festivals.filter((festival) => festival.review_status === 'reviewed').length,
    pendingReview: festivals.filter((festival) => festival.review_status !== 'reviewed').length,
    aiVerified: festivals.filter((festival) => festival.verification_status === 'verified').length,
    aiMismatches: festivals.filter((festival) => festival.verification_status === 'mismatch').length,
    aiUncertain: festivals.filter((festival) => festival.verification_status === 'uncertain').length,
    aiManualReview: festivals.filter((festival) => festival.verification_status === 'manual_review').length,
    suggestedDatePending: festivals.filter((festival) => Boolean(festival.suggested_date)).length,
    unsafeObservanceRoutes,
    lastVerificationRunAt: verificationRuns[0] ?? null,
  };
}

export async function GET(request: NextRequest) {
  const admin = await requireAdminAccess();
  if ('response' in admin) {
    return admin.response;
  }

  const yearParam = Number(request.nextUrl.searchParams.get('year'));
  const requestedYear = Number.isFinite(yearParam) && yearParam > 0
    ? yearParam
    : new Date().getFullYear();

  try {
    const [{ data: rows, error }, { data: yearsData, error: yearsError }] = await Promise.all([
      admin.supabase
        .from('festivals')
        .select('id, name, date, emoji, description, type, tradition, year, source_name, source_kind, review_status, verification_status, verification_confidence, verification_note, suggested_date, verification_run_at, verification_type')
        .eq('year', requestedYear)
        .order('date', { ascending: true }),
      admin.supabase
        .from('festivals')
        .select('year')
        .order('year', { ascending: true }),
    ]);

    if (error) throw error;
    if (yearsError) throw yearsError;

    const dbFestivals = ((rows ?? []) as FestivalRow[]).map((row) =>
      attachFestivalTrust(row as FestivalSourceRow)
    );
    const festivals = dbFestivals.length > 0 ? dbFestivals : getFallbackFestivalCalendar(requestedYear);
    const availableYears = Array.from(
      new Set([
        ...((yearsData ?? []).map((row) => row.year).filter((value): value is number => Number.isFinite(value))),
        ...(festivals.length > 0 ? [requestedYear] : []),
      ]),
    ).sort((a, b) => a - b);

    return NextResponse.json({
      festivals,
      year: requestedYear,
      source: dbFestivals.length > 0 ? 'database' : 'fallback',
      availableYears,
      stats: buildFestivalAdminStats(festivals),
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch festivals' }, { status: 500 });
  }
}
