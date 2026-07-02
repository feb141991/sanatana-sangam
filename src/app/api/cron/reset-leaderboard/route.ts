import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  // 1. Verify cron secret
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'Missing Supabase env vars' }, { status: 500 });
  }

  // 2. Initialize Supabase service role client
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // 3. Determine if we need to reset weekly or monthly
  // Vercel cron schedules are based on UTC.
  const now = new Date();
  
  // getUTCDay() returns 1 for Monday
  const isMonday = now.getUTCDay() === 1;
  // getUTCDate() returns 1 for the first day of the month
  const isFirstOfMonth = now.getUTCDate() === 1;

  // Allow manual override for testing or emergency
  const { searchParams } = new URL(request.url);
  const force = searchParams.get('force');

  const doWeekly = isMonday || force === 'weekly' || force === 'all';
  const doMonthly = isFirstOfMonth || force === 'monthly' || force === 'all';

  if (!doWeekly && !doMonthly) {
    return NextResponse.json({ message: 'No resets scheduled for today.' });
  }

  const updates: Record<string, number> = {};
  if (doWeekly) updates.weekly_seva = 0;
  if (doMonthly) updates.monthly_seva = 0;

  // 4. Perform bulk update
  // We use .not('id', 'is', null) to update all rows
  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .not('id', 'is', null);

  if (error) {
    console.error('Failed to reset leaderboard:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ 
    message: 'Leaderboard reset successful', 
    updates 
  });
}
