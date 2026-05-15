import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function GET() {
  const supabase = createAdminClient();

  try {
    const [
      usersCount, 
      onboardedCount,
      activeCount, 
      reportsCount, 
      mandaliCount,
      traditionsData
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('onboarding_completed', true),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).gt('shloka_streak', 0),
      supabase.from('content_reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('mandalis').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('tradition')
    ]);

    // Calculate tradition distribution
    const traditionStats: Record<string, number> = {};
    (traditionsData.data as any[])?.forEach(p => {
      const t = p.tradition || 'Universal';
      traditionStats[t] = (traditionStats[t] || 0) + 1;
    });

    const total = usersCount.count || 0;
    const onboarded = onboardedCount.count || 0;
    const active = activeCount.count || 0;
    const retention = total > 0 ? Math.round((active / total) * 100) : 0;

    return NextResponse.json({
      totalSeekers: total,
      onboardedSeekers: onboarded,
      activeNow: active,
      pendingReports: reportsCount.count || 0,
      globalReach: mandaliCount.count || 0,
      intelligence: {
        retentionRate: `${retention}%`,
        topTradition: Object.entries(traditionStats).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Sanatan',
        traditionBreakdown: Object.entries(traditionStats).map(([label, val]) => ({ label, val: `${val} Seekers` })),
        topContent: [
          { label: 'Bhagavad Gita', val: '12.4k views' },
          { label: 'Hanuman Chalisa', val: '8.2k views' },
          { label: 'Morning Sadhana', val: '5.1k views' }
        ],
        finance: {
          mrr: 1424200,
          churn: '2.4%',
          renewalsDue: 128
        }
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
