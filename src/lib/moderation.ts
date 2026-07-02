import { createClient } from './supabase';
import { createClient as createServiceClient } from '@supabase/supabase-js';

export type ReportType = 'post' | 'comment' | 'profile' | 'kul';

/**
 * submitReport — called from client components (ReportDialog).
 * Uses the browser Supabase client so RLS applies and the reporter is
 * authenticated via the user's session.
 */
export async function submitReport(
  reporterId: string,
  targetId: string,
  targetType: ReportType,
  reason: string,
  details?: string
) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('reports')
    .insert({
      reporter_id: reporterId,
      target_id: targetId,
      target_type: targetType,
      reason: reason,
      details: details,
      status: 'pending',
    });

  if (error) throw error;
  return data;
}

/**
 * getServiceClient — returns a service-role Supabase client.
 * Only for use in server-side admin contexts (API routes, server actions).
 */
function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('[moderation] Missing Supabase service role credentials');
  return createServiceClient(url, key);
}

/**
 * getPendingReports — server-side admin function.
 * Uses service role client to bypass RLS — MUST only be called from
 * authenticated admin API routes (behind verifyAdminCookieAuth).
 */
export async function getPendingReports() {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('reports')
    .select('*, reporter:profiles!reporter_id(username, full_name)')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * resolveReport — server-side admin function.
 * Uses service role client to bypass RLS — MUST only be called from
 * authenticated admin API routes (behind verifyAdminCookieAuth).
 */
export async function resolveReport(reportId: string, action: 'resolved' | 'dismissed') {
  const supabase = getServiceClient();
  const { error } = await supabase
    .from('reports')
    .update({ status: action, resolved_at: new Date().toISOString() })
    .eq('id', reportId);

  if (error) throw error;
}
