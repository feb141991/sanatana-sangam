import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendPushNotification } from '@/lib/push-server';
import { resolveVratSlug } from '@/lib/vrat-data';
import { mapOccurrenceToFestival, getFallbackFestivalCalendar } from '@/lib/festivals';
import { buildCalendarIntegrityReport, type CalendarIntegrityRow } from '@/lib/calendar/integrity';
import * as fs from 'fs';
import * as path from 'path';

function getPanchangEngineVersion(): string {
  try {
    const pkgPath = path.resolve(process.cwd(), 'packages/panchang-engine/package.json');
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      return pkg.version || '0.1.0';
    }
  } catch (err) {
    console.warn('[calendar-health] Failed to read engine version:', err);
  }
  return '0.1.0';
}

function isMissingObservanceModel(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return /observance_occurrences|observance_definitions/i.test(message);
}

// ─── Calendar Health Cron ─────────────────────────────────────────────────────
// Schedule: monthly (see vercel.json)
//
// Fires once a year as an early warning that the festival calendar needs to be
// refreshed for the coming year. It:
//   1. Counts upcoming festivals in the DB (date >= today).
//   2. If < 60 remaining, sends a push notification to the admin user
//      and inserts a notification into the DB for the admin bell.
//   3. Always returns a JSON health report — useful for manual spot-checks.
// ─────────────────────────────────────────────────────────────────────────────

const ADMIN_EMAIL = 'career.prince@gmail.com';
const LOW_THRESHOLD = 60; // warn when fewer than this many festivals remain

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 500 });
  }
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'Missing Supabase env vars' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const today = new Date().toISOString().split('T')[0];

  const currentYear = new Date().getFullYear();

  let festivals = getFallbackFestivalCalendar(currentYear);
  let rawOccurrenceRows: CalendarIntegrityRow[] = [];
  const occRows = await supabase
    .from('observance_occurrences')
    .select('id, date, year, final_date_source, manual_date_override, locked_for_regeneration, source_provenance, review_status, verification_status, verification_confidence, verification_note, suggested_date, verification_run_at, audit_status, audit_failure_reason, audit_retry_count, last_audited_at, observance_definitions(slug, display_name, kind, tradition, emoji, description, verification_type, route_kind, route_slug, active)')
    .order('date', { ascending: true });

  if (!occRows.error) {
    rawOccurrenceRows = (occRows.data ?? []) as CalendarIntegrityRow[];
    const festivalsFromDb = (occRows.data ?? []).map((row) => mapOccurrenceToFestival(row));
    festivals = festivalsFromDb.length > 0 ? festivalsFromDb : getFallbackFestivalCalendar(currentYear);
  } else if (!isMissingObservanceModel(occRows.error)) {
    return NextResponse.json({ error: occRows.error.message }, { status: 500 });
  }

  const remaining = festivals.filter((festival) => festival.date >= today).length;
  const nextYear  = currentYear + 1;
  const needsRefresh = remaining < LOW_THRESHOLD;
  const rowsByYear = festivals.reduce<Record<string, number>>((acc, festival) => {
    const key = String(festival.year ?? (festival.date ? new Date(festival.date).getFullYear() : currentYear));
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  const pendingReview = festivals.filter((festival) => festival.review_status !== 'reviewed').length;
  const mismatches = festivals.filter((festival) => festival.verification_status === 'mismatch').length;
  const notChecked = festivals.filter((festival) => festival.verification_status === 'not_checked').length;
  const auditFailed = festivals.filter((festival) => festival.audit_status === 'failed').length;
  const suggestedDatePending = festivals.filter((festival) => Boolean(festival.suggested_date)).length;
  const unsafeObservanceRoutes = festivals.filter((festival) => (
    (festival.type === 'vrat' || festival.route_kind === 'vrat') &&
    festival.route_slug === null &&
    resolveVratSlug(festival.name) === null
  )).length;
  const verificationRuns = festivals
    .map((festival) => festival.verification_run_at)
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => b.localeCompare(a));
  const integrityYears = [currentYear, nextYear];
  const integrity = rawOccurrenceRows.length > 0
    ? buildCalendarIntegrityReport(rawOccurrenceRows, integrityYears)
    : null;

  if (integrity) {
    const engineVersion = getPanchangEngineVersion();
    const nowIso = new Date().toISOString();
    const activeFindings: Array<{
      slug: string;
      display_name: string;
      year: number;
      stored_date: string | null;
      engine_date: string | null;
      candidate_dates: string[] | null;
      issue_type: 'engine_curated_mismatch' | 'missing_external_source' | 'multiple_candidates_needs_review' | 'unreviewed_or_not_verified';
      reason: string;
      engine_version: string;
      is_open: boolean;
      last_seen_at: string;
    }> = [];

    const lists = [
      { issues: integrity.missingExternalSource, type: 'missing_external_source' as const },
      { issues: integrity.engineCuratedMismatch, type: 'engine_curated_mismatch' as const },
      { issues: integrity.multipleCandidatesNeedsReview, type: 'multiple_candidates_needs_review' as const },
      { issues: integrity.unreviewedOrNotVerified, type: 'unreviewed_or_not_verified' as const },
    ];

    for (const { issues, type } of lists) {
      for (const issue of issues) {
        activeFindings.push({
          slug: issue.slug,
          display_name: issue.displayName,
          year: issue.year,
          stored_date: issue.storedDate ?? null,
          engine_date: issue.engineDate ?? null,
          candidate_dates: issue.candidateDates ?? null,
          issue_type: type,
          reason: issue.reason,
          engine_version: engineVersion,
          is_open: true,
          last_seen_at: nowIso,
        });
      }
    }

    const uniqueFindingsMap = new Map<string, typeof activeFindings[number]>();
    for (const finding of activeFindings) {
      const key = `${finding.slug}:${finding.year}:${finding.issue_type}`;
      if (uniqueFindingsMap.has(key)) {
        const existing = uniqueFindingsMap.get(key)!;
        existing.reason = `${existing.reason} | ${finding.reason}`;
      } else {
        uniqueFindingsMap.set(key, finding);
      }
    }
    const deduplicatedFindings = Array.from(uniqueFindingsMap.values());

    const seenFindingIds: string[] = [];
    if (deduplicatedFindings.length > 0) {
      const { data: upserted, error: upsertError } = await supabase
        .from('calendar_integrity_findings')
        .upsert(
          deduplicatedFindings,
          { onConflict: 'slug,year,issue_type' }
        )
        .select('id');

      if (upsertError) {
        console.error('[calendar-health] Error upserting findings:', upsertError);
      } else if (upserted) {
        seenFindingIds.push(...upserted.map((r: any) => r.id));
      }
    }

    let resolveQuery = supabase
      .from('calendar_integrity_findings')
      .update({ is_open: false, resolved_at: nowIso })
      .eq('is_open', true)
      .in('year', integrityYears);

    if (seenFindingIds.length > 0) {
      resolveQuery = resolveQuery.filter('id', 'not.in', `(${seenFindingIds.join(',')})`);
    }

    const { error: resolveError } = await resolveQuery;

    if (resolveError) {
      console.error('[calendar-health] Error resolving findings:', resolveError);
    }
  }
  const hasIntegrityIssues = Boolean(integrity?.issueCount);
  const needsAttention = needsRefresh || hasIntegrityIssues;

  // Always log to the response
  const report = {
    checked_at:    new Date().toISOString(),
    upcoming_festivals: remaining,
    threshold:     LOW_THRESHOLD,
    needs_refresh: needsRefresh,
    next_year:     nextYear,
    rows_by_year: rowsByYear,
    pending_review: pendingReview,
    ai_mismatches: mismatches,
    ai_not_checked: notChecked,
    audit_failed: auditFailed,
    suggested_date_pending: suggestedDatePending,
    unsafe_observance_routes: unsafeObservanceRoutes,
    last_verification_run_at: verificationRuns[0] ?? null,
    deterministic_integrity: integrity,
  };

  if (!needsAttention) {
    return NextResponse.json({ ok: true, message: 'Calendar is healthy', ...report });
  }

  // Find the admin user's profile ID by email
  const { data: adminUser } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', ADMIN_EMAIL)
    .single();

  // Fallback: list auth users and match by email
  let adminId: string | null = adminUser?.id ?? null;
  if (!adminId) {
    const { data: authList } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    const match = authList?.users?.find(u => u.email === ADMIN_EMAIL);
    adminId = match?.id ?? null;
  }

  const title = hasIntegrityIssues
    ? '📅 Festival Calendar integrity needs review'
    : `📅 Festival Calendar needs refresh for ${nextYear}`;
  const body = hasIntegrityIssues
    ? `Calendar audit found ${integrity?.issueCount ?? 0} issue(s): ${integrity?.engineCuratedMismatch.length ?? 0} engine mismatch, ${integrity?.missingExternalSource.length ?? 0} missing source, ${integrity?.multipleCandidatesNeedsReview.length ?? 0} ambiguous candidate.`
    : `Only ${remaining} festivals remain in the DB. Add ${nextYear} entries via Admin → Festivals so reminders and countdowns keep working.`;

  // Insert into notifications table (shows in the admin's bell)
  if (adminId) {
    await supabase.from('notifications').insert({
      user_id: adminId,
      title,
      body,
      type:   'system',
      read:   false,
    });
  }

  // Send push to admin via OneSignal (best-effort)
  try {
    if (adminId) {
      await sendPushNotification({
        userIds: [adminId],
        title,
        body,
        url: '/admin',
      });
    }
  } catch (pushErr) {
    console.warn('[calendar-health] push failed (non-fatal):', pushErr);
  }

  return NextResponse.json({
    ok: true,
    message: hasIntegrityIssues
      ? `Calendar integrity issue(s) found — admin notified (${integrity?.issueCount ?? 0})`
      : `Calendar low — admin notified (${remaining} upcoming festivals)`,
    admin_notified: Boolean(adminId),
    ...report,
  });
}
