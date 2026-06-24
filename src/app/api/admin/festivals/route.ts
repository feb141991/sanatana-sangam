import { verifyAdminCookieAuth } from '@/lib/admin-auth';
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
import type { Json } from '@/types/database';

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

type ReviewActionBody = {
  occurrenceId?: unknown;
  date?: unknown;
  reviewNotes?: unknown;
  sourceName?: unknown;
};

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
  const authError = await verifyAdminCookieAuth(request);
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

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime());
}

export async function PATCH(request: NextRequest) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;

  const admin = await requireAdminAccess();
  if ('response' in admin) {
    return admin.response;
  }

  try {
    const body = await request.json() as ReviewActionBody;
    const occurrenceId = readString(body.occurrenceId);
    const dateOverride = readString(body.date);
    const reviewNotes = readString(body.reviewNotes)
      ?? 'Reviewed from Shoonaya admin festival calendar';
    const sourceName = readString(body.sourceName)
      ?? 'Shoonaya admin review';

    if (!occurrenceId) {
      return NextResponse.json({ error: 'Missing occurrenceId' }, { status: 400 });
    }
    if (dateOverride && !isIsoDate(dateOverride)) {
      return NextResponse.json({ error: 'Date must be YYYY-MM-DD' }, { status: 400 });
    }

    const { data: existing, error: fetchError } = await admin.supabase
      .from('observance_occurrences')
      .select('id, date, manual_date_override, source_provenance')
      .eq('id', occurrenceId)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!existing) {
      return NextResponse.json({ error: 'Occurrence not found' }, { status: 404 });
    }

    const reviewedDate = dateOverride ?? existing.manual_date_override ?? existing.date;
    const previousProvenance = existing.source_provenance && typeof existing.source_provenance === 'object'
      ? existing.source_provenance
      : {};
    const sourceProvenance: Json = {
      ...previousProvenance,
      source_kind: 'curated',
      source_name: sourceName,
      reviewed_via: 'admin_festival_calendar',
      reviewed_date: reviewedDate,
    };

    const nowIso = new Date().toISOString();
    const updatePayload: Database['public']['Tables']['observance_occurrences']['Update'] = {
      date: reviewedDate,
      review_status: 'reviewed',
      verification_status: 'verified',
      verification_confidence: 'high',
      verification_note: reviewNotes,
      audit_status: 'completed',
      audit_failure_reason: null,
      audit_retry_count: 0,
      last_audited_at: nowIso,
      verification_run_at: nowIso,
      reviewed_at: nowIso,
      review_notes: reviewNotes,
      source_provenance: sourceProvenance,
      final_date_source: dateOverride ? 'manual_override' : 'calculation_engine_reviewed',
      manual_date_override: dateOverride ?? existing.manual_date_override,
      manual_override_reason: dateOverride
        ? 'Date corrected and approved from Shoonaya admin festival calendar'
        : existing.manual_date_override
          ? 'Previously manually corrected date approved from Shoonaya admin festival calendar'
          : null,
    };

    const { data: updated, error: updateError } = await admin.supabase
      .from('observance_occurrences')
      .update(updatePayload)
      .eq('id', occurrenceId)
      .select('*, observance_definitions(*)')
      .maybeSingle();

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      festival: updated ? mapOccurrenceToFestival(updated) : null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update observance review';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
