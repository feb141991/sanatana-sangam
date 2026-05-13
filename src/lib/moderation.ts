import { createClient } from './supabase';

export type ReportType = 'post' | 'comment' | 'profile' | 'kul';

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
      status: 'pending'
    });

  if (error) throw error;
  return data;
}

export async function getPendingReports() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('reports')
    .select('*, reporter:profiles!reporter_id(username, full_name)')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function resolveReport(reportId: string, action: 'resolved' | 'dismissed') {
  const supabase = createClient();
  const { error } = await supabase
    .from('reports')
    .update({ status: action, resolved_at: new Date().toISOString() })
    .eq('id', reportId);

  if (error) throw error;
}
