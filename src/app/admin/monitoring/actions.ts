'use server';

import { cookies } from 'next/headers';
import { createAdminClient } from '@/lib/supabase-admin';
import { verifyAdminToken, ADMIN_COOKIE } from '@/lib/admin-auth';
import { revalidatePath } from 'next/cache';

export type ReportStatus = 'pending' | 'reviewed' | 'actioned' | 'dismissed';

export async function resolveContentReport(
  reportId: string,
  status: ReportStatus = 'reviewed',
  adminNote?: string
) {
  const validStatuses = new Set(['reviewed', 'actioned', 'dismissed']);
  if (!validStatuses.has(status)) {
    throw new Error(`Invalid report status: "${status}". Allowed statuses: "reviewed", "actioned", "dismissed".`);
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value ?? '';
  const admin = await verifyAdminToken(token);
  if (!admin) {
    throw new Error('Forbidden');
  }

  const adminSupabase = createAdminClient();
  const updatePayload: { status: ReportStatus; admin_note?: string | null } = { status };
  if (adminNote !== undefined) {
    updatePayload.admin_note = adminNote;
  }

  // Atomic compare-and-set: only update if the report is currently 'pending'
  const { data, error } = await (adminSupabase.from('content_reports') as any)
    .update(updatePayload)
    .eq('id', reportId)
    .eq('status', 'pending')
    .select('id, status');

  revalidatePath('/admin/monitoring');

  if (error) {
    console.error('Failed to resolve report', error);
    throw new Error('Database error');
  }

  if (!data || data.length === 0) {
    throw new Error('Report conflict: this item was already reviewed or updated by another administrator.');
  }

  return { success: true, updated: data[0] };
}
