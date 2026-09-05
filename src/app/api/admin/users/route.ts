import { verifyAdminCookieAuth } from '@/lib/admin-auth';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function GET(req: NextRequest) {
  const authError = await verifyAdminCookieAuth(req);
  if (authError) return authError;

  const { searchParams } = new URL(req.url);
  const query = searchParams.get('query');
  const segment = searchParams.get('segment') || 'all'; // all, new_signups, active_sadhaks, stale_users, banned, deletion_pending
  const sort = searchParams.get('sort') || 'newest'; // newest, streak, karma, name
  const userId = searchParams.get('userId');

  const supabase = createAdminClient();

  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    let request = (supabase.from('profiles') as any).select('*');

    if (userId) {
      request = request.eq('id', userId);
    } else {
      if (query) {
        request = request.or(`username.ilike.%${query}%,full_name.ilike.%${query}%,id.eq.${query}`);
      }

      // Lifecycle Segments
      if (segment === 'new_signups') {
        request = request.gte('created_at', sevenDaysAgo);
      } else if (segment === 'active_sadhaks') {
        request = request.or('shloka_streak.gt.0,karma_points.gt.50');
      } else if (segment === 'stale_users') {
        request = request.eq('shloka_streak', 0).lte('created_at', thirtyDaysAgo);
      } else if (segment === 'banned') {
        request = request.eq('is_banned', true);
      } else if (segment === 'deletion_pending') {
        request = request.or('is_deleting.eq.true,deletion_requested_at.not.is.null');
      }

      // Sorting
      if (sort === 'streak') {
        request = request.order('shloka_streak', { ascending: false });
      } else if (sort === 'karma') {
        request = request.order('karma_points', { ascending: false });
      } else if (sort === 'name') {
        request = request.order('full_name', { ascending: true, nullsFirst: false });
      } else {
        request = request.order('created_at', { ascending: false });
      }
    }

    const { data: users, error } = await request.limit(60);
    if (error) throw error;

    // High-Performance Head:True KPI Aggregations (Zero Payload Transfer)
    const [
      totalRes,
      newRes,
      activeRes,
      staleRes,
      bannedRes,
      deletingRes,
    ] = await Promise.all([
      (supabase.from('profiles') as any).select('id', { count: 'exact', head: true }),
      (supabase.from('profiles') as any).select('id', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
      (supabase.from('profiles') as any).select('id', { count: 'exact', head: true }).or('shloka_streak.gt.0,karma_points.gt.50').eq('is_banned', false),
      (supabase.from('profiles') as any).select('id', { count: 'exact', head: true }).eq('shloka_streak', 0).lte('created_at', thirtyDaysAgo).eq('is_banned', false),
      (supabase.from('profiles') as any).select('id', { count: 'exact', head: true }).eq('is_banned', true),
      (supabase.from('profiles') as any).select('id', { count: 'exact', head: true }).or('is_deleting.eq.true,deletion_requested_at.not.is.null'),
    ]);

    const stats = {
      total: totalRes.count || 0,
      newThisWeek: newRes.count || 0,
      activeSadhaks: activeRes.count || 0,
      staleUsers: staleRes.count || 0,
      banned: bannedRes.count || 0,
      deletionPending: deletingRes.count || 0,
    };

    return NextResponse.json({
      users: users || [],
      stats,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch seekers' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authError = await verifyAdminCookieAuth(req);
  if (authError) return authError;

  const { userId, action } = await req.json();
  const supabase = createAdminClient();

  try {
    if (action === 'ban' || action === 'unban') {
      const { error } = await (supabase.from('profiles') as any)
        .update({ is_banned: action === 'ban' })
        .eq('id', userId);
      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Action failed' }, { status: 500 });
  }
}
