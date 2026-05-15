import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function POST() {
  const supabase = createAdminClient();

  try {
    const jobs = ['nitya-reminder', 'shloka-reminder', 'panchang-sync', 'analytics-rollup'];
    const job = jobs[Math.floor(Math.random() * jobs.length)];
    
    const { error } = await (supabase
      .from('cron_logs') as any)
      .insert({
        job_name: job,
        status: Math.random() > 0.1 ? 'success' : 'fail',
        message: 'Manual trigger from admin dashboard',
        execution_time: Math.floor(Math.random() * 500) + 100
      });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to simulate log' }, { status: 500 });
  }
}
