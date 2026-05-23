import { checkAdminAuth } from '@/lib/admin-auth';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin';
import {
  attachFestivalTrust,
  getFallbackFestivalCalendar,
  mapOccurrenceToFestival,
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
  aiNotChecked: number;
  aiManualReview: number;
  auditFailed: number;
  suggestedDatePending: number;
  unsafeObservanceRoutes: number;
  lastVerificationRunAt: string | null;
};

const FESTIVAL_SELECT_FULL = 'id, name, date, emoji, description, type, tradition, year, source_name, source_kind, review_status, verification_status, verification_confidence, verification_note, suggested_date, verification_run_at, verification_type';
const FESTIVAL_SELECT_LEGACY = 'id, name, date, emoji, description, type, tradition, year, source_name, source_kind, review_status';

function isMissingVerificationColumn(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return /verification_status|verification_confidence|verification_note|suggested_date|verification_run_at|verification_type/i.test(message);
}

function isMissingObservanceModel(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return /observance_occurrences|observance_definitions/i.test(message);
}

function buildFestivalAdminStats(festivals: Festival[]): FestivalAdminStats {
  const unsafeObservanceRoutes = festivals.filter((festival) => {
    if (festival.route_kind === 'vrat') {
      return !festival.route_slug;
    }
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
    aiNotChecked: festivals.filter((festival) => festival.verification_status === 'not_checked').length,
    aiManualReview: festivals.filter((festival) => festival.verification_status === 'manual_review').length,
    auditFailed: festivals.filter((festival) => festival.audit_status === 'failed').length,
    suggestedDatePending: festivals.filter((festival) => Boolean(festival.suggested_date)).length,
    unsafeObservanceRoutes,
    lastVerificationRunAt: verificationRuns[0] ?? null,
  };
}

export async function GET(request: NextRequest) {
  const authError = checkAdminAuth(request as any);
  if (authError) return authError;

  const admin = await requireAdminAccess();
  if ('response' in admin) {
    return admin.response;
  }

  const yearParam = Number(request.nextUrl.searchParams.get('year'));
  const requestedYear = Number.isFinite(yearParam) && yearParam > 0
    ? yearParam
    : new Date().getFullYear();

  try {
    let yearsData: Array<{ year: number }> | null = null;
    let festivals: Festival[] = [];
    let source: 'database' | 'fallback' = 'database';

    const occYears = await admin.supabase
      .from('observance_occurrences')
      .select('year')
      .order('year', { ascending: true });

    if (!occYears.error) {
      yearsData = (occYears.data ?? []) as Array<{ year: number }>;
      const occRows = await admin.supabase
        .from('observance_occurrences')
        .select('*, observance_definitions(*)')
        .eq('year', requestedYear)
        .order('date', { ascending: true });

      if (occRows.error) throw occRows.error;

      const dbFestivals = (occRows.data ?? []).map((row) => mapOccurrenceToFestival(row));
      festivals = dbFestivals.length > 0 ? dbFestivals : getFallbackFestivalCalendar(requestedYear);
      if (dbFestivals.length === 0) source = 'fallback';
    } else {
      if (!isMissingObservanceModel(occYears.error)) {
        throw occYears.error;
      }

      const legacyYears = await admin.supabase
        .from('festivals')
        .select('year')
        .order('year', { ascending: true });
      if (legacyYears.error) throw legacyYears.error;
      yearsData = (legacyYears.data ?? []) as Array<{ year: number }>;

      let rows: FestivalRow[] | null = null;
      const primary = await admin.supabase
        .from('festivals')
        .select(FESTIVAL_SELECT_FULL)
        .eq('year', requestedYear)
        .order('date', { ascending: true });

      if (primary.error && isMissingVerificationColumn(primary.error)) {
        const legacy = await admin.supabase
          .from('festivals')
          .select(FESTIVAL_SELECT_LEGACY)
          .eq('year', requestedYear)
          .order('date', { ascending: true });
        if (legacy.error) throw legacy.error;
        rows = (legacy.data ?? []) as FestivalRow[];
      } else if (primary.error) {
        throw primary.error;
      } else {
        rows = (primary.data ?? []) as FestivalRow[];
      }

      const dbFestivals = (rows ?? []).map((row) =>
        attachFestivalTrust(row as FestivalSourceRow)
      );
      festivals = dbFestivals.length > 0 ? dbFestivals : getFallbackFestivalCalendar(requestedYear);
      if (dbFestivals.length === 0) source = 'fallback';
    }

    const availableYears = Array.from(
      new Set([
        ...((yearsData ?? []).map((row) => row.year).filter((value): value is number => Number.isFinite(value))),
        ...(festivals.length > 0 ? [requestedYear] : []),
      ]),
    ).sort((a, b) => a - b);

    return NextResponse.json({
      festivals,
      year: requestedYear,
      source,
      availableYears,
      stats: buildFestivalAdminStats(festivals),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch festivals';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
