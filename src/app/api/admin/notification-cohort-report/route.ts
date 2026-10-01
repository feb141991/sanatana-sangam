import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminCookieAuth } from '@/lib/admin-auth';
import { requireAdminAccess } from '@/lib/admin';
import { createAdminClient } from '@/lib/supabase-admin';
import { classifyCohort, cohortKey, type CohortProfileInput } from '@/lib/notification-cohort';

export const dynamic = 'force-dynamic';

type ProfileRow = CohortProfileInput & {
  id: string;
  tradition: string | null;
  sampradaya: string | null;
  calendar_profile: string | null;
  app_language: string | null;
  consent_activity_personalization: boolean | null;
};

function incr(counts: Record<string, number>, key: string) {
  counts[key] = (counts[key] ?? 0) + 1;
}

export async function GET(request: NextRequest) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;

  const admin = await requireAdminAccess();
  if ('response' in admin) return admin.response;

  try {
    const supabase = createAdminClient();

    const { data: profiles, error } = await supabase
      .from('profiles')
      .select(
        'id, tradition, sampradaya, calendar_profile, app_language, is_deleting, ' +
        'consent_activity_personalization, japa_reminder_enabled, wants_shloka_reminders, ' +
        'wants_nitya_reminders, wants_sankalpa_midpoint_reminders, wants_festival_reminders, ' +
        'wants_vrat_reminders, wants_tithi_reminders, wants_community_notifications, ' +
        'wants_family_notifications',
      );
    if (error) throw new Error(`Failed to load profiles: ${error.message}`);

    const rows = (profiles ?? []) as ProfileRow[];

    // "Recent, consented activity" -- only ever computed for, and reported
    // among, profiles that explicitly consented to activity personalization.
    // Never queried for a profile that hasn't consented.
    const consentedIds = rows
      .filter((row) => row.consent_activity_personalization === true)
      .map((row) => row.id);

    const sevenDaysAgoIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    let recentlyActiveConsentedIds = new Set<string>();
    if (consentedIds.length > 0) {
      const { data: activityRows, error: activityError } = await supabase
        .from('daily_sadhana')
        .select('user_id')
        .in('user_id', consentedIds)
        .eq('any_practice', true)
        .gte('date', sevenDaysAgoIso);
      if (activityError) throw new Error(`Failed to load recent activity: ${activityError.message}`);
      recentlyActiveConsentedIds = new Set(
        (activityRows ?? []).map((row) => (row as { user_id: string }).user_id),
      );
    }

    const byOptInCohort: Record<string, number> = {};
    const byTradition: Record<string, number> = {};
    const byCalendarProfile: Record<string, number> = {};
    const byLanguage: Record<string, number> = {};
    let eligibleForAnyDelivery = 0;
    let consented = 0;
    let recentlyActiveAmongConsented = 0;

    for (const row of rows) {
      const classification = classifyCohort(row);
      incr(byOptInCohort, cohortKey(classification));
      incr(byTradition, row.tradition ?? 'unset');
      incr(byCalendarProfile, row.calendar_profile ?? 'unset');
      incr(byLanguage, row.app_language ?? 'unset');
      if (classification.eligibleForAnyDelivery) eligibleForAnyDelivery++;
      if (row.consent_activity_personalization === true) {
        consented++;
        if (recentlyActiveConsentedIds.has(row.id)) recentlyActiveAmongConsented++;
      }
    }

    return NextResponse.json({
      status: 'ok',
      sampleSizeCaveat:
        `${rows.length} total profiles. This is a cohort-definition and pilot-sizing ` +
        'tool, not a statistically meaningful segmentation -- counts this small do not ' +
        'generalize and should not be reported as stable category behavior.',
      totalProfiles: rows.length,
      eligibleForAnyDelivery,
      byOptInCohort,
      byTradition,
      byCalendarProfile,
      byLanguage,
      activityPersonalization: {
        consented,
        notConsented: rows.length - consented,
        recentlyActiveAmongConsented,
        note: 'Recent-activity counts are computed only for, and only among, profiles that explicitly set consent_activity_personalization = true.',
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 },
    );
  }
}
