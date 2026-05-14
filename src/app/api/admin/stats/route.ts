import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function GET() {
  const supabase = createAdminClient();

  try {
    const [usersCount, activeCount, reportsCount] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).gt('shloka_streak', 0),
      supabase.from('content_reports').select('*', { count: 'exact', head: true }).eq('status', 'pending')
    ]);

    return NextResponse.json({
      totalUsers: usersCount.count || 0,
      activeNow: activeCount.count || 0,
      reportsCount: reportsCount.count || 0,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
