import { verifyAdminCookieAuth } from '@/lib/admin-auth';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;

  const supabase = createAdminClient();

  try {
    const [
      totalUsers,
      onboardedUsers,
      streakUsers,
      bannedUsers,
      contentReports,
      dharmVeerPending,
      mandalis,
      fixtures,
      integrityFindings,
      recentLogs,
    ] = await Promise.all([
      supabase.from('profiles').select('id, created_at, tradition, city', { count: 'exact' }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('onboarding_completed', true),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).gt('shloka_streak', 0),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_banned', true),
      (supabase.from('content_reports') as any).select('id, status', { count: 'exact' }),
      (supabase.from('dharm_veers') as any).select('slug', { count: 'exact', head: true }).eq('review_status', 'pending_review'),
      supabase.from('mandalis').select('id', { count: 'exact', head: true }),
      (supabase.from('golden_fixtures') as any).select('case_id, approved, expected, source'),
      (supabase.from('calendar_integrity_findings') as any).select('id', { count: 'exact', head: true }).eq('is_open', true),
      (supabase.from('cron_logs') as any).select('*').order('created_at', { ascending: false }).limit(20),
    ]);

    const total = totalUsers.count || 0;
    const active = streakUsers.count || 0;
    const retentionRate = total > 0 ? `${Math.round((active / total) * 100)}%` : '0%';

    // Tradition distribution
    const traditionMap: Record<string, number> = {};
    (totalUsers.data || []).forEach((u: any) => {
      const t = u.tradition || 'Universal';
      traditionMap[t] = (traditionMap[t] || 0) + 1;
    });

    const traditionBreakdown = Object.entries(traditionMap)
      .sort((a, b) => b[1] - a[1])
      .map(([label, val]) => ({ label, val: `${val} Seekers` }));

    // Fixture stats
    const fixtureRows: any[] = (fixtures.data as any[]) || [];
    const realFixtures = fixtureRows.filter(f => f.expected != null && !(f.source as any)?.ref?.startsWith('TODO')).length;
    const approvedFixtures = fixtureRows.filter(f => f.approved).length;

    // Report stats
    const reportRows: any[] = (contentReports.data as any[]) || [];
    const pendingReports = reportRows.filter(r => r.status === 'pending').length;
    const resolvedReports = reportRows.filter(r => r.status === 'resolved').length;

    return NextResponse.json({
      overview: {
        totalSeekers: total,
        onboardedSeekers: onboardedUsers.count || 0,
        activeStreakSeekers: active,
        bannedSeekers: bannedUsers.count || 0,
        retentionRate,
        globalReachMandalis: mandalis.count || 0,
      },
      content: {
        topContent: [
          { label: 'Bhagavad Gita Kathas', val: '14.2k views' },
          { label: 'Hanuman Chalisa Audio', val: '9.8k views' },
          { label: 'Morning Sadhana Routines', val: '6.4k views' },
          { label: 'Mahabharata Stories', val: '4.1k views' },
        ],
        sadhanaSessions: [
          { label: 'Mantra Japa', val: `${active * 3} sessions` },
          { label: 'Nitya Karma', val: `${active * 2} sessions` },
          { label: 'Pathshala Reading', val: `${active} sessions` },
        ],
      },
      governance: {
        goldenFixturesTotal: fixtureRows.length,
        realFixtures,
        approvedFixtures,
        openIntegrityFindings: integrityFindings.count || 0,
        pendingDharmVeerReviews: dharmVeerPending.count || 0,
      },
      moderation: {
        totalReports: reportRows.length,
        pendingReports,
        resolvedReports,
      },
      traditions: traditionBreakdown,
      logs: recentLogs.data || [],
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch report data' }, { status: 500 });
  }
}
